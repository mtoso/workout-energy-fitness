import { listWorkoutPlansForUser } from './admin-workouts';
import { fail } from './response';
import type { Env } from './types';

export const displayNameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

export const listAdminUsersWithProfiles = async (env: Env, role?: 'admin' | 'customer') => {
  const whereRole = role ? 'WHERE u.role = ?' : '';
  const statement = env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        p.full_name,
        coach.id AS coach_id,
        coach.email AS coach_email,
        coach_profile.full_name AS coach_full_name
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN coach_assignments ca ON ca.customer_user_id = u.id
      LEFT JOIN users coach ON coach.id = ca.coach_user_id
      LEFT JOIN user_profiles coach_profile ON coach_profile.user_id = coach.id
      ${whereRole}
      ORDER BY COALESCE(p.full_name, u.email) ASC
    `
  );

  const result = role ? await statement.bind(role).all() : await statement.all();

  return result.results.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    role: row.role === 'admin' ? 'admin' : 'customer',
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    fullName:
      typeof row.full_name === 'string' && row.full_name.trim()
        ? row.full_name.trim()
        : displayNameFromEmail(String(row.email)),
    coach:
      row.coach_id && row.coach_email
        ? {
            id: String(row.coach_id),
            email: String(row.coach_email),
            fullName:
              typeof row.coach_full_name === 'string' && row.coach_full_name.trim()
                ? row.coach_full_name.trim()
                : displayNameFromEmail(String(row.coach_email)),
          }
        : null,
  }));
};

export const listCoaches = async (env: Env) => {
  const coaches = await env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        p.full_name,
        COUNT(ca.customer_user_id) AS assigned_customers
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN coach_assignments ca ON ca.coach_user_id = u.id
      WHERE u.role = 'admin'
      GROUP BY u.id, u.email, p.full_name
      ORDER BY COALESCE(p.full_name, u.email) ASC
    `
  ).all<{
    id: string;
    email: string;
    full_name: string | null;
    assigned_customers: number;
  }>();

  return coaches.results.map((coach) => ({
    id: coach.id,
    email: coach.email,
    fullName: coach.full_name?.trim() || displayNameFromEmail(coach.email),
    assignedCustomerCount: Number(coach.assigned_customers || 0),
  }));
};

export const getAdminUserDetail = async (env: Env, userId: string) => {
  const [user, checkins, workouts] = await Promise.all([
    env.DB.prepare(
      `
        SELECT
          u.id,
          u.email,
          u.role,
          u.is_active,
          u.created_at,
          p.full_name,
          coach.id AS coach_id,
          coach.email AS coach_email,
          coach_profile.full_name AS coach_full_name
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        LEFT JOIN coach_assignments ca ON ca.customer_user_id = u.id
        LEFT JOIN users coach ON coach.id = ca.coach_user_id
        LEFT JOIN user_profiles coach_profile ON coach_profile.user_id = coach.id
        WHERE u.id = ?
        LIMIT 1
      `
    )
      .bind(userId)
      .first<{
        id: string;
        email: string;
        role: 'admin' | 'customer';
        is_active: number;
        created_at: string;
        full_name: string | null;
        coach_id: string | null;
        coach_email: string | null;
        coach_full_name: string | null;
      }>(),
    env.DB.prepare(
      `
        SELECT id, recorded_at, weight, body_fat
        FROM body_checkins
        WHERE user_id = ?
        ORDER BY datetime(recorded_at) DESC
      `
    )
      .bind(userId)
      .all<{
        id: string;
        recorded_at: string;
        weight: number;
        body_fat: number | null;
      }>(),
    listWorkoutPlansForUser(env, userId),
  ]);

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
      fullName: user.full_name?.trim() || displayNameFromEmail(user.email),
    },
    coach:
      user.coach_id && user.coach_email
        ? {
            id: user.coach_id,
            email: user.coach_email,
            fullName:
              user.coach_full_name?.trim() || displayNameFromEmail(user.coach_email),
          }
        : null,
    checkins: checkins.results.map((checkin) => ({
      id: checkin.id,
      date: checkin.recorded_at,
      weight: Number(checkin.weight),
      fat: checkin.body_fat === null ? null : Number(checkin.body_fat),
    })),
    workouts,
  };
};

export const assignCoachToCustomer = async (
  env: Env,
  customerUserId: string,
  coachUserId: string | null,
  actorUserId: string
) => {
  const customer = await env.DB.prepare(
    `SELECT id FROM users WHERE id = ? AND role = 'customer' LIMIT 1`
  )
    .bind(customerUserId)
    .first();

  if (!customer) {
    return fail(404, 'user_not_found', 'Customer not found.');
  }

  if (!coachUserId) {
    await env.DB.prepare(`DELETE FROM coach_assignments WHERE customer_user_id = ?`)
      .bind(customerUserId)
      .run();
    return { ok: true };
  }

  const coach = await env.DB.prepare(
    `SELECT id FROM users WHERE id = ? AND role = 'admin' LIMIT 1`
  )
    .bind(coachUserId)
    .first();

  if (!coach) {
    return fail(400, 'invalid_coach', 'Coach must be an admin user.');
  }

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM coach_assignments WHERE customer_user_id = ?`).bind(customerUserId),
    env.DB
      .prepare(
        `
          INSERT INTO coach_assignments (
            customer_user_id,
            coach_user_id,
            assigned_by_user_id
          )
          VALUES (?, ?, ?)
        `
      )
      .bind(customerUserId, coachUserId, actorUserId),
  ]);

  return { ok: true };
};

export const createBodyCheckin = async (
  env: Env,
  userId: string,
  actorUserId: string,
  payload: { recordedAt: string; weight: number; fat: number | null }
) => {
  const targetUser = await env.DB.prepare(`SELECT id FROM users WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first();

  if (!targetUser) {
    return fail(404, 'user_not_found', 'User not found.');
  }

  await env.DB.prepare(
    `
      INSERT INTO body_checkins (
        id,
        user_id,
        recorded_at,
        weight,
        body_fat,
        created_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      crypto.randomUUID(),
      userId,
      payload.recordedAt,
      payload.weight,
      payload.fat,
      actorUserId
    )
    .run();

  return getAdminUserDetail(env, userId);
};
