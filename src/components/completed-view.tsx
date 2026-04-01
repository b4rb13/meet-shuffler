"use client";

import { useState, useCallback } from "react";
import type { Session } from "@/lib/types";
import { deleteSession } from "@/lib/session-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircleIcon,
  ArrowsClockwiseIcon,
  SmileyIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CompletedViewProps {
  session: Session;
  meetingCode: string;
}

export function CompletedView({
  session,
  meetingCode,
}: CompletedViewProps) {
  const [showPunchline, setShowPunchline] = useState(false);

  const handleNewSession = useCallback(async () => {
    await deleteSession(meetingCode);
  }, [meetingCode]);

  const doneCount = session.shuffledOrder.filter(
    (p) => p.status === "done",
  ).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Complete header */}
      <div className="flex flex-col items-center gap-2 py-3 text-center">
        <div className="text-3xl">&#127881;</div>
        <h2 className="text-base font-semibold text-primary">
          Standup Complete!
        </h2>
        <p className="text-[10px] text-muted-foreground">
          {doneCount}/{session.shuffledOrder.length} participants gave updates
        </p>
      </div>

      {/* Final standings */}
      <ScrollArea className="max-h-[180px]">
        <div className="flex flex-col gap-0.5">
          {session.shuffledOrder.map((p, idx) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5",
                p.status === "done" && "opacity-60",
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                {idx + 1}
              </span>
              <span
                className={cn(
                  "flex-1 truncate text-xs",
                  p.status === "done" && "line-through",
                )}
              >
                {p.displayName}
              </span>
              {p.status === "done" ? (
                <CheckCircleIcon className="size-3.5 text-primary" />
              ) : (
                <ClockIcon className="size-3.5 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Developer joke */}
      {session.joke ? (
        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <SmileyIcon className="size-3.5 text-primary" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Dev Joke
              </span>
            </div>
            <p className="text-xs font-medium">{session.joke.setup}</p>
            {showPunchline ? (
              <p className="animate-in fade-in-0 slide-in-from-bottom-1 text-xs text-primary">
                {session.joke.delivery}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[10px]"
                onClick={() => setShowPunchline(true)}
              >
                Reveal Punchline
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Start new session -- available to everyone after session ends */}
      <Separator />
      <Button variant="outline" size="sm" onClick={handleNewSession}>
        <ArrowsClockwiseIcon data-icon="inline-start" />
        Start New Session
      </Button>
    </div>
  );
}
