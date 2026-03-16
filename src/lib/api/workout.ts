import type { AdminCoachSummary, AdminUserDetail, AdminUserSummary } from '../../types/admin';
import type {
  AdminWorkoutPlan,
  AdminWorkoutPlanInput,
  AdminWorkoutPlanSummary,
} from '../../types/admin-workout';
import type { UserType } from '../../types/auth';
import type { WorkoutPlan } from '../../types/workout';
import { apiFetch } from './client';

export const getMyWorkoutPlan = () =>
  apiFetch<{ plan: WorkoutPlan | null }>('/api/workout-plan/me');

export const getAdminUsers = () =>
  apiFetch<{ users: AdminUserSummary[] }>('/api/admin/users');

export const getAdminCoaches = () =>
  apiFetch<{ coaches: AdminCoachSummary[] }>('/api/admin/coaches');

export const createAdminUser = (payload: {
  email: string;
  fullName?: string;
  userType: UserType;
  coachUserId?: string | null;
}) =>
  apiFetch<{
    user: AdminUserSummary;
    inviteUrl: string;
    expiresAt: string | null;
  }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getAdminUserDetail = (userId: string) =>
  apiFetch<AdminUserDetail>(`/api/admin/users/${userId}/detail`);

export const assignAdminUserCoach = (userId: string, coachUserId: string | null) =>
  apiFetch<AdminUserDetail>(`/api/admin/users/${userId}/coach`, {
    method: 'PUT',
    body: JSON.stringify({ coachUserId }),
  });

export const updateAdminUserStatus = (userId: string, status: 'active' | 'disabled') =>
  apiFetch<AdminUserDetail>(`/api/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const regenerateAdminUserInvite = (userId: string) =>
  apiFetch<{ userId: string; inviteUrl: string; expiresAt: string | null }>(
    `/api/admin/users/${userId}/invite/regenerate`,
    {
      method: 'POST',
    }
  );

export const createAdminCheckin = (
  userId: string,
  payload: { recordedAt: string; weight: number; fat: number | null }
) =>
  apiFetch<AdminUserDetail>(`/api/admin/users/${userId}/checkins`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listAdminUserWorkouts = (userId: string) =>
  apiFetch<{ workouts: AdminWorkoutPlanSummary[] }>(`/api/admin/users/${userId}/workouts`);

export const createAdminUserWorkout = (userId: string, copyFromPlanId?: string | null) =>
  apiFetch<{ plan: AdminWorkoutPlan }>(`/api/admin/users/${userId}/workouts`, {
    method: 'POST',
    body: JSON.stringify({ copyFromPlanId: copyFromPlanId ?? null }),
  });

export const getAdminWorkoutPlan = (userId: string, planId: string) =>
  apiFetch<{ plan: AdminWorkoutPlan }>(`/api/admin/users/${userId}/workouts/${planId}`);

export const saveAdminWorkoutPlan = (
  userId: string,
  planId: string,
  payload: AdminWorkoutPlanInput
) =>
  apiFetch<{ plan: AdminWorkoutPlan }>(`/api/admin/users/${userId}/workouts/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const activateAdminWorkoutPlan = (userId: string, planId: string) =>
  apiFetch<{ plan: AdminWorkoutPlan }>(
    `/api/admin/users/${userId}/workouts/${planId}/activate`,
    {
      method: 'POST',
    }
  );
