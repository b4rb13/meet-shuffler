"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Session, ParticipantStatus } from "@/lib/types";
import {
  setParticipantStatus,
  reorderParticipants,
  endSession,
  reshuffleSession,
  startTimer,
  pauseTimer,
  resumeTimer,
} from "@/lib/session-store";
import { shuffleParticipants } from "@/lib/shuffle";
import { formatSessionOrder } from "@/lib/shuffle";
import { fetchDeveloperJoke } from "@/lib/jokes";
import { ShuffledOrder } from "./shuffled-order";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowsClockwiseIcon,
  CopyIcon,
  StopIcon,
  CheckIcon,
  UserIcon,
} from "@phosphor-icons/react";

const SyncedTimer = dynamic(
  () => import("@/components/timer").then((m) => ({ default: m.SyncedTimer })),
  { ssr: false },
);

interface SessionViewProps {
  session: Session;
  meetingCode: string;
  isOrganizer: boolean;
}

export function SessionView({ session, meetingCode, isOrganizer }: SessionViewProps) {
  const [copied, setCopied] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const speakingUser = session.shuffledOrder.find((p) => p.status === "speaking");
  const doneCount = session.shuffledOrder.filter((p) => p.status === "done").length;

  const handleStatusChange = useCallback(
    async (participantId: string, newStatus: ParticipantStatus) => {
      await setParticipantStatus(meetingCode, participantId, newStatus);
    },
    [meetingCode],
  );

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index <= 0) return;
      const order = [...session.shuffledOrder];
      [order[index - 1], order[index]] = [order[index], order[index - 1]];
      await reorderParticipants(meetingCode, order);
    },
    [meetingCode, session.shuffledOrder],
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index >= session.shuffledOrder.length - 1) return;
      const order = [...session.shuffledOrder];
      [order[index], order[index + 1]] = [order[index + 1], order[index]];
      await reorderParticipants(meetingCode, order);
    },
    [meetingCode, session.shuffledOrder],
  );

  const handleReshuffle = useCallback(async () => {
    const asParticipants = session.shuffledOrder.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      isPinned: p.isPinned,
      pinnedPosition: p.isPinned ? p.position : undefined,
      isExcluded: false,
    }));
    const newOrder = shuffleParticipants(asParticipants);
    await reshuffleSession(meetingCode, newOrder);
  }, [meetingCode, session.shuffledOrder]);

  const handleEndSession = useCallback(async () => {
    setIsEnding(true);
    try {
      const joke = await fetchDeveloperJoke();
      await endSession(meetingCode, joke);
    } finally {
      setIsEnding(false);
    }
  }, [meetingCode]);

  const handleCopy = useCallback(async () => {
    const text = formatSessionOrder(session.shuffledOrder);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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
  }, [session.shuffledOrder]);

  const handleTimerPause = useCallback(
    async (remaining: number) => {
      await pauseTimer(meetingCode, remaining);
    },
    [meetingCode],
  );

  const handleTimerResume = useCallback(async () => {
    await resumeTimer(meetingCode);
  }, [meetingCode]);

  const handleTimerStart = useCallback(async () => {
    await startTimer(meetingCode);
  }, [meetingCode]);

  return (
    <div className="flex flex-col gap-3">
      {/* Session header */}
      <div className="flex items-center gap-2 px-1">
        <UserIcon className="size-3 text-muted-foreground" />
        <span className="flex-1 truncate text-[10px] text-muted-foreground">
          Organized by {session.organizerName}
          {isOrganizer ? " (you)" : ""}
        </span>
        <Badge variant="outline" className="text-[9px]">
          {doneCount}/{session.shuffledOrder.length} done
        </Badge>
      </div>

      {/* Timer */}
      {session.timerEnabled && speakingUser ? (
        <SyncedTimer
          key={speakingUser.id}
          secondsPerPerson={session.timerSecondsPerPerson}
          timerStartedAt={session.timerStartedAt}
          timerPausedRemaining={session.timerPausedRemaining}
          isOrganizer={isOrganizer}
          onPause={handleTimerPause}
          onResume={handleTimerResume}
          onStart={handleTimerStart}
        />
      ) : null}

      {/* Shuffled order */}
      <ShuffledOrder
        order={session.shuffledOrder}
        isOrganizer={isOrganizer}
        onStatusChange={handleStatusChange}
        onMoveUp={isOrganizer ? handleMoveUp : undefined}
        onMoveDown={isOrganizer ? handleMoveDown : undefined}
      />

      <Separator />

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        {isOrganizer ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReshuffle}
            >
              <ArrowsClockwiseIcon data-icon="inline-start" />
              Reshuffle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndSession}
              disabled={isEnding}
            >
              <StopIcon data-icon="inline-start" />
              {isEnding ? "Ending..." : "End Standup"}
            </Button>
          </>
        ) : null}
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>
      </div>
    </div>
  );
}
