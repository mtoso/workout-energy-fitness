export type UserRole = 'admin' | 'customer';
export type AuthProvider = 'email' | 'google';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
