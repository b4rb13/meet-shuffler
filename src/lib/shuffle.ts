import type { Participant, SessionParticipant, ShuffledParticipant } from "./types";

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function shuffleParticipants(
  participants: Participant[],
): SessionParticipant[] {
  const active = participants.filter((p) => !p.isExcluded);
  if (active.length === 0) return [];

  const pinned = active.filter(
    (p) => p.isPinned && p.pinnedPosition != null,
  );
  const unpinned = active.filter(
    (p) => !p.isPinned || p.pinnedPosition == null,
  );

  const shuffled = fisherYatesShuffle(unpinned);

  const totalSlots = active.length;
  const result: (SessionParticipant | null)[] = new Array(totalSlots).fill(null);

  for (const p of pinned) {
    const idx = (p.pinnedPosition ?? 1) - 1;
    if (idx >= 0 && idx < totalSlots && !result[idx]) {
      result[idx] = {
        id: p.id,
        displayName: p.displayName,
        position: idx + 1,
        isPinned: true,
        status: "pending",
      };
    }
  }

  let shuffleIdx = 0;
  for (let i = 0; i < totalSlots; i++) {
    if (!result[i] && shuffleIdx < shuffled.length) {
      result[i] = {
        id: shuffled[shuffleIdx].id,
        displayName: shuffled[shuffleIdx].displayName,
        position: i + 1,
        isPinned: false,
        status: "pending",
      };
      shuffleIdx++;
    }
  }

  return result.filter(Boolean) as SessionParticipant[];
}

export function formatSessionOrder(order: SessionParticipant[]): string {
  return order
    .map(
      (p) =>
        `${p.position}. ${p.displayName}${p.isPinned ? " (pinned)" : ""}${p.status === "done" ? " ✓" : p.status === "speaking" ? " 🎤" : ""}`,
    )
    .join("\n");
}

/** @deprecated Use shuffleParticipants which now returns SessionParticipant[] */
export function formatShuffledOrder(order: ShuffledParticipant[]): string {
  return order
    .map(
      (p) =>
        `${p.position}. ${p.displayName}${p.isPinned ? " (pinned)" : ""}`,
    )
    .join("\n");
}
