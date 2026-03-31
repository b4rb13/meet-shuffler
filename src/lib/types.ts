export interface Participant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isPinned: boolean;
  pinnedPosition?: number;
  isExcluded: boolean;
}

export interface ShuffledParticipant {
  id: string;
  displayName: string;
  position: number;
  isPinned: boolean;
}

export interface SharedState {
  shuffledOrder: ShuffledParticipant[];
  currentSpeakerIndex: number;
  timerSecondsPerPerson: number;
}

export type SidePanelMessageType =
  | "shuffle_update"
  | "speaker_advance"
  | "timer_update"
  | "end_standup";

export interface SidePanelMessage {
  type: SidePanelMessageType;
  payload: SharedState;
}
