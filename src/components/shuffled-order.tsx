"use client";

import type { ShuffledParticipant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { PushPinIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShuffledOrderProps {
  order: ShuffledParticipant[];
  currentSpeakerIndex: number;
  onAdvanceSpeaker: () => void;
}

export function ShuffledOrder({
  order,
  currentSpeakerIndex,
  onAdvanceSpeaker,
}: ShuffledOrderProps) {
  if (order.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Standup Order
      </span>
      <ScrollArea className="max-h-[280px]">
        <div className="flex flex-col gap-0.5">
          {order.map((p, idx) => {
            const isCurrent = idx === currentSpeakerIndex;
            const isDone = idx < currentSpeakerIndex;

            return (
              <button
                key={p.id}
                type="button"
                onClick={isCurrent ? onAdvanceSpeaker : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                  isCurrent &&
                    "bg-primary/10 ring-1 ring-primary/30",
                  isDone && "opacity-40",
                  !isCurrent && !isDone && "hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {p.position}
                </span>
                <span
                  className={cn(
                    "flex-1 truncate text-xs font-medium",
                    isDone && "line-through",
                  )}
                >
                  {p.displayName}
                </span>
                {p.isPinned ? (
                  <PushPinIcon className="size-3 shrink-0 text-muted-foreground" />
                ) : null}
                {isCurrent ? (
                  <Badge className="shrink-0 text-[9px]">Speaking</Badge>
                ) : null}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
