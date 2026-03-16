export type UserType = 'client' | 'coach';
export type UserStatus = 'invited' | 'active' | 'disabled';
export type AuthProvider = 'email' | 'google';

export interface Env {
  DB: D1Database;
  APP_BASE_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  SESSION_COOKIE_NAME?: string;
  SESSION_TTL_HOURS?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  isAdmin: boolean;
  status: UserStatus;
  coachUserId: string | null;
  canManageClients: boolean;
  canUsePersonalApp: boolean;
}

export interface AuthSession {
  sessionId: string;
  tokenHash: string;
  user: AuthUser;
}

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  user_type: UserType;
  is_admin: number;
  status: UserStatus;
  coach_user_id: string | null;
  invited_by_user_id: string | null;
  invite_token_hash: string | null;
  invite_expires_at: string | null;
  invited_at: string | null;
  activated_at: string | null;
  last_login_at: string | null;
  preferred_workout_plan_id?: string | null;
  last_seen_workout_publication_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvitedUserRow extends UserRow {
  invite_token_hash: string;
  invite_expires_at: string | null;
}
