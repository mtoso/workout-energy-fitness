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

const parseNullable = (value: unknown) => {
  if (value === undefined || value === null) return null;
  const asString = String(value).trim();
  return asString ? asString : null;
};

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

  if (!Array.isArray(raw.days)) {
    return fail(400, 'invalid_payload', 'Workout plan days must be an array.');
  }

  if (raw.days.length === 0) {
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

export const getWorkoutPlanForUser = async (env: Env, userId: string) => {
  const plan = await env.DB.prepare(
    `
      SELECT id, title
      FROM workout_plans
      WHERE user_id = ?
        AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{ id: string; title: string }>();

  if (!plan) {
    return null;
  }

  const days = await env.DB.prepare(
    `
      SELECT id, day_order, name, focus
      FROM workout_days
      WHERE plan_id = ?
      ORDER BY day_order ASC
    `
  )
    .bind(plan.id)
    .all<{
      id: string;
      day_order: number;
      name: string;
      focus: string;
    }>();

  const dayRows = days.results;

  const mappedDays = await Promise.all(
    dayRows.map(async (day) => {
      const exercises = await env.DB.prepare(
        `
          SELECT
            id,
            exercise_order,
            name,
            sets,
            reps,
            rest,
            trainer_note,
            previous_weight,
            previous_reps,
            previous_date
          FROM workout_exercises
          WHERE day_id = ?
          ORDER BY exercise_order ASC
        `
      )
        .bind(day.id)
        .all<{
          id: string;
          exercise_order: number;
          name: string;
          sets: number;
          reps: string;
          rest: string;
          trainer_note: string | null;
          previous_weight: string | null;
          previous_reps: string | null;
          previous_date: string | null;
        }>();

      return {
        id: day.day_order,
        name: day.name,
        focus: day.focus,
        exercises: exercises.results.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest: exercise.rest,
          trainerNote: exercise.trainer_note ?? undefined,
          previous:
            exercise.previous_weight ||
            exercise.previous_reps ||
            exercise.previous_date
              ? {
                  weight: exercise.previous_weight ?? '',
                  reps: exercise.previous_reps ?? '',
                  date: exercise.previous_date ?? '',
                }
              : undefined,
        })),
      };
    })
  );

  return {
    id: plan.id,
    title: plan.title,
    days: mappedDays,
  };
};

export const upsertWorkoutPlanForUser = async (
  env: Env,
  userId: string,
  actorUserId: string,
  input: WorkoutPlanInput
) => {
  const existingPlan = await env.DB.prepare(
    `
      SELECT id
      FROM workout_plans
      WHERE user_id = ?
        AND is_active = 1
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{ id: string }>();

  const planId = existingPlan?.id ?? crypto.randomUUID();

  if (!existingPlan) {
    await env.DB.prepare(
      `
        INSERT INTO workout_plans (
          id,
          user_id,
          title,
          is_active,
          created_by_user_id,
          updated_by_user_id
        )
        VALUES (?, ?, ?, 1, ?, ?)
      `
    )
      .bind(planId, userId, input.title, actorUserId, actorUserId)
      .run();
  } else {
    await env.DB.prepare(
      `
        UPDATE workout_plans
        SET title = ?,
            updated_by_user_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
      .bind(input.title, actorUserId, planId)
      .run();

    await env.DB.batch([
      env.DB
        .prepare(
          `
            DELETE FROM workout_exercises
            WHERE day_id IN (SELECT id FROM workout_days WHERE plan_id = ?)
          `
        )
        .bind(planId),
      env.DB.prepare(`DELETE FROM workout_days WHERE plan_id = ?`).bind(planId),
    ]);
  }

  for (let dayIndex = 0; dayIndex < input.days.length; dayIndex += 1) {
    const day = input.days[dayIndex];
    const dayId = crypto.randomUUID();

    await env.DB.prepare(
      `
        INSERT INTO workout_days (id, plan_id, day_order, name, focus)
        VALUES (?, ?, ?, ?, ?)
      `
    )
      .bind(dayId, planId, dayIndex + 1, day.name.trim(), day.focus.trim())
      .run();

    for (
      let exerciseIndex = 0;
      exerciseIndex < day.exercises.length;
      exerciseIndex += 1
    ) {
      const exercise = day.exercises[exerciseIndex];

      await env.DB.prepare(
        `
          INSERT INTO workout_exercises (
            id,
            day_id,
            exercise_order,
            name,
            sets,
            reps,
            rest,
            trainer_note,
            previous_weight,
            previous_reps,
            previous_date
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
        .bind(
          crypto.randomUUID(),
          dayId,
          exerciseIndex + 1,
          exercise.name.trim(),
          exercise.sets,
          exercise.reps.trim(),
          exercise.rest.trim(),
          parseNullable(exercise.trainerNote),
          parseNullable(exercise.previous?.weight),
          parseNullable(exercise.previous?.reps),
          parseNullable(exercise.previous?.date)
        )
        .run();
    }
  }

  return getWorkoutPlanForUser(env, userId);
};
