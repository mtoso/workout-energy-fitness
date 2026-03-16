import {
  createWorkoutPlanForUser,
  getCurrentFlattenedWorkoutPlanForUser,
  getPublishedWorkoutPlanSnapshotById,
  saveWorkoutPlanById,
} from './admin-workouts';
import { fail } from './response';
import type { Env } from './types';

export interface WorkoutExerciseInput {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  targetLoad?: string;
  targetLoadUnit?: 'kg' | 'lb';
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
    return `Giorno ${dayIndex + 1}, esercizio ${exerciseIndex + 1}: nome mancante.`;
  }

  if (!Number.isInteger(exercise.sets) || exercise.sets <= 0) {
    return `Giorno ${dayIndex + 1}, esercizio ${exerciseIndex + 1}: le serie devono essere un intero positivo.`;
  }

  if (!exercise.reps?.trim() || !exercise.rest?.trim()) {
    return `Giorno ${dayIndex + 1}, esercizio ${exerciseIndex + 1}: ripetizioni e recupero sono obbligatori.`;
  }

  if (
    exercise.targetLoadUnit &&
    exercise.targetLoadUnit !== 'kg' &&
    exercise.targetLoadUnit !== 'lb'
  ) {
    return `Giorno ${dayIndex + 1}, esercizio ${exerciseIndex + 1}: l'unità del peso deve essere kg o lb.`;
  }

  return null;
};

