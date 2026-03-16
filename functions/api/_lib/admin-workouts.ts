import { fail } from './response';
import type { Env } from './types';

type WorkoutLoadUnit = 'kg' | 'lb';

export interface AdminWorkoutItemInput {
  id?: string;
  name: string;
  reps: string;
  targetLoad?: string;
  targetLoadUnit?: WorkoutLoadUnit;
  previous?: {
    weight: string | number;
    reps: string | number;
    date: string;
  };
}

export interface AdminWorkoutGroupInput {
  id?: string;
  type: 'single' | 'superset';
  sets: number;
  rest: string;
  notes?: string;
  items: AdminWorkoutItemInput[];
}

export interface AdminWorkoutDayInput {
  id?: string;
  name: string;
  focus: string;
  groups: AdminWorkoutGroupInput[];
}

export interface AdminWorkoutWeekInput {
  id?: string;
  name: string;
  days: AdminWorkoutDayInput[];
}

export interface AdminWorkoutPlanInput {
  title: string;
  weeks: AdminWorkoutWeekInput[];
}

interface PlanRow {
  id: string;
  title: string;
  is_active: number;
  published_at: string | null;
  published_snapshot_json: string | null;
  created_at: string;
  updated_at: string;
}

interface FlattenedWorkoutExercise {
  id: string;
  type: 'single' | 'superset';
  name: string;
  sets: number;
  reps: string;
  rest: string;
  targetLoad?: string;
  targetLoadUnit?: WorkoutLoadUnit;
  items?: Array<{
    id: string;
    name: string;
    reps: string;
    targetLoad?: string;
    targetLoadUnit?: WorkoutLoadUnit;
    previous?: {
      weight: string | number;
      reps: string | number;
      date: string;
    };
  }>;
  trainerNote?: string;
  previous?: {
    weight: string | number;
    reps: string | number;
    date: string;
  };
}

interface FlattenedWorkoutDay {
  id: number;
  name: string;
  focus: string;
  exercises: FlattenedWorkoutExercise[];
}

interface FlattenedWorkoutWeek {
  id: string;
  name: string;
  days: FlattenedWorkoutDay[];
}

interface FlattenedWorkoutPlan {
  id: string;
  title: string;
  publishedAt: string | null;
  weeks: FlattenedWorkoutWeek[];
}

const parseNullable = (value: unknown) => {
  if (value === undefined || value === null) return null;
  const asString = String(value).trim();
  return asString ? asString : null;
};

const normalizeLoadUnit = (value: unknown): WorkoutLoadUnit =>
  value === 'lb' ? 'lb' : 'kg';

