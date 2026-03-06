import type { UserRole } from '../../types/auth';
import type { WorkoutPlan, WorkoutPlanInput } from '../../types/workout';
import { apiFetch } from './client';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export const getMyWorkoutPlan = () =>
  apiFetch<{ plan: WorkoutPlan | null }>('/api/workout-plan/me');

export const getAdminUsers = () =>
  apiFetch<{ users: AdminUser[] }>('/api/admin/users');

export const createAdminInvite = (payload: {
  email: string;
  role: UserRole;
  expiresInHours: number;
}) =>
  apiFetch<{
    inviteUrl: string;
    expiresAt: string;
    role: UserRole;
    email: string;
  }>('/api/admin/invites', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getAdminUserWorkoutPlan = (userId: string) =>
  apiFetch<{ user: AdminUserSummary; plan: WorkoutPlan | null }>(
    `/api/admin/users/${userId}/workout-plan`
  );

export const saveAdminUserWorkoutPlan = (
  userId: string,
  payload: WorkoutPlanInput
) =>
  apiFetch<{ user: AdminUserSummary; plan: WorkoutPlan | null }>(
    `/api/admin/users/${userId}/workout-plan`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
