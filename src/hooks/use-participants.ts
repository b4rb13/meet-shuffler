"use client";

import { useState, useCallback } from "react";
import type { Participant } from "@/lib/types";
import { loadGisScript, requestAccessToken } from "@/lib/google-auth";
import { fetchActiveParticipants } from "@/lib/meet-api";
import type { MeetSidePanelClient } from "@googleworkspace/meet-addons/meet.addons";

export function useParticipants() {
  const [participants, setParticipants] = useState<Map<string, Participant>>(
    () => new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFromMeet = useCallback(
    async (client: MeetSidePanelClient | null) => {
      if (!client) {
        setError("Meet SDK not ready");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await loadGisScript();

        const [token, meetingInfo] = await Promise.all([
          requestAccessToken(),
          client.getMeetingInfo(),
        ]);

        const fetched = await fetchActiveParticipants(
          meetingInfo.meetingCode,
          token,
        );

        setParticipants((prev) => {
          const next = new Map(prev);
          for (const p of fetched) {
            if (!next.has(p.id)) {
              next.set(p.id, p);
            }
          }
          return next;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch participants",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const addManual = useCallback((name: string) => {
    const id = crypto.randomUUID();
    setParticipants((prev) => {
      const next = new Map(prev);
      next.set(id, {
        id,
        displayName: name.trim(),
        isPinned: false,
        isExcluded: false,
      });
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleExclude = useCallback((id: string) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      const p = next.get(id);
      if (p) next.set(id, { ...p, isExcluded: !p.isExcluded });
      return next;
    });
  }, []);

  const setPin = useCallback((id: string, position: number | undefined) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      const p = next.get(id);
      if (p) {
        next.set(id, {
          ...p,
          isPinned: position != null,
          pinnedPosition: position,
        });
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setParticipants(new Map());
  }, []);

  return {
    participants: Array.from(participants.values()),
    participantsMap: participants,
    isLoading,
    error,
    fetchFromMeet,
    addManual,
    remove,
    toggleExclude,
    setPin,
    clearAll,
  };
}
