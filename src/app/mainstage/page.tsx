"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMainStageSession } from "@/hooks/use-meet-session";
import type { SharedState, ShuffledParticipant } from "@/lib/types";
import { PushPinIcon, ShuffleIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MainStagePage() {
  const { client, error: sdkError, isReady } = useMainStageSession();
  const [state, setState] = useState<SharedState | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load initial state from activity starting state
  useEffect(() => {
    if (!client) return;

    async function loadInitialState() {
      if (!client) return;
      try {
        const starting = await client.getActivityStartingState();
        if (starting.additionalData) {
          setState(JSON.parse(starting.additionalData) as SharedState);
        }
      } catch {
        /* initial state may not be available */
      }
    }

    loadInitialState();
  }, [client]);

  // Listen for frame-to-frame messages from side panel
  useEffect(() => {
    if (!client) return;

    client.on("frameToFrameMessage", (message) => {
      if (message.originator === "SIDE_PANEL") {
        try {
          const newState = JSON.parse(message.payload) as SharedState;
          setState(newState);
        } catch {
          /* ignore malformed messages */
        }
      }
    });
  }, [client]);

  const handleAdvance = useCallback(async () => {
    if (!state || !client) return;

    const nextIdx = state.currentSpeakerIndex + 1;
    if (nextIdx >= state.shuffledOrder.length) return;

    const newState: SharedState = { ...state, currentSpeakerIndex: nextIdx };
    setState(newState);

    try {
      await client.notifySidePanel(JSON.stringify(newState));
    } catch {
      /* best effort */
    }
  }, [state, client]);

  if (!isReady) {
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

  if (!state) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <ShuffleIcon className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Waiting for shuffle data...
        </p>
      </div>
    );
  }

  const { shuffledOrder, currentSpeakerIndex } = state;
  const standupDone = currentSpeakerIndex >= shuffledOrder.length;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <ShuffleIcon className="size-6 text-primary" />
        <h1 className="text-lg font-semibold">Standup Order</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {currentSpeakerIndex + 1} / {shuffledOrder.length}
          </Badge>
        </div>
      </div>

      {/* Order List */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-6">
        <div className="w-full max-w-xl">
          {standupDone ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="text-4xl">&#127881;</div>
              <h2 className="text-xl font-semibold text-primary">
                Standup Complete!
              </h2>
              <p className="text-sm text-muted-foreground">
                All {shuffledOrder.length} participants have given their updates.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            {shuffledOrder.map((p, idx) => (
              <MainStageParticipantRow
                key={p.id}
                participant={p}
                index={idx}
                currentSpeakerIndex={currentSpeakerIndex}
                onAdvance={handleAdvance}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MainStageParticipantRow({
  participant,
  index,
  currentSpeakerIndex,
  onAdvance,
}: {
  participant: ShuffledParticipant;
  index: number;
  currentSpeakerIndex: number;
  onAdvance: () => void;
}) {
  const isCurrent = index === currentSpeakerIndex;
  const isDone = index < currentSpeakerIndex;

  return (
    <button
      type="button"
      onClick={isCurrent ? onAdvance : undefined}
      disabled={!isCurrent}
      className={cn(
        "flex items-center gap-4 rounded-lg px-4 py-3 text-left transition-all",
        isCurrent &&
          "scale-[1.02] bg-primary/10 ring-2 ring-primary/40 shadow-sm",
        isDone && "opacity-35",
        !isCurrent && !isDone && "hover:bg-muted/30",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          isCurrent
            ? "bg-primary text-primary-foreground shadow-md"
            : isDone
              ? "bg-muted/60 text-muted-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {participant.position}
      </span>

      <span
        className={cn(
          "flex-1 text-base font-medium",
          isDone && "line-through",
          isCurrent && "text-foreground",
        )}
      >
        {participant.displayName}
      </span>

      {participant.isPinned ? (
        <PushPinIcon className="size-4 text-muted-foreground" />
      ) : null}

      {isCurrent ? (
        <Badge className="animate-pulse text-xs">Now Speaking</Badge>
      ) : null}

      {isDone ? (
        <span className="text-xs text-muted-foreground">Done</span>
      ) : null}
    </button>
  );
}
