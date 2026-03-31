"use client";

import type { Participant } from "@/lib/types";
import { ParticipantCard } from "./participant-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParticipantListProps {
  participants: Participant[];
  onToggleExclude: (id: string) => void;
  onSetPin: (id: string, position: number | undefined) => void;
  onRemove: (id: string) => void;
}

export function ParticipantList({
  participants,
  onToggleExclude,
  onSetPin,
  onRemove,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
        <p className="text-xs text-muted-foreground">No participants yet</p>
        <p className="text-[10px] text-muted-foreground/70">
          Fetch from the meeting or add manually
        </p>
      </div>
    );
  }

  const activeCount = participants.filter((p) => !p.isExcluded).length;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Participants
        </span>
        <span className="text-[10px] text-muted-foreground">
          {activeCount} active / {participants.length} total
        </span>
      </div>
      <ScrollArea className="max-h-[240px]">
        <div className="flex flex-col gap-0.5">
          {participants.map((p) => (
            <ParticipantCard
              key={p.id}
              participant={p}
              totalCount={participants.length}
              onToggleExclude={onToggleExclude}
              onSetPin={onSetPin}
              onRemove={onRemove}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
