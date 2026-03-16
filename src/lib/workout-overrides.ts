import type { Exercise, WeightUnit, WorkoutPlan } from '../types/workout';

interface WorkoutOverrideEntry {
  targetLoad: string;
  targetLoadUnit: WeightUnit;
}

type WorkoutOverrideMap = Record<string, WorkoutOverrideEntry>;

const STORAGE_PREFIX = 'workout-plan-overrides';

const getPlanKey = (userId: string, plan: WorkoutPlan) =>
  `${STORAGE_PREFIX}:${userId}:${plan.id}:${plan.publishedAt ?? 'draft'}`;

const getItemKey = (dayIndex: number, exerciseIndex: number, itemIndex: number) =>
  `${dayIndex}:${exerciseIndex}:${itemIndex}`;

const readOverrideMap = (userId: string, plan: WorkoutPlan): WorkoutOverrideMap => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(getPlanKey(userId, plan));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as WorkoutOverrideMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeOverrideMap = (userId: string, plan: WorkoutPlan, value: WorkoutOverrideMap) => {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = getPlanKey(userId, plan);
    if (Object.keys(value).length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore local storage failures; the server remains the source of truth.
  }
};

const applyOverrideToExercise = (
  exercise: Exercise,
  overrides: WorkoutOverrideMap,
  dayIndex: number,
  exerciseIndex: number
): Exercise => {
  if (exercise.items?.length) {
    const nextItems = exercise.items.map((item, itemIndex) => {
      const override = overrides[getItemKey(dayIndex, exerciseIndex, itemIndex)];
      if (!override) return item;

      return {
        ...item,
        targetLoad: override.targetLoad,
        targetLoadUnit: override.targetLoadUnit,
      };
    });

    const primaryItem = nextItems[0];
    return {
      ...exercise,
      items: nextItems,
      targetLoad: primaryItem?.targetLoad ?? exercise.targetLoad,
      targetLoadUnit: primaryItem?.targetLoadUnit ?? exercise.targetLoadUnit,
    };
  }

  const override = overrides[getItemKey(dayIndex, exerciseIndex, 0)];
  if (!override) return exercise;

  return {
    ...exercise,
    targetLoad: override.targetLoad,
    targetLoadUnit: override.targetLoadUnit,
  };
};

export const applyWorkoutPlanOverrides = (userId: string, plan: WorkoutPlan | null): WorkoutPlan | null => {
  if (!plan) return null;

  const overrides = readOverrideMap(userId, plan);
  if (Object.keys(overrides).length === 0) return plan;

  return {
    ...plan,
    days: plan.days.map((day, dayIndex) => ({
      ...day,
      exercises: day.exercises.map((exercise, exerciseIndex) =>
        applyOverrideToExercise(exercise, overrides, dayIndex, exerciseIndex)
      ),
    })),
  };
};

export const saveWorkoutExerciseOverrides = (
  userId: string,
  plan: WorkoutPlan,
  dayIndex: number,
  exerciseIndex: number,
  items: WorkoutOverrideEntry[]
) => {
  const overrides = readOverrideMap(userId, plan);

  items.forEach((item, itemIndex) => {
    const key = getItemKey(dayIndex, exerciseIndex, itemIndex);
    const normalizedLoad = item.targetLoad.trim();
    const normalizedUnit = item.targetLoadUnit === 'lb' ? 'lb' : 'kg';

    if (!normalizedLoad && normalizedUnit === 'kg') {
      delete overrides[key];
      return;
    }

    overrides[key] = {
      targetLoad: normalizedLoad,
      targetLoadUnit: normalizedUnit,
    };
  });

  writeOverrideMap(userId, plan, overrides);
};
