"use client";

import { useState, useEffect, useRef } from "react";
import { subscribeToSession } from "@/lib/session-store";
import type { Session } from "@/lib/types";

export function useSession(meetingCode: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!meetingCode) {
      setIsLoading(false);
      return;
    }

    initialLoadDone.current = false;
    setIsLoading(true);

    const unsubscribe = subscribeToSession(meetingCode, (s) => {
      setSession(s);
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [meetingCode]);

  return { session, isLoading };
}
