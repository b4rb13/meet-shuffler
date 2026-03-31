"use client";

import type { Participant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DotsThreeVerticalIcon,
  PushPinIcon,
  EyeSlashIcon,
  EyeIcon,
  TrashIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ParticipantCardProps {
  participant: Participant;
  totalCount: number;
  onToggleExclude: (id: string) => void;
  onSetPin: (id: string, position: number | undefined) => void;
  onRemove: (id: string) => void;
}

export function ParticipantCard({
  participant,
  totalCount,
  onToggleExclude,
  onSetPin,
  onRemove,
}: ParticipantCardProps) {
  const positions = Array.from({ length: totalCount }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
        participant.isExcluded && "opacity-50",
      )}
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <UserIcon className="size-3.5 text-muted-foreground" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate text-xs font-medium",
            participant.isExcluded && "line-through",
          )}
        >
          {participant.displayName}
        </span>
        <div className="flex gap-1">
          {participant.isPinned && participant.pinnedPosition != null ? (
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              <PushPinIcon className="mr-0.5 size-2.5" />
              #{participant.pinnedPosition}
            </Badge>
          ) : null}
          {participant.isExcluded ? (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              excluded
            </Badge>
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-xs" />}
        >
          <DotsThreeVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <PushPinIcon className="mr-2" />
              Pin to position
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => onSetPin(participant.id, undefined)}
              >
                No pin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {positions.map((pos) => (
                <DropdownMenuItem
                  key={pos}
                  onClick={() => onSetPin(participant.id, pos)}
                >
                  Position #{pos}
                  {participant.pinnedPosition === pos ? " (current)" : ""}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            onClick={() => onToggleExclude(participant.id)}
          >
            {participant.isExcluded ? (
              <>
                <EyeIcon className="mr-2" />
                Include in shuffle
              </>
            ) : (
              <>
                <EyeSlashIcon className="mr-2" />
                Exclude from shuffle
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => onRemove(participant.id)}
          >
            <TrashIcon className="mr-2" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