export const validateWorkoutPlanInput = (
  payload: unknown
): WorkoutPlanInput | Response => {
  if (!payload || typeof payload !== 'object') {
    return fail(400, 'invalid_payload', 'Il payload della scheda deve essere un oggetto.');
  }

  const raw = payload as WorkoutPlanInput;

  if (!raw.title || typeof raw.title !== 'string' || !raw.title.trim()) {
    return fail(400, 'invalid_payload', 'Il titolo della scheda è obbligatorio.');
  }

  if (!Array.isArray(raw.days) || raw.days.length === 0) {
    return fail(400, 'invalid_payload', 'La scheda deve includere almeno un giorno.');
  }

  for (let dayIndex = 0; dayIndex < raw.days.length; dayIndex += 1) {
    const day = raw.days[dayIndex];

    if (!day.name?.trim() || !day.focus?.trim()) {
      return fail(400, 'invalid_payload', `Giorno ${dayIndex + 1}: nome e focus sono obbligatori.`);
    }

    if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
      return fail(400, 'invalid_payload', `Giorno ${dayIndex + 1}: gli esercizi sono obbligatori.`);
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
              targetLoad: exercise.targetLoad ?? '',
              targetLoadUnit: exercise.targetLoadUnit ?? 'kg',
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

const loadWorkoutPreference = async (env: Env, userId: string) =>
  env.DB.prepare(
    `
      SELECT preferred_workout_plan_id, last_seen_workout_publication_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{
      preferred_workout_plan_id: string | null;
      last_seen_workout_publication_at: string | null;
    }>();

const listPublishedPlanRows = async (env: Env, userId: string) =>
  env.DB.prepare(
    `
      SELECT id, title, published_at, published_snapshot_json, updated_at, created_at
      FROM workout_plans
      WHERE user_id = ?
        AND published_at IS NOT NULL
      ORDER BY datetime(published_at) DESC, datetime(updated_at) DESC, datetime(created_at) DESC
    `
  )
    .bind(userId)
    .all<{
      id: string;
      title: string;
      published_at: string;
      published_snapshot_json: string | null;
      updated_at: string;
      created_at: string;
    }>();

const getPublishedTitle = (row: { title: string; published_snapshot_json: string | null }) => {
  if (!row.published_snapshot_json) return row.title;

  try {
    const parsed = JSON.parse(row.published_snapshot_json) as { title?: unknown };
    return typeof parsed?.title === 'string' && parsed.title.trim() ? parsed.title.trim() : row.title;
  } catch {
    return row.title;
  }
};

export const listPublishedWorkoutPlansForUser = async (env: Env, userId: string) => {
  const [preference, planRows] = await Promise.all([
    loadWorkoutPreference(env, userId),
    listPublishedPlanRows(env, userId),
  ]);

  const preferredPlanId = preference?.preferred_workout_plan_id ?? null;
  return planRows.results.map((row) => ({
    id: row.id,
    title: getPublishedTitle(row),
    publishedAt: row.published_at,
    isPreferred: row.id === preferredPlanId,
  }));
};

export const getPublishedWorkoutPlansOverviewForUser = async (env: Env, userId: string) => {
  const [preference, plans] = await Promise.all([
    loadWorkoutPreference(env, userId),
    listPublishedWorkoutPlansForUser(env, userId),
  ]);

  const latestPublishedPlanId = plans[0]?.id ?? null;
  const latestPublishedAt = plans[0]?.publishedAt ?? null;
  const preferredPlanId =
    preference?.preferred_workout_plan_id && plans.some((plan) => plan.id === preference.preferred_workout_plan_id)
      ? preference.preferred_workout_plan_id
      : latestPublishedPlanId;

  const preferredPlan = preferredPlanId
    ? await getPublishedWorkoutPlanSnapshotById(env, userId, preferredPlanId)
    : null;

  return {
    preferredPlan,
    plans: plans.map((plan) => ({
      ...plan,
      isPreferred: plan.id === preferredPlanId,
    })),
    hasUnseenPublication: Boolean(
      latestPublishedAt &&
        (!preference?.last_seen_workout_publication_at ||
          latestPublishedAt > preference.last_seen_workout_publication_at)
    ),
    latestPublishedPlanId,
  };
};

export const getPublishedWorkoutPlanForUser = async (
  env: Env,
  userId: string,
  planId: string
) => getPublishedWorkoutPlanSnapshotById(env, userId, planId);

export const setPreferredWorkoutPlanForUser = async (
  env: Env,
  userId: string,
  planId: string
) => {
  const publishedPlan = await getPublishedWorkoutPlanSnapshotById(env, userId, planId);
  if (!publishedPlan) {
    return fail(404, 'plan_not_found', 'Scheda pubblicata non trovata.');
  }

  const latestPublication = await env.DB.prepare(
    `
      SELECT MAX(published_at) AS latest_published_at
      FROM workout_plans
      WHERE user_id = ?
        AND published_at IS NOT NULL
    `
  )
    .bind(userId)
    .first<{ latest_published_at: string | null }>();

  await env.DB.prepare(
    `
      UPDATE users
      SET preferred_workout_plan_id = ?,
          last_seen_workout_publication_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(planId, latestPublication?.latest_published_at ?? null, userId)
    .run();

  return { preferredPlanId: planId };
};

export const markWorkoutPublicationsSeen = async (env: Env, userId: string) => {
  const latestPublication = await env.DB.prepare(
    `
      SELECT MAX(published_at) AS latest_published_at
      FROM workout_plans
      WHERE user_id = ?
        AND published_at IS NOT NULL
    `
  )
    .bind(userId)
    .first<{ latest_published_at: string | null }>();

  await env.DB.prepare(
    `
      UPDATE users
      SET last_seen_workout_publication_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(latestPublication?.latest_published_at ?? null, userId)
    .run();

  return { lastSeenAt: latestPublication?.latest_published_at ?? null };
};

export const upsertWorkoutPlanForUser = async (
  env: Env,
  userId: string,
  actorUserId: string,
  input: WorkoutPlanInput
) => {
  const preferredPlan = await env.DB.prepare(
    `
      SELECT preferred_workout_plan_id
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{ preferred_workout_plan_id: string | null }>();

  const planId = preferredPlan?.preferred_workout_plan_id ?? null;
  if (planId) {
    const result = await saveWorkoutPlanById(env, userId, planId, actorUserId, toRichAdminPlan(input));
    return result instanceof Response ? result : getCurrentFlattenedWorkoutPlanForUser(env, userId);
  }

  const createdPlan = await createWorkoutPlanForUser(env, userId, actorUserId, null);
  if (createdPlan instanceof Response) return createdPlan;

  const savedPlan = await saveWorkoutPlanById(env, userId, createdPlan.id, actorUserId, toRichAdminPlan(input));
  return savedPlan instanceof Response ? savedPlan : getCurrentFlattenedWorkoutPlanForUser(env, userId);
};
