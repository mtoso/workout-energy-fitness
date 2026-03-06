export interface PreviousData {
  weight: number | string;
  reps: number | string;
  date: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
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
  days: WorkoutDay[];
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
