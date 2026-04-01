import {
  meet,
  type AddonSession,
  type MeetSidePanelClient,
  type MeetMainStageClient,
} from "@googleworkspace/meet-addons/meet.addons";

const CLOUD_PROJECT_NUMBER =
  process.env.NEXT_PUBLIC_CLOUD_PROJECT_NUMBER ?? "";

export async function createMeetSession(): Promise<AddonSession> {
  return meet.addon.createAddonSession({
    cloudProjectNumber: CLOUD_PROJECT_NUMBER,
  });
}

export async function createSidePanelClient(
  session: AddonSession,
): Promise<MeetSidePanelClient> {
  return session.createSidePanelClient();
}

export async function createMainStageClient(
  session: AddonSession,
): Promise<MeetMainStageClient> {
  return session.createMainStageClient();
}

export function getMainStageUrl(meetingCode?: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const base = `${origin}/mainstage`;
  return meetingCode ? `${base}?code=${meetingCode}` : base;
}
