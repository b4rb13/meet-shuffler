export interface Participant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isPinned: boolean;
  pinnedPosition?: number;
  isExcluded: boolean;
}

export type ParticipantStatus = "pending" | "speaking" | "done";

export interface SessionParticipant {
  id: string;
  displayName: string;
  position: number;
  isPinned: boolean;
  status: ParticipantStatus;
}

export interface ConnectedUser {
  odbc: string;
  userId: string;
  displayName: string;
  lastSeen: number;
}

export interface Joke {
  setup: string;
  delivery: string;
}

export interface Session {
  organizerId: string;
  organizerName: string;
  state: "active" | "completed";
  createdAt: number;
  shuffledOrder: SessionParticipant[];
  timerEnabled: boolean;
  timerSecondsPerPerson: number;
  timerStartedAt: number | null;
  timerPausedRemaining: number | null;
  connectedUsers?: Record<string, ConnectedUser>;
  joke?: Joke | null;
}

// Legacy types kept for shuffle utility
export interface ShuffledParticipant {
  id: string;
  displayName: string;
  position: number;
  isPinned: boolean;
}
