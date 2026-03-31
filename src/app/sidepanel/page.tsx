"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSidePanelSession } from "@/hooks/use-meet-session";
import { useParticipants } from "@/hooks/use-participants";
import { shuffleParticipants, formatShuffledOrder } from "@/lib/shuffle";
import { getMainStageUrl } from "@/lib/meet-sdk";
import type { ShuffledParticipant, SharedState } from "@/lib/types";

import { ParticipantList } from "@/components/participant-list";
import { AddParticipantDialog } from "@/components/add-participant-dialog";
import { ShuffledOrder } from "@/components/shuffled-order";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  ShuffleIcon,
  ArrowsClockwiseIcon,
  CopyIcon,
  BroadcastIcon,
  UsersIcon,
  SpinnerGapIcon,
  TimerIcon,
  StopIcon,
  CheckIcon,
} from "@phosphor-icons/react";

const Timer = dynamic(
  () => import("@/components/timer").then((m) => ({ default: m.Timer })),
  { ssr: false },
);

const DEFAULT_TIMER_SECONDS = 90;

export default function SidePanelPage() {
  const { client, error: sdkError, isReady } = useSidePanelSession();
  const {
    participants,
    isLoading,
    error: fetchError,
    fetchFromMeet,
    addManual,
    remove,
    toggleExclude,
    setPin,
  } = useParticipants();

  const [shuffledOrder, setShuffledOrder] = useState<ShuffledParticipant[]>([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isShared, setIsShared] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const [copied, setCopied] = useState(false);

  const handleShuffle = useCallback(() => {
    const order = shuffleParticipants(participants);
    setShuffledOrder(order);
    setCurrentSpeakerIndex(0);
    setCompletedIds(new Set());
    setIsShared(false);
  }, [participants]);

  const handleAdvanceSpeaker = useCallback(() => {
    setCurrentSpeakerIndex((prev) => {
      const next = prev + 1;
      if (next >= shuffledOrder.length) return prev;
      return next;
    });
    if (shuffledOrder[currentSpeakerIndex]) {
      setCompletedIds(
        (prev) => new Set([...prev, shuffledOrder[currentSpeakerIndex].id]),
      );
    }
  }, [shuffledOrder, currentSpeakerIndex]);

  const handleSetCurrentSpeaker = useCallback(
    (index: number) => {
      setCurrentSpeakerIndex(index);
    },
    [],
  );

  const handleToggleCompleted = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setShuffledOrder((prev) => {
        const next = [...prev];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        return next.map((p, i) => ({ ...p, position: i + 1 }));
      });
      if (currentSpeakerIndex === index) {
        setCurrentSpeakerIndex(index - 1);
      } else if (currentSpeakerIndex === index - 1) {
        setCurrentSpeakerIndex(index);
      }
    },
    [currentSpeakerIndex],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      setShuffledOrder((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        return next.map((p, i) => ({ ...p, position: i + 1 }));
      });
      if (currentSpeakerIndex === index) {
        setCurrentSpeakerIndex(index + 1);
      } else if (currentSpeakerIndex === index + 1) {
        setCurrentSpeakerIndex(index);
      }
    },
    [currentSpeakerIndex],
  );

  const handleCopy = useCallback(async () => {
    const text = formatShuffledOrder(shuffledOrder);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for iframe restrictions
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shuffledOrder]);

  const buildSharedState = useCallback((): SharedState => {
    return {
      shuffledOrder,
      currentSpeakerIndex,
      completedIds: [...completedIds],
      timerSecondsPerPerson: timerEnabled ? timerSeconds : 0,
    };
  }, [shuffledOrder, currentSpeakerIndex, completedIds, timerEnabled, timerSeconds]);

  const handleShareToMainStage = useCallback(async () => {
    if (!client) return;
    try {
      const state = buildSharedState();
      await client.startActivity({
        mainStageUrl: getMainStageUrl(),
        additionalData: JSON.stringify(state),
      });
      setIsShared(true);
    } catch {
      try {
        const state = buildSharedState();
        await client.setActivityStartingState({
          mainStageUrl: getMainStageUrl(),
          additionalData: JSON.stringify(state),
        });
        setIsShared(true);
      } catch {
        /* best effort */
      }
    }
  }, [client, buildSharedState]);

  const handleSyncToMainStage = useCallback(async () => {
    if (!client || !isShared) return;
    try {
      const state = buildSharedState();
      await client.notifyMainStage(JSON.stringify(state));
    } catch {
      /* best effort */
    }
  }, [client, isShared, buildSharedState]);

  const handleEndActivity = useCallback(async () => {
    if (!client) return;
    try {
      await client.endActivity();
      setIsShared(false);
    } catch {
      /* may not be the initiator */
    }
  }, [client]);

  const handleTimerTimeUp = useCallback(() => {
    handleAdvanceSpeaker();
  }, [handleAdvanceSpeaker]);

  const activeCount = participants.filter((p) => !p.isExcluded).length;
  const hasParticipants = participants.length > 0;
  const hasOrder = shuffledOrder.length > 0;
  const allDone = useMemo(
    () =>
      hasOrder && shuffledOrder.every((p) => completedIds.has(p.id)),
    [hasOrder, shuffledOrder, completedIds],
  );

  if (!isReady) {
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
            disabled={!client || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <SpinnerGapIcon
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <UsersIcon data-icon="inline-start" />
            )}
            {isLoading ? "Fetching..." : "Fetch from Meet"}
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

            {/* Shuffle Button */}
            <Button
              onClick={handleShuffle}
              disabled={activeCount < 2}
              className="w-full"
              size="lg"
            >
              {hasOrder ? (
                <ArrowsClockwiseIcon data-icon="inline-start" />
              ) : (
                <ShuffleIcon data-icon="inline-start" />
              )}
              {hasOrder ? "Reshuffle" : "Shuffle Order"}
            </Button>
          </>
        ) : null}

        {/* Shuffled Result */}
        {hasOrder ? (
          <>
            <Separator />

            {/* Timer */}
            {timerEnabled && !allDone ? (
              <Timer
                key={currentSpeakerIndex}
                secondsPerPerson={timerSeconds}
                onTimeUp={handleTimerTimeUp}
              />
            ) : null}

            <ShuffledOrder
              order={shuffledOrder}
              currentSpeakerIndex={currentSpeakerIndex}
              completedSet={completedIds}
              onSetCurrentSpeaker={handleSetCurrentSpeaker}
              onToggleCompleted={handleToggleCompleted}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />

            {allDone ? (
              <Card size="sm">
                <CardContent className="text-center text-xs font-medium text-primary">
                  Standup complete!
                </CardContent>
              </Card>
            ) : null}

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-1.5">
              {isShared ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncToMainStage}
                  >
                    <BroadcastIcon data-icon="inline-start" />
                    Sync to Main Stage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndActivity}
                  >
                    <StopIcon data-icon="inline-start" />
                    End Activity
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareToMainStage}
                  disabled={!client}
                >
                  <BroadcastIcon data-icon="inline-start" />
                  Share to Main Stage
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
