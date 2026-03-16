export type WeightUnit = 'kg' | 'lb';

export interface PreviousData {
  weight: number | string;
  reps: number | string;
  date: string;
}

export interface Exercise {
  id: string;
  type?: 'single' | 'superset';
  name: string;
  sets: number;
  reps: string;
  rest: string;
  targetLoad?: string;
  targetLoadUnit?: WeightUnit;
  items?: Array<{
    id: string;
    name: string;
    reps: string;
    targetLoad?: string;
    targetLoadUnit?: WeightUnit;
    previous?: PreviousData;
  }>;
  previous?: PreviousData;
  trainerNote?: string;
}

export interface WorkoutDay {
  id: number;
  name: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  title: string;
  publishedAt: string | null;
  days: WorkoutDay[];
}

export interface WorkoutPlanSummary {
  id: string;
  title: string;
  publishedAt: string;
  isPreferred: boolean;
}

export interface WorkoutPlansOverview {
  preferredPlan: WorkoutPlan | null;
  plans: WorkoutPlanSummary[];
  hasUnseenPublication: boolean;
  latestPublishedPlanId: string | null;
}

export interface WorkoutPlanInput {
  title: string;
  days: WorkoutDay[];
}

export interface WeightRecord {
  id: number;
  date: string;
  weight: number;
  fat: number;
}
