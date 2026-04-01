"use client";

import { useState, useEffect } from "react";
import { useMainStageSession } from "@/hooks/use-meet-session";
import { useSession } from "@/hooks/use-session";
import type { SessionParticipant } from "@/lib/types";
import {
  PushPinIcon,
  ShuffleIcon,
  SpinnerGapIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  ClockIcon,
  SmileyIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MainStagePage() {
  const { client, error: sdkError, isReady: sdkReady } = useMainStageSession();
  const [meetingCode, setMeetingCode] = useState<string | null>(null);
  const [showPunchline, setShowPunchline] = useState(false);

  // Get meeting code from URL query param or from the SDK activity starting state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setMeetingCode(code);
      return;
    }

    if (!client) return;
    async function loadFromActivity() {
      if (!client) return;
      try {
        const starting = await client.getActivityStartingState();
        if (starting.additionalData) {
          setMeetingCode(starting.additionalData);
        }
      } catch {
        /* may not be available */
      }
    }
    loadFromActivity();
  }, [client]);

  const { session, isLoading } = useSession(meetingCode);

  if (!sdkReady || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <SpinnerGapIcon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Unable to connect to Meet SDK
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <ShuffleIcon className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Waiting for shuffle data...
        </p>
      </div>
    );
  }

  const { shuffledOrder } = session;
  const doneCount = shuffledOrder.filter((p) => p.status === "done").length;
  const isCompleted = session.state === "completed";
  const allDone = shuffledOrder.every((p) => p.status === "done");

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <ShuffleIcon className="size-6 text-primary" />
        <h1 className="text-lg font-semibold">Standup Order</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {doneCount} / {shuffledOrder.length} done
          </Badge>
        </div>
      </div>

      {/* Order List */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-6">
        <div className="w-full max-w-xl">
          {(isCompleted || allDone) ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="text-4xl">&#127881;</div>
              <h2 className="text-xl font-semibold text-primary">
                Standup Complete!
              </h2>
              <p className="text-sm text-muted-foreground">
                {doneCount} of {shuffledOrder.length} participants gave updates.
              </p>

              {session.joke ? (
                <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-3 rounded-lg bg-muted/50 px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <SmileyIcon className="size-4 text-primary" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Dev Joke
                    </span>
                  </div>
                  <p className="text-center text-sm font-medium">
                    {session.joke.setup}
                  </p>
                  {showPunchline ? (
                    <p className="animate-in fade-in-0 text-center text-sm text-primary">
                      {session.joke.delivery}
                    </p>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPunchline(true)}
                    >
                      Reveal Punchline
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            {shuffledOrder.map((p, idx) => (
              <MainStageRow
                key={p.id}
                participant={p}
                index={idx}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MainStageRow({
  participant,
  index,
}: {
  participant: SessionParticipant;
  index: number;
}) {
  const isSpeaking = participant.status === "speaking";
  const isDone = participant.status === "done";

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg px-4 py-3 transition-all",
        isSpeaking && "scale-[1.02] bg-primary/10 ring-2 ring-primary/40 shadow-sm",
        isDone && "opacity-35",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          isSpeaking
            ? "bg-primary text-primary-foreground shadow-md"
            : isDone
              ? "bg-muted/60 text-muted-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {index + 1}
      </span>

      <span
        className={cn(
          "flex-1 text-base font-medium",
          isDone && "line-through",
          isSpeaking && "text-foreground",
        )}
      >
        {participant.displayName}
      </span>

      {participant.isPinned ? (
        <PushPinIcon className="size-4 text-muted-foreground" />
      ) : null}

      {isSpeaking ? (
        <Badge className="animate-pulse gap-1 text-xs">
          <MicrophoneIcon className="size-3" />
          Now Speaking
        </Badge>
      ) : null}

      {isDone ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircleIcon className="size-3.5" />
          Done
        </span>
      ) : null}

      {!isSpeaking && !isDone ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="size-3.5" />
          Pending
        </span>
      ) : null}
    </div>
  );
}
