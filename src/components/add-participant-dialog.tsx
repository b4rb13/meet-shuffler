"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlusIcon } from "@phosphor-icons/react";

interface AddParticipantDialogProps {
  onAdd: (name: string) => void;
}

export function AddParticipantDialog({ onAdd }: AddParticipantDialogProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <UserPlusIcon data-icon="inline-start" />
            Add Manually
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>
            Enter the name of a participant to add to the standup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            placeholder="Participant name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
