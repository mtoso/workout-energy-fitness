import { createWorkoutPlanForUser, getCurrentFlattenedWorkoutPlanForUser, saveWorkoutPlanById } from './admin-workouts';
import { fail } from './response';
import type { Env } from './types';

export interface WorkoutExerciseInput {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  trainerNote?: string;
  previous?: {
    weight: string | number;
    reps: string | number;
    date: string;
  };
}

export interface WorkoutDayInput {
  id?: number;
  name: string;
  focus: string;
  exercises: WorkoutExerciseInput[];
}

export interface WorkoutPlanInput {
  title: string;
  days: WorkoutDayInput[];
}

const validateExercise = (exercise: WorkoutExerciseInput, dayIndex: number, exerciseIndex: number) => {
  if (!exercise.name?.trim()) {
    return `Day ${dayIndex + 1}, exercise ${exerciseIndex + 1}: missing name.`;
  }

  if (!Number.isInteger(exercise.sets) || exercise.sets <= 0) {
    return `Day ${dayIndex + 1}, exercise ${exerciseIndex + 1}: sets must be a positive integer.`;
  }

  if (!exercise.reps?.trim() || !exercise.rest?.trim()) {
    return `Day ${dayIndex + 1}, exercise ${exerciseIndex + 1}: reps/rest are required.`;
  }

  return null;
};

export const validateWorkoutPlanInput = (
  payload: unknown
): WorkoutPlanInput | Response => {
  if (!payload || typeof payload !== 'object') {
    return fail(400, 'invalid_payload', 'Workout plan payload must be an object.');
  }

  const raw = payload as WorkoutPlanInput;

  if (!raw.title || typeof raw.title !== 'string' || !raw.title.trim()) {
    return fail(400, 'invalid_payload', 'Workout plan title is required.');
  }

  if (!Array.isArray(raw.days) || raw.days.length === 0) {
    return fail(400, 'invalid_payload', 'Workout plan must include at least one day.');
  }

  for (let dayIndex = 0; dayIndex < raw.days.length; dayIndex += 1) {
    const day = raw.days[dayIndex];

    if (!day.name?.trim() || !day.focus?.trim()) {
      return fail(400, 'invalid_payload', `Day ${dayIndex + 1}: name and focus are required.`);
    }

    if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
      return fail(400, 'invalid_payload', `Day ${dayIndex + 1}: exercises are required.`);
    }

    for (let exerciseIndex = 0; exerciseIndex < day.exercises.length; exerciseIndex += 1) {
      const err = validateExercise(day.exercises[exerciseIndex], dayIndex, exerciseIndex);
      if (err) return fail(400, 'invalid_payload', err);
    }
  }

  return {
    title: raw.title.trim(),
    days: raw.days,
  };
};

const toRichAdminPlan = (input: WorkoutPlanInput) => ({
  title: input.title,
  weeks: [
    {
      name: 'Settimana 1',
      days: input.days.map((day) => ({
        name: day.name,
        focus: day.focus,
        groups: day.exercises.map((exercise) => ({
          type: 'single' as const,
          sets: exercise.sets,
          rest: exercise.rest,
          notes: exercise.trainerNote ?? '',
          items: [
            {
              name: exercise.name,
              reps: exercise.reps,
              previous: exercise.previous,
            },
          ],
        })),
      })),
    },
  ],
});

export const getWorkoutPlanForUser = async (env: Env, userId: string) =>
  getCurrentFlattenedWorkoutPlanForUser(env, userId);

export const upsertWorkoutPlanForUser = async (
  env: Env,
  userId: string,
  actorUserId: string,
  input: WorkoutPlanInput
) => {
  const currentPlan = await env.DB.prepare(
    `
      SELECT id
      FROM workout_plans
      WHERE user_id = ?
        AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{ id: string }>();

  const planId = currentPlan?.id;
  if (planId) {
    const result = await saveWorkoutPlanById(env, userId, planId, actorUserId, toRichAdminPlan(input));
    return result instanceof Response ? result : getCurrentFlattenedWorkoutPlanForUser(env, userId);
  }

  const createdPlan = await createWorkoutPlanForUser(env, userId, actorUserId, null);
  if (createdPlan instanceof Response) return createdPlan;

  const savedPlan = await saveWorkoutPlanById(env, userId, createdPlan.id, actorUserId, toRichAdminPlan(input));
  return savedPlan instanceof Response ? savedPlan : getCurrentFlattenedWorkoutPlanForUser(env, userId);
};
