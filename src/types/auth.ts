export type UserType = 'client' | 'coach';
export type UserStatus = 'invited' | 'active' | 'disabled';
export type AuthProvider = 'email' | 'google';

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

export interface InviteMetadata {
  valid: boolean;
  email: string | null;
  fullName: string | null;
  userType: UserType | null;
}