const formatDateLabel = (isoValue: string) => {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return isoValue;

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const loadPlanRow = async (env: Env, planId: string, userId: string) =>
  env.DB.prepare(
    `
      SELECT id, title, is_active, published_at, published_snapshot_json, created_at, updated_at
      FROM workout_plans
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
    `
  )
    .bind(planId, userId)
    .first<PlanRow>();

export const validateAdminWorkoutPlanInput = (
  payload: unknown
): AdminWorkoutPlanInput | Response => {
  if (!payload || typeof payload !== 'object') {
    return fail(400, 'invalid_payload', 'Il payload della scheda deve essere un oggetto.');
  }

  const input = payload as AdminWorkoutPlanInput;
  if (!input.title?.trim()) {
    return fail(400, 'invalid_payload', 'Il titolo della scheda è obbligatorio.');
  }

  if (!Array.isArray(input.weeks) || input.weeks.length === 0) {
    return fail(400, 'invalid_payload', 'La scheda deve includere almeno una settimana.');
  }

  for (let weekIndex = 0; weekIndex < input.weeks.length; weekIndex += 1) {
    const week = input.weeks[weekIndex];
    if (!week.name?.trim()) {
      return fail(400, 'invalid_payload', `Settimana ${weekIndex + 1}: il nome è obbligatorio.`);
    }

    if (!Array.isArray(week.days) || week.days.length === 0) {
      return fail(400, 'invalid_payload', `Settimana ${weekIndex + 1}: è obbligatorio almeno un giorno.`);
    }

    for (let dayIndex = 0; dayIndex < week.days.length; dayIndex += 1) {
      const day = week.days[dayIndex];
      if (!day.name?.trim() || !day.focus?.trim()) {
        return fail(
          400,
          'invalid_payload',
          `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}: nome e focus sono obbligatori.`
        );
      }

      if (!Array.isArray(day.groups) || day.groups.length === 0) {
        return fail(
          400,
          'invalid_payload',
          `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}: è obbligatorio almeno un gruppo di esercizi.`
        );
      }

      for (let groupIndex = 0; groupIndex < day.groups.length; groupIndex += 1) {
        const group = day.groups[groupIndex];
        if (group.type !== 'single' && group.type !== 'superset') {
          return fail(
            400,
            'invalid_payload',
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: tipo non valido.`
          );
        }

        if (!Number.isInteger(group.sets) || group.sets <= 0 || !group.rest?.trim()) {
          return fail(
            400,
            'invalid_payload',
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: serie e recupero sono obbligatori.`
          );
        }

        if (!Array.isArray(group.items) || group.items.length === 0) {
          return fail(
            400,
            'invalid_payload',
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: gli esercizi sono obbligatori.`
          );
        }

        if (group.type === 'single' && group.items.length !== 1) {
          return fail(
            400,
            'invalid_payload',
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: i gruppi singoli devono avere esattamente un esercizio.`
          );
        }

        if (group.type === 'superset' && group.items.length < 2) {
          return fail(
            400,
            'invalid_payload',
            `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}: le superserie devono avere almeno due esercizi.`
          );
        }

        for (let itemIndex = 0; itemIndex < group.items.length; itemIndex += 1) {
          const item = group.items[itemIndex];
          if (!item.name?.trim() || !item.reps?.trim()) {
            return fail(
              400,
              'invalid_payload',
              `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}, esercizio ${itemIndex + 1}: nome e ripetizioni sono obbligatori.`
            );
          }

          if (item.targetLoadUnit && item.targetLoadUnit !== 'kg' && item.targetLoadUnit !== 'lb') {
            return fail(
              400,
              'invalid_payload',
              `Settimana ${weekIndex + 1}, giorno ${dayIndex + 1}, gruppo ${groupIndex + 1}, esercizio ${itemIndex + 1}: l'unità del peso deve essere kg o lb.`
            );
          }
        }
      }
    }
  }

  return input;
};

export const listWorkoutPlansForUser = async (env: Env, userId: string) => {
  const plans = await env.DB.prepare(
    `
      SELECT id, title, is_active, published_at, published_snapshot_json, created_at, updated_at
      FROM workout_plans
      WHERE user_id = ?
      ORDER BY
        CASE WHEN published_at IS NULL THEN 1 ELSE 0 END ASC,
        datetime(published_at) DESC,
        datetime(updated_at) DESC,
        datetime(created_at) DESC
    `
  )
    .bind(userId)
    .all<PlanRow>();

  return plans.results.map((plan) => ({
    id: plan.id,
    name: plan.title,
    date: formatDateLabel(plan.published_at || plan.updated_at || plan.created_at),
    isPublished: Boolean(plan.published_at),
    publishedAt: plan.published_at,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  }));
};

export const getWorkoutPlanById = async (env: Env, userId: string, planId: string) => {
  const plan = await loadPlanRow(env, planId, userId);
  if (!plan) return null;

  const weeks = await env.DB.prepare(
    `
      SELECT id, week_order, name
      FROM workout_weeks
      WHERE plan_id = ?
      ORDER BY week_order ASC
    `
  )
    .bind(plan.id)
    .all<{ id: string; week_order: number; name: string }>();

  const weekResults = await Promise.all(
    weeks.results.map(async (week) => {
      const days = await env.DB.prepare(
        `
          SELECT id, day_order, name, focus
          FROM workout_days
          WHERE week_id = ?
          ORDER BY day_order ASC
        `
      )
        .bind(week.id)
        .all<{ id: string; day_order: number; name: string; focus: string }>();

      const dayResults = await Promise.all(
        days.results.map(async (day) => {
          const groups = await env.DB.prepare(
            `
              SELECT id, group_order, group_type, sets, rest, notes
              FROM workout_exercise_groups
              WHERE day_id = ?
              ORDER BY group_order ASC
            `
          )
            .bind(day.id)
            .all<{
              id: string;
              group_order: number;
              group_type: 'single' | 'superset';
              sets: number;
              rest: string;
              notes: string | null;
            }>();

          const groupResults = await Promise.all(
            groups.results.map(async (group) => {
              const items = await env.DB.prepare(
                `
                  SELECT id, item_order, name, reps, target_load, target_load_unit, previous_weight, previous_reps, previous_date
                  FROM workout_exercise_group_items
                  WHERE group_id = ?
                  ORDER BY item_order ASC
                `
              )
                .bind(group.id)
                .all<{
                  id: string;
                  item_order: number;
                  name: string;
                  reps: string;
                  target_load: string | null;
                  target_load_unit: WorkoutLoadUnit | null;
                  previous_weight: string | null;
                  previous_reps: string | null;
                  previous_date: string | null;
                }>();

              return {
                id: group.id,
                type: group.group_type,
                sets: group.sets,
                rest: group.rest,
                notes: group.notes ?? '',
                items: items.results.map((item) => ({
                  id: item.id,
                  name: item.name,
                  reps: item.reps,
                  targetLoad: item.target_load ?? '',
                  targetLoadUnit: normalizeLoadUnit(item.target_load_unit),
                  previous:
                    item.previous_weight || item.previous_reps || item.previous_date
                      ? {
                          weight: item.previous_weight ?? '',
                          reps: item.previous_reps ?? '',
                          date: item.previous_date ?? '',
                        }
                      : undefined,
                })),
              };
            })
          );

          return {
            id: day.id,
            name: day.name,
            focus: day.focus,
            groups: groupResults,
          };
        })
      );

      return {
        id: week.id,
        name: week.name,
        days: dayResults,
      };
    })
  );

  return {
    id: plan.id,
    title: plan.title,
    isPublished: Boolean(plan.published_at),
    publishedAt: plan.published_at,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    weeks: weekResults,
  };
};

const flattenRichWorkoutPlan = (plan: Awaited<ReturnType<typeof getWorkoutPlanById>>): FlattenedWorkoutPlan | null => {
  if (!plan) return null;

  let nextDayId = 1;
  return {
    id: plan.id,
    title: plan.title,
    publishedAt: plan.publishedAt,
    weeks: plan.weeks.map((week) => ({
      id: week.id,
      name: week.name,
      days: week.days.map((day) => ({
        id: nextDayId++,
        name: day.name,
        focus: day.focus,
        exercises: day.groups.map((group) => {
          if (group.type === 'single') {
            const singleItem = group.items[0];
            return {
              id: group.id,
              type: 'single' as const,
              name: singleItem?.name ?? 'Esercizio',
              sets: group.sets,
              reps: singleItem?.reps ?? '',
              rest: group.rest,
              targetLoad: singleItem?.targetLoad,
              targetLoadUnit: singleItem?.targetLoadUnit,
              items: singleItem
                ? [
                    {
                      id: singleItem.id,
                      name: singleItem.name,
                      reps: singleItem.reps,
                      targetLoad: singleItem.targetLoad,
                      targetLoadUnit: singleItem.targetLoadUnit,
                      previous: singleItem.previous,
                    },
                  ]
                : undefined,
              trainerNote: group.notes || undefined,
              previous: singleItem?.previous,
            };
          }

          const compositeName = group.items.map((item) => item.name).join(' + ');
          const compositeReps = group.items.map((item) => item.reps).join(' / ');
          const trainerNote = [
            group.notes?.trim(),
            `Super Serie: ${group.items.map((item) => `${item.name} (${item.reps})`).join(' + ')}`,
          ]
            .filter(Boolean)
            .join(' | ');

          return {
            id: group.id,
            type: 'superset' as const,
            name: compositeName,
            sets: group.sets,
            reps: compositeReps,
            rest: group.rest,
            items: group.items.map((item) => ({
              id: item.id,
              name: item.name,
              reps: item.reps,
              targetLoad: item.targetLoad,
              targetLoadUnit: item.targetLoadUnit,
              previous: item.previous,
            })),
            trainerNote: trainerNote || undefined,
            previous: group.items[0]?.previous,
          };
        }),
      })),
    })),
  };
};

const parsePublishedSnapshot = (value: string | null): FlattenedWorkoutPlan | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as FlattenedWorkoutPlan;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.weeks)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const clearWorkoutPlanStructure = async (env: Env, planId: string) => {
  const dayIds = await env.DB.prepare(
    `SELECT id FROM workout_days WHERE plan_id = ?`
  )
    .bind(planId)
    .all<{ id: string }>();

  const dayIdList = dayIds.results.map((day) => day.id);

  if (dayIdList.length > 0) {
    const placeholders = dayIdList.map(() => '?').join(', ');
    await env.DB.prepare(
      `
        DELETE FROM workout_exercise_group_items
        WHERE group_id IN (
          SELECT id FROM workout_exercise_groups WHERE day_id IN (${placeholders})
        )
      `
    )
      .bind(...dayIdList)
      .run();

    await env.DB.prepare(
      `DELETE FROM workout_exercise_groups WHERE day_id IN (${placeholders})`
    )
      .bind(...dayIdList)
      .run();
  }

  await env.DB.prepare(`DELETE FROM workout_days WHERE plan_id = ?`).bind(planId).run();
  await env.DB.prepare(`DELETE FROM workout_weeks WHERE plan_id = ?`).bind(planId).run();
};

