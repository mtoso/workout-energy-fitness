import type { AuthUser } from '../../types/auth';
import { apiFetch } from './client';

interface AuthResponse {
  user: AuthUser;
}

export const getMe = () => apiFetch<AuthResponse>('/api/auth/me');

export const logout = () =>
  apiFetch<{ ok: boolean }>('/api/auth/logout', {
    method: 'POST',
  });

export const loginEmail = (payload: { email: string; password: string }) =>
  apiFetch<AuthResponse>('/api/auth/login/email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginGoogle = (payload: { idToken: string }) =>
  apiFetch<AuthResponse>('/api/auth/login/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const signupEmail = (payload: {
  inviteToken: string;
  email: string;
  password: string;
}) =>
  apiFetch<AuthResponse>('/api/auth/signup/email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const signupGoogle = (payload: { inviteToken: string; idToken: string }) =>
  apiFetch<AuthResponse>('/api/auth/signup/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
