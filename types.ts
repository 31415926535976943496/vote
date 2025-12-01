export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; // Only visible to admin/self
  role: Role;
  votesAllowed: number; // Default votes per session
  ip?: string;
  location?: string;
  lastSeen?: number; // Timestamp
  isBlocked?: boolean;
}

export interface VoteOption {
  id: string;
  text: string;
  count: number;
}

export interface Session {
  id: string;
  title: string;
  options: VoteOption[];
  allowedUserIds: string[]; // List of user IDs allowed to vote
  votesPerUser: number; // Specific override for this session
  isActive: boolean;
  userVotes: Record<string, number>; // Map userId -> number of votes consumed
  createdAt: number;
}

export interface AppState {
  users: User[];
  sessions: Session[];
  config: {
    startPassword: string;
  };
}