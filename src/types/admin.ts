import type { UserRole } from './auth';
import type { AdminWorkoutPlanSummary } from './admin-workout';

export interface AdminCoachSummary {
  id: string;
  email: string;
  fullName: string;
  assignedCustomerCount: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  fullName: string;
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
