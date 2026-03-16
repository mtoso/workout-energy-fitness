import { listWorkoutPlansForUser } from './admin-workouts';
import { displayNameFromEmail } from './names';
import { requireManagedUserAccess } from './guards';
import { fail } from './response';
import type { AuthSession, Env, UserStatus, UserType } from './types';

const mapCoachSummary = (row: {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: number;
  status: UserStatus;
  assigned_clients?: number;
}) => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name?.trim() || displayNameFromEmail(row.email),
  isAdmin: Boolean(row.is_admin),
  status: row.status,
  assignedClientCount: Number(row.assigned_clients || 0),
});

const mapUserSummary = (row: {
  id: string;
  email: string;
  full_name: string | null;
  user_type: UserType;
  is_admin: number;
  status: UserStatus;
  created_at: string;
  activated_at: string | null;
  last_login_at: string | null;
  invite_expires_at: string | null;
  coach_id: string | null;
  coach_email: string | null;
  coach_full_name: string | null;
  coach_is_admin: number | null;
  coach_status: UserStatus | null;
}) => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name?.trim() || displayNameFromEmail(row.email),
  userType: row.user_type,
  isAdmin: Boolean(row.is_admin),
  status: row.status,
  createdAt: row.created_at,
  activatedAt: row.activated_at,
  lastLoginAt: row.last_login_at,
  inviteExpiresAt: row.invite_expires_at,
  coach:
    row.coach_id && row.coach_email && row.coach_status
      ? mapCoachSummary({
          id: row.coach_id,
          email: row.coach_email,
          full_name: row.coach_full_name,
          is_admin: row.coach_is_admin ?? 0,
          status: row.coach_status,
        })
      : null,
});

export const listVisibleUsers = async (env: Env, auth: AuthSession) => {
  const baseSelect = `
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.user_type,
      u.is_admin,
      u.status,
      u.created_at,
      u.activated_at,
      u.last_login_at,
      u.invite_expires_at,
      coach.id AS coach_id,
      coach.email AS coach_email,
      coach.full_name AS coach_full_name,
      coach.is_admin AS coach_is_admin,
      coach.status AS coach_status
    FROM users u
    LEFT JOIN users coach ON coach.id = u.coach_user_id
  `;

  let result;
  if (auth.user.isAdmin) {
    result = await env.DB.prepare(
      `${baseSelect}
       WHERE u.id != ?
       ORDER BY CASE u.user_type WHEN 'coach' THEN 0 ELSE 1 END, COALESCE(u.full_name, u.email) ASC`
    )
      .bind(auth.user.id)
      .all();
  } else {
    result = await env.DB.prepare(
      `${baseSelect}
       WHERE u.user_type = 'client'
         AND u.coach_user_id = ?
       ORDER BY COALESCE(u.full_name, u.email) ASC`
    )
      .bind(auth.user.id)
      .all();
  }

  return result.results.map((row) =>
    mapUserSummary({
      id: String(row.id),
      email: String(row.email),
      full_name: typeof row.full_name === 'string' ? row.full_name : null,
      user_type: row.user_type === 'coach' ? 'coach' : 'client',
      is_admin: Number(row.is_admin || 0),
      status: row.status === 'disabled' ? 'disabled' : row.status === 'invited' ? 'invited' : 'active',
      created_at: String(row.created_at),
      activated_at: typeof row.activated_at === 'string' ? row.activated_at : null,
      last_login_at: typeof row.last_login_at === 'string' ? row.last_login_at : null,
      invite_expires_at: typeof row.invite_expires_at === 'string' ? row.invite_expires_at : null,
      coach_id: typeof row.coach_id === 'string' ? row.coach_id : null,
      coach_email: typeof row.coach_email === 'string' ? row.coach_email : null,
      coach_full_name: typeof row.coach_full_name === 'string' ? row.coach_full_name : null,
      coach_is_admin: row.coach_is_admin === null || row.coach_is_admin === undefined ? null : Number(row.coach_is_admin),
      coach_status:
        row.coach_status === 'disabled'
          ? 'disabled'
          : row.coach_status === 'invited'
            ? 'invited'
            : row.coach_status === 'active'
              ? 'active'
              : null,
    })
  );
};

