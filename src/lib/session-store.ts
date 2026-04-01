import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  push,
  onDisconnect,
  serverTimestamp,
  runTransaction,
  type Unsubscribe,
} from "firebase/database";
import { getDatabase } from "./firebase";
import type { Session, SessionParticipant, Joke, ConnectedUser } from "./types";

function sessionRef(meetingCode: string) {
  return ref(getDatabase(), `sessions/${meetingCode}`);
}

function fieldRef(meetingCode: string, field: string) {
  return ref(getDatabase(), `sessions/${meetingCode}/${field}`);
}

export async function createSession(
  meetingCode: string,
  organizerId: string,
  organizerName: string,
  shuffledOrder: SessionParticipant[],
  timerEnabled: boolean,
  timerSecondsPerPerson: number,
): Promise<void> {
  const session: Record<string, unknown> = {
    organizerId,
    organizerName,
    state: "active",
    createdAt: serverTimestamp(),
    shuffledOrder,
    timerEnabled,
    timerSecondsPerPerson,
    timerStartedAt: null,
    timerPausedRemaining: null,
    joke: null,
  };
  await set(sessionRef(meetingCode), session);
}

export function subscribeToSession(
  meetingCode: string,
  callback: (session: Session | null) => void,
): Unsubscribe {
  return onValue(sessionRef(meetingCode), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = snapshot.val() as Record<string, unknown>;
    const order = data.shuffledOrder;
    const session: Session = {
      organizerId: (data.organizerId as string) ?? "",
      organizerName: (data.organizerName as string) ?? "",
      state: (data.state as Session["state"]) ?? "active",
      createdAt: (data.createdAt as number) ?? 0,
      shuffledOrder: Array.isArray(order)
        ? (order as SessionParticipant[])
        : order
          ? Object.values(order as Record<string, SessionParticipant>)
          : [],
      timerEnabled: (data.timerEnabled as boolean) ?? false,
      timerSecondsPerPerson: (data.timerSecondsPerPerson as number) ?? 90,
      timerStartedAt: (data.timerStartedAt as number) ?? null,
      timerPausedRemaining: (data.timerPausedRemaining as number) ?? null,
      connectedUsers: (data.connectedUsers as Record<string, ConnectedUser>) ?? undefined,
      joke: (data.joke as Joke) ?? null,
    };
    callback(session);
  });
}

export async function setParticipantStatus(
  meetingCode: string,
  participantId: string,
  newStatus: SessionParticipant["status"],
): Promise<void> {
  const orderRef = fieldRef(meetingCode, "shuffledOrder");

  await runTransaction(orderRef, (currentOrder: SessionParticipant[] | null) => {
    if (!currentOrder) return currentOrder;

    const order = Array.isArray(currentOrder)
      ? currentOrder
      : Object.values(currentOrder as Record<string, SessionParticipant>);

    return order.map((p) => {
      if (p.id === participantId) {
        return { ...p, status: newStatus };
      }
      // If setting someone to "speaking", mark previous speaker as "done"
      if (newStatus === "speaking" && p.status === "speaking") {
        return { ...p, status: "done" as const };
      }
      return p;
    });
  });

  // If a new speaker is set, reset the timer
  if (newStatus === "speaking") {
    await update(sessionRef(meetingCode), {
      timerStartedAt: serverTimestamp(),
      timerPausedRemaining: null,
    });
  }
}

export async function addLateJoiner(
  meetingCode: string,
  participant: SessionParticipant,
): Promise<void> {
  const orderRef = fieldRef(meetingCode, "shuffledOrder");

  await runTransaction(orderRef, (currentOrder: SessionParticipant[] | null) => {
    if (!currentOrder) return currentOrder;

    const order = Array.isArray(currentOrder)
      ? currentOrder
      : Object.values(currentOrder as Record<string, SessionParticipant>);

    const exists = order.some((p) => p.id === participant.id);
    if (exists) return order;

    return [
      ...order,
      { ...participant, position: order.length + 1, status: "pending" as const },
    ];
  });
}

export async function reorderParticipants(
  meetingCode: string,
  newOrder: SessionParticipant[],
): Promise<void> {
  const reindexed = newOrder.map((p, i) => ({ ...p, position: i + 1 }));
  await set(fieldRef(meetingCode, "shuffledOrder"), reindexed);
}

export async function transferOrganizer(
  meetingCode: string,
  newOrganizerId: string,
  newOrganizerName: string,
): Promise<void> {
  await update(sessionRef(meetingCode), {
    organizerId: newOrganizerId,
    organizerName: newOrganizerName,
  });
}

export async function startTimer(meetingCode: string): Promise<void> {
  await update(sessionRef(meetingCode), {
    timerStartedAt: serverTimestamp(),
    timerPausedRemaining: null,
  });
}

export async function pauseTimer(
  meetingCode: string,
  remainingSeconds: number,
): Promise<void> {
  await update(sessionRef(meetingCode), {
    timerStartedAt: null,
    timerPausedRemaining: remainingSeconds,
  });
}

export async function resumeTimer(meetingCode: string): Promise<void> {
  await update(sessionRef(meetingCode), {
    timerStartedAt: serverTimestamp(),
    timerPausedRemaining: null,
  });
}

export async function endSession(
  meetingCode: string,
  joke: Joke,
): Promise<void> {
  await update(sessionRef(meetingCode), {
    state: "completed",
    joke,
    timerStartedAt: null,
    timerPausedRemaining: null,
  });
}

export async function deleteSession(meetingCode: string): Promise<void> {
  await remove(sessionRef(meetingCode));
}

export function registerConnection(
  meetingCode: string,
  userId: string,
  displayName: string,
): { unregister: () => void; connectionKey: string } {
  const connectionsRef = fieldRef(meetingCode, "connectedUsers");
  const newRef = push(connectionsRef);
  const key = newRef.key ?? crypto.randomUUID();

  const entry: ConnectedUser = {
    odbc: key,
    userId,
    displayName,
    lastSeen: Date.now(),
  };
  set(newRef, entry);

  onDisconnect(newRef).remove();

  return {
    connectionKey: key,
    unregister: () => {
      remove(newRef);
    },
  };
}

export async function updateHeartbeat(
  meetingCode: string,
  connectionKey: string,
): Promise<void> {
  const entryRef = ref(
    getDatabase(),
    `sessions/${meetingCode}/connectedUsers`,
  );
  const snapshot = await get(entryRef);
  if (!snapshot.exists()) return;

  const users = snapshot.val() as Record<string, ConnectedUser>;
  for (const [fbKey, user] of Object.entries(users)) {
    if (user.odbc === connectionKey) {
      await update(
        ref(getDatabase(), `sessions/${meetingCode}/connectedUsers/${fbKey}`),
        { lastSeen: Date.now() },
      );
      break;
    }
  }
}

export async function getConnectedUsers(
  meetingCode: string,
): Promise<ConnectedUser[]> {
  const snapshot = await get(fieldRef(meetingCode, "connectedUsers"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val() as Record<string, ConnectedUser>;
  return Object.values(data);
}

export async function reshuffleSession(
  meetingCode: string,
  newOrder: SessionParticipant[],
): Promise<void> {
  await update(sessionRef(meetingCode), {
    shuffledOrder: newOrder,
    timerStartedAt: null,
    timerPausedRemaining: null,
  });
}
