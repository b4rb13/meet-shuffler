"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  registerConnection,
  updateHeartbeat,
  getConnectedUsers,
  transferOrganizer,
} from "@/lib/session-store";
import type { Session } from "@/lib/types";

const HEARTBEAT_INTERVAL = 30_000;
const STALE_THRESHOLD = 60_000;

export function usePresence(
  meetingCode: string | null,
  userId: string | null,
  displayName: string | null,
  session: Session | null,
) {
  const connectionKeyRef = useRef<string | null>(null);
  const unregisterRef = useRef<(() => void) | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sessionState = session?.state ?? null;

  useEffect(() => {
    if (!meetingCode || !userId || !displayName || sessionState !== "active") {
      return;
    }

    const { connectionKey, unregister } = registerConnection(
      meetingCode,
      userId,
      displayName,
    );
    connectionKeyRef.current = connectionKey;
    unregisterRef.current = unregister;

    heartbeatRef.current = setInterval(() => {
      if (connectionKeyRef.current) {
        updateHeartbeat(meetingCode, connectionKeyRef.current);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (unregisterRef.current) unregisterRef.current();
      connectionKeyRef.current = null;
      unregisterRef.current = null;
    };
  }, [meetingCode, userId, displayName, sessionState]);

  const checkOrganizerHandoff = useCallback(async () => {
    if (!meetingCode || !userId || !displayName || !session) return;
    if (session.state !== "active") return;
    if (session.organizerId === userId) return;

    const connected = await getConnectedUsers(meetingCode);
    const now = Date.now();

    const organizerConnection = connected.find(
      (u) => u.userId === session.organizerId,
    );

    if (
      !organizerConnection ||
      now - organizerConnection.lastSeen > STALE_THRESHOLD
    ) {
      const sorted = connected
        .filter((u) => now - u.lastSeen < STALE_THRESHOLD)
        .sort((a, b) => a.lastSeen - b.lastSeen);

      const nextOrganizer = sorted[0];
      if (nextOrganizer && nextOrganizer.userId === userId) {
        await transferOrganizer(meetingCode, userId, displayName);
      }
    }
  }, [meetingCode, userId, displayName, session]);

  useEffect(() => {
    if (sessionState !== "active") return;

    const interval = setInterval(checkOrganizerHandoff, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [sessionState, checkOrganizerHandoff]);
}