export const saveWorkoutPlanById = async (
  env: Env,
  userId: string,
  planId: string,
  actorUserId: string,
  input: AdminWorkoutPlanInput
) => {
  const existingPlan = await loadPlanRow(env, planId, userId);
  if (!existingPlan) {
    return fail(404, 'plan_not_found', 'Scheda non trovata.');
  }

  await env.DB.prepare(
    `
      UPDATE workout_plans
      SET title = ?,
          updated_by_user_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(input.title.trim(), actorUserId, planId)
    .run();

  await clearWorkoutPlanStructure(env, planId);

  for (let weekIndex = 0; weekIndex < input.weeks.length; weekIndex += 1) {
    const week = input.weeks[weekIndex];
    const weekId = crypto.randomUUID();

    await env.DB.prepare(
      `
        INSERT INTO workout_weeks (id, plan_id, week_order, name)
        VALUES (?, ?, ?, ?)
      `
    )
      .bind(weekId, planId, weekIndex + 1, week.name.trim())
      .run();

    for (let dayIndex = 0; dayIndex < week.days.length; dayIndex += 1) {
      const day = week.days[dayIndex];
      const dayId = crypto.randomUUID();

      await env.DB.prepare(
        `
          INSERT INTO workout_days (id, plan_id, week_id, day_order, name, focus)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
        .bind(dayId, planId, weekId, dayIndex + 1, day.name.trim(), day.focus.trim())
        .run();

      for (let groupIndex = 0; groupIndex < day.groups.length; groupIndex += 1) {
        const group = day.groups[groupIndex];
        const groupId = crypto.randomUUID();

        await env.DB.prepare(
          `
            INSERT INTO workout_exercise_groups (
              id,
              day_id,
              group_order,
              group_type,
              sets,
              rest,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
        )
          .bind(
            groupId,
            dayId,
            groupIndex + 1,
            group.type,
            group.sets,
            group.rest.trim(),
            parseNullable(group.notes)
          )
          .run();

        for (let itemIndex = 0; itemIndex < group.items.length; itemIndex += 1) {
          const item = group.items[itemIndex];
          await env.DB.prepare(
            `
              INSERT INTO workout_exercise_group_items (
                id,
                group_id,
                item_order,
                name,
                reps,
                target_load,
                target_load_unit,
                previous_weight,
                previous_reps,
                previous_date
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
          )
            .bind(
              crypto.randomUUID(),
              groupId,
              itemIndex + 1,
              item.name.trim(),
              item.reps.trim(),
              parseNullable(item.targetLoad),
              normalizeLoadUnit(item.targetLoadUnit),
              parseNullable(item.previous?.weight),
              parseNullable(item.previous?.reps),
              parseNullable(item.previous?.date)
            )
            .run();
        }
      }
    }
  }

  return getWorkoutPlanById(env, userId, planId);
};

