import type { Participant } from "./types";

const MEET_API_BASE = "https://meet.googleapis.com/v2";

interface ConferenceRecord {
  name: string;
  startTime: string;
  endTime?: string;
  space: string;
}

interface ApiParticipant {
  name: string;
  earliestStartTime: string;
  latestEndTime?: string;
  signedinUser?: {
    user: string;
    displayName: string;
  };
  anonymousUser?: {
    displayName: string;
  };
  phoneUser?: {
    displayName: string;
  };
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meet API ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchActiveParticipants(
  meetingCode: string,
  accessToken: string,
): Promise<Participant[]> {
  const encodedFilter = encodeURIComponent(
    `space.meeting_code="${meetingCode}" AND end_time IS NULL`,
  );

  const records = await fetchJson<{ conferenceRecords?: ConferenceRecord[] }>(
    `${MEET_API_BASE}/conferenceRecords?filter=${encodedFilter}`,
    accessToken,
  );

  const record = records.conferenceRecords?.[0];
  if (!record) {
    throw new Error(
      "No active conference found. Make sure you are in a live meeting.",
    );
  }

  const participantFilter = encodeURIComponent("latest_end_time IS NULL");

  const result = await fetchJson<{ participants?: ApiParticipant[] }>(
    `${MEET_API_BASE}/${record.name}/participants?filter=${participantFilter}&pageSize=250`,
    accessToken,
  );

  return (result.participants ?? [])
    .filter((p): p is ApiParticipant & { signedinUser: NonNullable<ApiParticipant["signedinUser"]> } => !!p.signedinUser)
    .map((p) => ({
      id: p.signedinUser.user || p.name,
      displayName: p.signedinUser.displayName || "Unknown",
      isPinned: false,
      pinnedPosition: undefined,
      isExcluded: false,
    }));
}
