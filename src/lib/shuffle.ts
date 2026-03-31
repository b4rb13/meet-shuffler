import type { Participant, ShuffledParticipant } from "./types";

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
): ShuffledParticipant[] {
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
  const result: (ShuffledParticipant | null)[] = new Array(totalSlots).fill(
    null,
  );

  for (const p of pinned) {
    const idx = (p.pinnedPosition ?? 1) - 1;
    if (idx >= 0 && idx < totalSlots && !result[idx]) {
      result[idx] = {
        id: p.id,
        displayName: p.displayName,
        position: idx + 1,
        isPinned: true,
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
      };
      shuffleIdx++;
    }
  }

  return result.filter(Boolean) as ShuffledParticipant[];
}

export function formatShuffledOrder(order: ShuffledParticipant[]): string {
  return order
    .map(
      (p) =>
        `${p.position}. ${p.displayName}${p.isPinned ? " (pinned)" : ""}`,
    )
    .join("\n");
}
