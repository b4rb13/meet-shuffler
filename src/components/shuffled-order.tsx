"use client";

import type { ShuffledParticipant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PushPinIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShuffledOrderProps {
  order: ShuffledParticipant[];
  currentSpeakerIndex: number;
  completedSet: Set<string>;
  onSetCurrentSpeaker: (index: number) => void;
  onToggleCompleted: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function ShuffledOrder({
  order,
  currentSpeakerIndex,
  completedSet,
  onSetCurrentSpeaker,
  onToggleCompleted,
  onMoveUp,
  onMoveDown,
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
            const isDone = completedSet.has(p.id);

            return (
              <div
                key={p.id}
                className={cn(
                  "group flex items-center gap-1.5 rounded-md px-1.5 py-1.5 transition-colors",
                  isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                  isDone && !isCurrent && "opacity-45",
                )}
              >
                {/* Reorder arrows */}
                <div className="flex shrink-0 flex-col gap-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-4"
                    onClick={() => onMoveUp(idx)}
                    disabled={idx === 0}
                  >
                    <ArrowUpIcon className="size-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-4"
                    onClick={() => onMoveDown(idx)}
                    disabled={idx === order.length - 1}
                  >
                    <ArrowDownIcon className="size-2.5" />
                  </Button>
                </div>

                {/* Position badge - click to set as current speaker */}
                <Tooltip>
                  <TooltipTrigger
                    onClick={() => onSetCurrentSpeaker(idx)}
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-primary/20",
                    )}
                  >
                    {idx + 1}
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-[10px]">
                    Set as current speaker
                  </TooltipContent>
                </Tooltip>

                {/* Name */}
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

                {/* Status badge - click to toggle done */}
                <Tooltip>
                  <TooltipTrigger
                    onClick={() => onToggleCompleted(p.id)}
                    className="shrink-0"
                  >
                    {isCurrent && !isDone ? (
                      <Badge className="text-[9px]">Speaking</Badge>
                    ) : isDone ? (
                      <Badge
                        variant="secondary"
                        className="gap-0.5 text-[9px]"
                      >
                        <CheckCircleIcon className="size-2.5" />
                        Done
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[9px] opacity-0 group-hover:opacity-100"
                      >
                        Pending
                      </Badge>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-[10px]">
                    {isDone ? (
                      <span className="flex items-center gap-1">
                        <ArrowCounterClockwiseIcon className="size-3" /> Mark
                        as not done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon className="size-3" /> Mark as done
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
