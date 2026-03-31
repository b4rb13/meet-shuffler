"use client";

import { useState, useEffect } from "react";
import { createMeetSession } from "@/lib/meet-sdk";
import type {
  AddonSession,
  MeetSidePanelClient,
  MeetMainStageClient,
} from "@googleworkspace/meet-addons/meet.addons";

export function useSidePanelSession() {
  const [session, setSession] = useState<AddonSession | null>(null);
  const [client, setClient] = useState<MeetSidePanelClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const s = await createMeetSession();
        if (cancelled) return;
        setSession(s);

        const c = await s.createSidePanelClient();
        if (cancelled) return;
        setClient(c);
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsReady(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, client, error, isReady };
}

export function useMainStageSession() {
  const [client, setClient] = useState<MeetMainStageClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const s = await createMeetSession();
        if (cancelled) return;

        const c = await s.createMainStageClient();
        if (cancelled) return;
        setClient(c);
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsReady(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { client, error, isReady };
}
