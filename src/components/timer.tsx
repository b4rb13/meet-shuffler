"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SyncedTimerProps {
  secondsPerPerson: number;
  timerStartedAt: number | null;
  timerPausedRemaining: number | null;
  isOrganizer: boolean;
  onPause: (remaining: number) => void;
  onResume: () => void;
  onStart: () => void;
}

export function SyncedTimer({
  secondsPerPerson,
  timerStartedAt,
  timerPausedRemaining,
  isOrganizer,
  onPause,
  onResume,
  onStart,
}: SyncedTimerProps) {
  const [remaining, setRemaining] = useState(secondsPerPerson);
  const isPaused = timerStartedAt === null;
  const isExpired = remaining <= 0;

  // Calculate remaining time from synced timestamp
  useEffect(() => {
    if (timerStartedAt) {
      const elapsed = (Date.now() - timerStartedAt) / 1000;
      const base = timerPausedRemaining ?? secondsPerPerson;
      setRemaining(Math.max(0, Math.round(base - elapsed)));
    } else if (timerPausedRemaining != null) {
      setRemaining(Math.max(0, timerPausedRemaining));
    } else {
      setRemaining(secondsPerPerson);
    }
  }, [timerStartedAt, timerPausedRemaining, secondsPerPerson]);

  // Tick every second when running
  useEffect(() => {
    if (isPaused || isExpired) return;

    const interval = setInterval(() => {
      if (!timerStartedAt) return;
      const elapsed = (Date.now() - timerStartedAt) / 1000;
      const base = timerPausedRemaining ?? secondsPerPerson;
      setRemaining(Math.max(0, Math.round(base - elapsed)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isExpired, timerStartedAt, timerPausedRemaining, secondsPerPerson]);

  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      if (timerPausedRemaining != null && timerPausedRemaining > 0) {
        onResume();
      } else {
        onStart();
      }
    } else {
      onPause(remaining);
    }
  }, [isPaused, remaining, timerPausedRemaining, onPause, onResume, onStart]);

  const handleReset = useCallback(() => {
    onStart();
  }, [onStart]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = secondsPerPerson > 0 ? remaining / secondsPerPerson : 0;
  const isLow = remaining <= 10 && remaining > 0;
  const widthPercent = `${String(progress * 100)}%`;

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
      <div
        className={cn(
          "font-mono text-lg font-bold tabular-nums",
          isLow && "text-destructive animate-pulse",
          isExpired && "text-destructive animate-pulse",
        )}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>

      <div className="ml-1 h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isLow || isExpired ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: widthPercent }}
        />
      </div>

      {isOrganizer ? (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon-xs" onClick={handleTogglePause}>
            {isPaused ? (
              <PlayIcon className="size-3" />
            ) : (
              <PauseIcon className="size-3" />
            )}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={handleReset}>
            <ArrowCounterClockwiseIcon className="size-3" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