export const listCoaches = async (env: Env) => {
  const coaches = await env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.is_admin,
        u.status,
        COUNT(client.id) AS assigned_clients
      FROM users u
      LEFT JOIN users client ON client.coach_user_id = u.id AND client.user_type = 'client'
      WHERE u.user_type = 'coach'
      GROUP BY u.id, u.email, u.full_name, u.is_admin, u.status
      ORDER BY COALESCE(u.full_name, u.email) ASC
    `
  ).all<{
    id: string;
    email: string;
    full_name: string | null;
    is_admin: number;
    status: UserStatus;
    assigned_clients: number;
  }>();

  return coaches.results.map(mapCoachSummary);
};

const loadUserSummaryRow = async (env: Env, userId: string) =>
  env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.user_type,
        u.is_admin,
        u.status,
        u.created_at,
        u.activated_at,
        u.last_login_at,
        u.invite_expires_at,
        coach.id AS coach_id,
        coach.email AS coach_email,
        coach.full_name AS coach_full_name,
        coach.is_admin AS coach_is_admin,
        coach.status AS coach_status
      FROM users u
      LEFT JOIN users coach ON coach.id = u.coach_user_id
      WHERE u.id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{
      id: string;
      email: string;
      full_name: string | null;
      user_type: UserType;
      is_admin: number;
      status: UserStatus;
      created_at: string;
      activated_at: string | null;
      last_login_at: string | null;
      invite_expires_at: string | null;
      coach_id: string | null;
      coach_email: string | null;
      coach_full_name: string | null;
      coach_is_admin: number | null;
      coach_status: UserStatus | null;
    }>();

export const getManagedUserDetail = async (env: Env, auth: AuthSession, userId: string) => {
  const targetUser = await requireManagedUserAccess(auth, env, userId);
  if (targetUser instanceof Response) return targetUser;

  const [user, checkins, workouts] = await Promise.all([
    loadUserSummaryRow(env, targetUser.id),
    env.DB.prepare(
      `
        SELECT id, recorded_at, weight, body_fat
        FROM body_checkins
        WHERE user_id = ?
        ORDER BY datetime(recorded_at) DESC
      `
    )
      .bind(targetUser.id)
      .all<{
        id: string;
        recorded_at: string;
        weight: number;
        body_fat: number | null;
      }>(),
    listWorkoutPlansForUser(env, targetUser.id),
  ]);

  if (!user) {
    return fail(404, 'user_not_found', 'Utente non trovato.');
  }

  return {
    user: mapUserSummary(user),
    coach:
      user.coach_id && user.coach_email && user.coach_status
        ? mapCoachSummary({
            id: user.coach_id,
            email: user.coach_email,
            full_name: user.coach_full_name,
            is_admin: user.coach_is_admin ?? 0,
            status: user.coach_status,
          })
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

export const assignCoachToClient = async (
  env: Env,
  clientUserId: string,
  coachUserId: string | null
) => {
  const client = await env.DB.prepare(
    `SELECT id FROM users WHERE id = ? AND user_type = 'client' LIMIT 1`
  )
    .bind(clientUserId)
    .first();

  if (!client) {
    return fail(404, 'user_not_found', 'Cliente non trovato.');
  }

  if (coachUserId) {
    const coach = await env.DB.prepare(
      `SELECT id FROM users WHERE id = ? AND user_type = 'coach' AND status != 'disabled' LIMIT 1`
    )
      .bind(coachUserId)
      .first();

    if (!coach) {
      return fail(400, 'invalid_coach', 'Il coach deve essere un utente coach esistente.');
    }
  }

  await env.DB.prepare(
    `
      UPDATE users
      SET coach_user_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(coachUserId, clientUserId)
    .run();

  return { ok: true };
};

export const createBodyCheckin = async (
  env: Env,
  auth: AuthSession,
  userId: string,
  payload: { recordedAt: string; weight: number; fat: number | null }
) => {
  const targetUser = await requireManagedUserAccess(auth, env, userId);
  if (targetUser instanceof Response) return targetUser;

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
      targetUser.id,
      payload.recordedAt,
      payload.weight,
      payload.fat,
      auth.user.id
    )
    .run();

  return getManagedUserDetail(env, auth, targetUser.id);
};

export const updateManagedUserStatus = async (
  env: Env,
  auth: AuthSession,
  userId: string,
  status: UserStatus
) => {
  const targetUser = await requireManagedUserAccess(auth, env, userId);
  if (targetUser instanceof Response) return targetUser;

  if (targetUser.id === auth.user.id) {
    return fail(400, 'cannot_change_own_status', 'Non puoi modificare lo stato del tuo account.');
  }

  if (targetUser.is_admin) {
    return fail(400, 'cannot_change_admin_status', 'Non puoi modificare lo stato di un account amministratore.');
  }

  if (status !== 'active' && status !== 'disabled') {
    return fail(400, 'invalid_status', "Lo stato account deve essere 'active' o 'disabled'.");
  }

  await env.DB.prepare(
    `
      UPDATE users
      SET status = ?,
          invite_token_hash = CASE WHEN ? = 'active' THEN invite_token_hash ELSE NULL END,
          invite_expires_at = CASE WHEN ? = 'active' THEN invite_expires_at ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(status, status, status, targetUser.id)
    .run();

  if (status === 'disabled') {
    await env.DB.prepare(
      `
        UPDATE sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
          AND revoked_at IS NULL
      `
    )
      .bind(targetUser.id)
      .run();
  }

  return getManagedUserDetail(env, auth, targetUser.id);
};
