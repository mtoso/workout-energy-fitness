export type UserRole = 'admin' | 'customer';
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
  role: UserRole;
}

export interface AuthSession {
  sessionId: string;
  tokenHash: string;
  user: AuthUser;
}

export interface InviteRow {
  id: string;
  email: string;
  role: UserRole;
  expires_at: string;
  accepted_at: string | null;
}
