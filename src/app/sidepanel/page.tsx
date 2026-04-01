"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSidePanelSession } from "@/hooks/use-meet-session";
import { useParticipants } from "@/hooks/use-participants";
import { useSession } from "@/hooks/use-session";
import { usePresence } from "@/hooks/use-presence";
import { shuffleParticipants } from "@/lib/shuffle";
import { createSession, addLateJoiner } from "@/lib/session-store";
import { getMainStageUrl } from "@/lib/meet-sdk";

import { ParticipantList } from "@/components/participant-list";
import { AddParticipantDialog } from "@/components/add-participant-dialog";
import { SessionView } from "@/components/session-view";
import { CompletedView } from "@/components/completed-view";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  ShuffleIcon,
  UsersIcon,
  SpinnerGapIcon,
  TimerIcon,
} from "@phosphor-icons/react";

const DEFAULT_TIMER_SECONDS = 90;

export default function SidePanelPage() {
  const { client, error: sdkError, isReady: sdkReady } = useSidePanelSession();
  const {
    participants,
    isLoading: isFetching,
    error: fetchError,
    fetchFromMeet,
    addManual,
    remove,
    toggleExclude,
    setPin,
  } = useParticipants();

  const [meetingCode, setMeetingCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const [isCreating, setIsCreating] = useState(false);

  const { session, isLoading: sessionLoading } = useSession(meetingCode);
  usePresence(meetingCode, userId, userDisplayName, session);

  // Get meeting code from the Meet SDK on mount
  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    async function init() {
      if (!client) return;
      try {
        const info = await client.getMeetingInfo();
        if (!cancelled) setMeetingCode(info.meetingCode);
      } catch {
        /* running outside meet or SDK error */
      }
    }
    init();
    return () => { cancelled = true; };
  }, [client]);

  // Set a stable user ID. We use sessionStorage so it persists across reloads in the same tab.
  const userIdInitialized = useRef(false);
  useEffect(() => {
    if (userIdInitialized.current) return;
    userIdInitialized.current = true;

    let id = sessionStorage.getItem("meet_shuffler_user_id");
    let name = sessionStorage.getItem("meet_shuffler_user_name");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("meet_shuffler_user_id", id);
    }
    if (!name) {
      name = `User ${id.slice(0, 4)}`;
      sessionStorage.setItem("meet_shuffler_user_name", name);
    }
    setUserId(id);
    setUserDisplayName(name);
  }, []);

  // Late joiner: auto-add self to an active session
  const sessionState = session?.state ?? null;
  const shuffledOrderLength = session?.shuffledOrder.length ?? 0;
  const shuffledOrder = session?.shuffledOrder;
  useEffect(() => {
    if (sessionState !== "active" || !meetingCode || !userId || !userDisplayName || !shuffledOrder) return;

    const alreadyInList = shuffledOrder.some((p) => p.id === userId);
    if (!alreadyInList) {
      addLateJoiner(meetingCode, {
        id: userId,
        displayName: userDisplayName,
        position: shuffledOrderLength + 1,
        isPinned: false,
        status: "pending",
      });
    }
  }, [sessionState, meetingCode, userId, userDisplayName, shuffledOrderLength, shuffledOrder]);

  const isOrganizer = session?.organizerId === userId;

  const handleShuffleAndStart = useCallback(async () => {
    if (!meetingCode || !userId || !userDisplayName) return;
    setIsCreating(true);
    try {
      const order = shuffleParticipants(participants);
      await createSession(
        meetingCode,
        userId,
        userDisplayName,
        order,
        timerEnabled,
        timerSeconds,
      );

      // Try to notify other participants via Meet SDK activity
      if (client) {
        try {
          await client.startActivity({
            mainStageUrl: `${getMainStageUrl()}?code=${meetingCode}`,
            additionalData: meetingCode,
          });
        } catch {
          /* activity notification is best-effort */
        }
      }
    } finally {
      setIsCreating(false);
    }
  }, [meetingCode, userId, userDisplayName, participants, timerEnabled, timerSeconds, client]);

  const activeCount = participants.filter((p) => !p.isExcluded).length;
  const hasParticipants = participants.length > 0;

  // Loading state
  if (!sdkReady || sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <SpinnerGapIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <ShuffleIcon className="size-5 text-primary" />
        <div>
          <h1 className="text-sm font-semibold leading-none">Meet Shuffler</h1>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Randomize your standup order
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {/* SDK Error */}
        {sdkError ? (
          <Card size="sm">
            <CardContent className="text-[10px] text-muted-foreground">
              Running outside Meet — SDK features disabled. You can still add
              participants manually.
            </CardContent>
          </Card>
        ) : null}

        {/* Active session mode */}
        {session?.state === "active" && meetingCode ? (
          <SessionView
            session={session}
            meetingCode={meetingCode}
            isOrganizer={isOrganizer}
          />
        ) : session?.state === "completed" && meetingCode ? (
          /* Completed mode */
          <CompletedView
            session={session}
            meetingCode={meetingCode}
            isOrganizer={isOrganizer}
          />
        ) : (
          /* Setup mode */
          <>
            {/* Fetch Error */}
            {fetchError ? (
              <Card size="sm">
                <CardContent className="text-[10px] text-destructive">
                  {fetchError}
                </CardContent>
              </Card>
            ) : null}

            {/* Participant Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchFromMeet(client)}
                disabled={!client || isFetching}
                className="flex-1"
              >
                {isFetching ? (
                  <SpinnerGapIcon
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <UsersIcon data-icon="inline-start" />
                )}
                {isFetching ? "Fetching..." : "Fetch from Meet"}
              </Button>
              <AddParticipantDialog onAdd={addManual} />
            </div>

            {/* Participant List */}
            <ParticipantList
              participants={participants}
              onToggleExclude={toggleExclude}
              onSetPin={setPin}
              onRemove={remove}
            />

            {hasParticipants ? (
              <>
                <Separator />

                {/* Timer Setting */}
                <div className="flex items-center gap-2 px-1">
                  <TimerIcon className="size-3.5 text-muted-foreground" />
                  <span className="flex-1 text-xs">Timer per person</span>
                  <Input
                    type="number"
                    min={10}
                    max={600}
                    value={timerSeconds}
                    onChange={(e) =>
                      setTimerSeconds(Math.max(10, Number(e.target.value)))
                    }
                    className="h-6 w-14 px-1.5 text-center text-xs"
                    disabled={!timerEnabled}
                  />
                  <span className="text-[10px] text-muted-foreground">sec</span>
                  <Switch
                    checked={timerEnabled}
                    onCheckedChange={setTimerEnabled}
                  />
                </div>

                {/* Shuffle & Start Button */}
                <Button
                  onClick={handleShuffleAndStart}
                  disabled={activeCount < 2 || isCreating || !meetingCode}
                  className="w-full"
                  size="lg"
                >
                  <ShuffleIcon data-icon="inline-start" />
                  {isCreating ? "Starting..." : "Shuffle & Start"}
                </Button>

                {!meetingCode ? (
                  <p className="text-center text-[10px] text-muted-foreground">
                    Open this add-on inside a Google Meet call to start a session.
                  </p>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
