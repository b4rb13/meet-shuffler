"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TimerProps {
  secondsPerPerson: number;
  onTimeUp: () => void;
}

export function Timer({ secondsPerPerson, onTimeUp }: TimerProps) {
  const [remaining, setRemaining] = useState(secondsPerPerson);
  const [isPaused, setIsPaused] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (isPaused || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          onTimeUpRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remaining]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setRemaining(secondsPerPerson);
    setIsPaused(false);
  }, [secondsPerPerson]);

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
        )}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>

      <div className="ml-1 h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isLow ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: widthPercent }}
        />
      </div>

      <div className="flex gap-0.5">
        <Button variant="ghost" size="icon-xs" onClick={togglePause}>
          {isPaused ? (
            <PlayIcon className="size-3" />
          ) : (
            <PauseIcon className="size-3" />
          )}
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={reset}>
          <ArrowCounterClockwiseIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
