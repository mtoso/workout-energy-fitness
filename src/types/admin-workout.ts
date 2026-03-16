import type { PreviousData, WeightUnit } from './workout';

export interface AdminWorkoutGroupItem {
  id: string;
  name: string;
  reps: string;
  targetLoad: string;
  targetLoadUnit: WeightUnit;
  previous?: PreviousData;
}

export interface AdminWorkoutGroup {
  id: string;
  type: 'single' | 'superset';
  sets: number;
  rest: string;
  notes: string;
  items: AdminWorkoutGroupItem[];
}

export interface AdminWorkoutDay {
  id: string;
  name: string;
  focus: string;
  groups: AdminWorkoutGroup[];
}

export interface AdminWorkoutWeek {
  id: string;
  name: string;
  days: AdminWorkoutDay[];
}

export interface AdminWorkoutPlan {
  id: string;
  title: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  weeks: AdminWorkoutWeek[];
}

export interface AdminWorkoutPlanSummary {
  id: string;
  name: string;
  date: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkoutPlanInput {
  title: string;
  weeks: AdminWorkoutWeek[];
}
