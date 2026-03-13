import type { AdminCoachSummary, AdminUserDetail, AdminUserSummary } from '../../types/admin';
import type {
  AdminWorkoutPlan,
  AdminWorkoutPlanInput,
  AdminWorkoutPlanSummary,
} from '../../types/admin-workout';
import type { UserRole } from '../../types/auth';
import type { WorkoutPlan } from '../../types/workout';
import { apiFetch } from './client';

export const getMyWorkoutPlan = () =>
  apiFetch<{ plan: WorkoutPlan | null }>('/api/workout-plan/me');

export const getAdminUsers = () =>
  apiFetch<{ users: AdminUserSummary[] }>('/api/admin/users');

export const getAdminCoaches = () =>
  apiFetch<{ coaches: AdminCoachSummary[] }>('/api/admin/coaches');

export const createAdminInvite = (payload: {
  email: string;
  role: UserRole;
  fullName?: string;
  coachUserId?: string | null;
  expiresInHours: number;
}) =>
  apiFetch<{
    inviteUrl: string;
    expiresAt: string;
    role: UserRole;
    email: string;
    fullName: string | null;
    coachUserId: string | null;
  }>('/api/admin/invites', {
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

export const getAdminUserWorkoutPlan = (userId: string) =>
  apiFetch<{ user: AdminUserSummary; plan: WorkoutPlan | null }>(
    `/api/admin/users/${userId}/workout-plan`
  );

export const saveAdminUserWorkoutPlan = (userId: string, payload: WorkoutPlanInput) =>
  apiFetch<{ user: AdminUserSummary; plan: WorkoutPlan | null }>(
    `/api/admin/users/${userId}/workout-plan`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );

type WorkoutPlanInput = {
  title: string;
  days: Array<{
    id?: number;
    name: string;
    focus: string;
    exercises: Array<{
      id?: string;
      name: string;
      sets: number;
      reps: string;
      rest: string;
      trainerNote?: string;
      previous?: { weight: string | number; reps: string | number; date: string };
    }>;
  }>;
};
