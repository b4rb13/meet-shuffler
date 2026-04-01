"use client";

import type { SessionParticipant, ParticipantStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PushPinIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShuffledOrderProps {
  order: SessionParticipant[];
  isOrganizer: boolean;
  onStatusChange: (participantId: string, newStatus: ParticipantStatus) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

function nextStatus(current: ParticipantStatus): ParticipantStatus {
  switch (current) {
    case "pending":
      return "speaking";
    case "speaking":
      return "done";
    case "done":
      return "pending";
  }
}

const statusConfig: Record<
  ParticipantStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  speaking: { label: "Speaking", variant: "default" },
  done: { label: "Done", variant: "secondary" },
  pending: { label: "Pending", variant: "outline" },
};

export function ShuffledOrder({
  order,
  isOrganizer,
  onStatusChange,
  onMoveUp,
  onMoveDown,
}: ShuffledOrderProps) {
  if (order.length === 0) return null;

  const doneCount = order.filter((p) => p.status === "done").length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Standup Order
        </span>
        <span className="text-[10px] text-muted-foreground">
          {doneCount}/{order.length} done
        </span>
      </div>
      <ScrollArea className="max-h-[280px]">
        <div className="flex flex-col gap-0.5">
          {order.map((p, idx) => (
            <div
              key={p.id}
              className={cn(
                "group flex items-center gap-1.5 rounded-md px-1.5 py-1.5 transition-colors",
                p.status === "speaking" && "bg-primary/10 ring-1 ring-primary/30",
                p.status === "done" && "opacity-45",
              )}
            >
              {isOrganizer && onMoveUp && onMoveDown ? (
                <div className="flex shrink-0 flex-col">
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
              ) : null}

              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  p.status === "speaking"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {idx + 1}
              </span>

              <span
                className={cn(
                  "flex-1 truncate text-xs font-medium",
                  p.status === "done" && "line-through",
                )}
              >
                {p.displayName}
              </span>

              {p.isPinned ? (
                <PushPinIcon className="size-3 shrink-0 text-muted-foreground" />
              ) : null}

              <button
                type="button"
                onClick={() => onStatusChange(p.id, nextStatus(p.status))}
                className="shrink-0"
              >
                <Badge
                  variant={statusConfig[p.status].variant}
                  className={cn(
                    "gap-0.5 text-[9px]",
                    p.status === "pending" &&
                      "opacity-0 group-hover:opacity-100",
                  )}
                >
                  {p.status === "speaking" ? (
                    <MicrophoneIcon className="size-2.5" />
                  ) : p.status === "done" ? (
                    <CheckCircleIcon className="size-2.5" />
                  ) : (
                    <ClockIcon className="size-2.5" />
                  )}
                  {statusConfig[p.status].label}
                </Badge>
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
