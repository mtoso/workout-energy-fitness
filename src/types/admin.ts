import type { UserStatus, UserType } from './auth';
import type { AdminWorkoutPlanSummary } from './admin-workout';

export interface AdminCoachSummary {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  status: UserStatus;
  assignedClientCount: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  isAdmin: boolean;
  status: UserStatus;
  createdAt: string;
  activatedAt: string | null;
  lastLoginAt: string | null;
  inviteExpiresAt: string | null;
  coach: AdminCoachSummary | null;
}

export interface AdminCheckin {
  id: string;
  date: string;
  weight: number;
  fat: number | null;
}

export interface AdminUserDetail {
  user: AdminUserSummary;
  coach: AdminCoachSummary | null;
  checkins: AdminCheckin[];
  workouts: AdminWorkoutPlanSummary[];
}