export const createWorkoutPlanForUser = async (
  env: Env,
  userId: string,
  actorUserId: string,
  copyFromPlanId?: string | null
) => {
  const planId = crypto.randomUUID();

  await env.DB.prepare(
    `
      INSERT INTO workout_plans (
        id,
        user_id,
        title,
        created_by_user_id,
        updated_by_user_id
      )
      VALUES (?, ?, ?, ?, ?)
    `
  )
    .bind(planId, userId, 'Nuova Scheda', actorUserId, actorUserId)
    .run();

  let draft: AdminWorkoutPlanInput = {
    title: 'Nuova Scheda',
    weeks: [
      {
        name: 'Settimana 1',
        days: [
          {
            name: 'Giorno 1',
            focus: 'Focus',
            groups: [
              {
                type: 'single',
                sets: 3,
                rest: "1'30\"",
                notes: '',
                items: [{ name: 'Nuovo esercizio', reps: '10', targetLoad: '', targetLoadUnit: 'kg' }],
              },
            ],
          },
        ],
      },
    ],
  };

  if (copyFromPlanId) {
    const source = await getWorkoutPlanById(env, userId, copyFromPlanId);
    if (source) {
      draft = {
        title: source.title,
        weeks: source.weeks,
      };
    }
  }

  return saveWorkoutPlanById(env, userId, planId, actorUserId, draft);
};

export const getFlattenedWorkoutPlanById = async (
  env: Env,
  userId: string,
  planId: string
) => {
  const richPlan = await getWorkoutPlanById(env, userId, planId);
  return flattenRichWorkoutPlan(richPlan);
};

export const getPublishedWorkoutPlanSnapshotById = async (
  env: Env,
  userId: string,
  planId: string
) => {
  const existingPlan = await loadPlanRow(env, planId, userId);
  if (!existingPlan || !existingPlan.published_at) {
    return null;
  }

  const snapshot = parsePublishedSnapshot(existingPlan.published_snapshot_json);
  if (snapshot) {
    return {
      ...snapshot,
      id: existingPlan.id,
      publishedAt: existingPlan.published_at,
    };
  }

  const flattened = await getFlattenedWorkoutPlanById(env, userId, planId);
  if (!flattened) return null;

  return {
    ...flattened,
    publishedAt: existingPlan.published_at,
  };
};

export const publishWorkoutPlanForUser = async (env: Env, userId: string, planId: string) => {
  const existingPlan = await loadPlanRow(env, planId, userId);
  if (!existingPlan) {
    return fail(404, 'plan_not_found', 'Scheda non trovata.');
  }

  const snapshot = await getFlattenedWorkoutPlanById(env, userId, planId);
  if (!snapshot) {
    return fail(400, 'invalid_plan', 'La scheda non può essere pubblicata.');
  }

  await env.DB.prepare(
    `
      UPDATE workout_plans
      SET published_at = CURRENT_TIMESTAMP,
          published_snapshot_json = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(JSON.stringify(snapshot), planId)
    .run();

  const preferredPlanRow = await env.DB.prepare(
    `
      SELECT preferred_workout_plan_id
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{ preferred_workout_plan_id: string | null }>();

  if (!preferredPlanRow?.preferred_workout_plan_id) {
    await env.DB.prepare(
      `
        UPDATE users
        SET preferred_workout_plan_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
      .bind(planId, userId)
      .run();
  }

  return getWorkoutPlanById(env, userId, planId);
};

export const activateWorkoutPlanForUser = async (env: Env, userId: string, planId: string) =>
  publishWorkoutPlanForUser(env, userId, planId);

export const getCurrentFlattenedWorkoutPlanForUser = async (env: Env, userId: string) => {
  const preferredPlanRow = await env.DB.prepare(
    `
      SELECT preferred_workout_plan_id
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{ preferred_workout_plan_id: string | null }>();

  const preferredPlanId = preferredPlanRow?.preferred_workout_plan_id;
  if (preferredPlanId) {
    const preferredPlan = await getPublishedWorkoutPlanSnapshotById(env, userId, preferredPlanId);
    if (preferredPlan) return preferredPlan;
  }

  const latestPublishedPlan = await env.DB.prepare(
    `
      SELECT id
      FROM workout_plans
      WHERE user_id = ?
        AND published_at IS NOT NULL
      ORDER BY datetime(published_at) DESC, datetime(updated_at) DESC, datetime(created_at) DESC
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!latestPublishedPlan) return null;
  return getPublishedWorkoutPlanSnapshotById(env, userId, latestPublishedPlan.id);
};
