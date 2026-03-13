import { hashPassword, sha256Hex } from './crypto';
import { toAuthUser } from './auth';
import { normalizeEmail } from './http';
import { fail } from './response';
import type { AuthProvider, AuthUser, Env, InvitedUserRow, UserRow, UserType } from './types';

interface IdentityInput {
  provider: AuthProvider;
  providerSubject: string;
  emailVerified: boolean;
}

interface CreateInvitedUserInput {
  email: string;
  fullName?: string | null;
  userType: UserType;
  coachUserId?: string | null;
  invitedByUserId: string;
  expiresInHours: number;
}

export const findUserByEmail = async (env: Env, email: string) =>
  env.DB.prepare(
    `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at,
        activated_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `
  )
    .bind(normalizeEmail(email))
    .first<UserRow>();

export const getAuthUserById = async (env: Env, userId: string): Promise<AuthUser | null> => {
  const row = await env.DB.prepare(
    `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{
      id: string;
      email: string;
      full_name: string | null;
      user_type: 'client' | 'coach';
      is_admin: number;
      status: 'invited' | 'active' | 'disabled';
      coach_user_id: string | null;
    }>();

  return row ? toAuthUser(row) : null;
};

export const findInvitedUserByToken = async (
  env: Env,
  inviteToken: string
): Promise<InvitedUserRow | null> => {
  const tokenHash = await sha256Hex(inviteToken);

  return env.DB.prepare(
    `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at,
        activated_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE invite_token_hash = ?
        AND status = 'invited'
        AND datetime(invite_expires_at) > CURRENT_TIMESTAMP
      LIMIT 1
    `
  )
    .bind(tokenHash)
    .first<InvitedUserRow>();
};

export const createInvitedUser = async (
  env: Env,
  input: CreateInvitedUserInput
): Promise<{ userId: string; inviteToken: string } | Response> => {
  const normalizedEmail = normalizeEmail(input.email);
  const fullName = input.fullName?.trim() || null;
  const expiresInHours = Number(input.expiresInHours);

  if (!normalizedEmail) {
    return fail(400, 'invalid_email', 'Email is required.');
  }

  if (!['client', 'coach'].includes(input.userType)) {
    return fail(400, 'invalid_user_type', 'User type must be client or coach.');
  }

  if (!Number.isFinite(expiresInHours) || expiresInHours <= 0 || expiresInHours > 24 * 30) {
    return fail(400, 'invalid_expiry', 'Invite expiry must be between 1 and 720 hours.');
  }

  const existingUser = await findUserByEmail(env, normalizedEmail);
  if (existingUser) {
    return fail(409, 'account_exists', 'A user with this email already exists.');
  }

  let coachUserId: string | null = null;
  if (input.userType === 'client' && input.coachUserId) {
    const coach = await env.DB.prepare(
      `
        SELECT id
        FROM users
        WHERE id = ?
          AND user_type = 'coach'
          AND status != 'disabled'
        LIMIT 1
      `
    )
      .bind(input.coachUserId)
      .first();

    if (!coach) {
      return fail(400, 'invalid_coach', 'Assigned coach must be an existing coach user.');
    }

    coachUserId = input.coachUserId;
  }

  const userId = crypto.randomUUID();
  const inviteToken = crypto.randomUUID();
  const inviteTokenHash = await sha256Hex(inviteToken);
  const inviteExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `
      INSERT INTO users (
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at
      )
      VALUES (?, ?, ?, ?, 0, 'invited', ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `
  )
    .bind(
      userId,
      normalizedEmail,
      fullName,
      input.userType,
      coachUserId,
      input.invitedByUserId,
      inviteTokenHash,
      inviteExpiresAt
    )
    .run();

  return { userId, inviteToken };
};

export const activateInvitedUser = async (
  env: Env,
  invitedUser: InvitedUserRow,
  email: string,
  identity: IdentityInput,
  password?: string
): Promise<{ userId: string } | Response> => {
  const normalizedEmail = normalizeEmail(email);
  if (normalizeEmail(invitedUser.email) !== normalizedEmail) {
    return fail(400, 'email_mismatch', 'Invite email does not match supplied email.');
  }

  if (identity.provider === 'email') {
    if (!password || password.length < 8) {
      return fail(400, 'invalid_password', 'Password must be at least 8 characters.');
    }
  }

  const existingIdentity = await env.DB.prepare(
    `
      SELECT id
      FROM user_identities
      WHERE provider = ?
        AND provider_subject = ?
      LIMIT 1
    `
  )
    .bind(identity.provider, identity.providerSubject)
    .first();

  if (existingIdentity) {
    return fail(409, 'identity_conflict', 'This identity is already linked to another account.');
  }

  const statements = [
    env.DB
      .prepare(
        `
          INSERT INTO user_identities (
            id,
            user_id,
            provider,
            provider_subject,
            email_verified,
            last_login_at
          )
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `
      )
      .bind(
        crypto.randomUUID(),
        invitedUser.id,
        identity.provider,
        identity.providerSubject,
        identity.emailVerified ? 1 : 0
      ),
    env.DB
      .prepare(
        `
          UPDATE users
          SET status = 'active',
              invite_token_hash = NULL,
              invite_expires_at = NULL,
              activated_at = CURRENT_TIMESTAMP,
              last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      )
      .bind(invitedUser.id),
  ];

  if (identity.provider === 'email' && password) {
    statements.push(
      env.DB
        .prepare(
          `
            INSERT INTO email_credentials (user_id, password_hash)
            VALUES (?, ?)
          `
        )
        .bind(invitedUser.id, hashPassword(password))
    );
  }

  await env.DB.batch(statements);

  return { userId: invitedUser.id };
};

export const attachIdentityToUser = async (
  env: Env,
  userId: string,
  provider: Exclude<AuthProvider, 'email'>,
  providerSubject: string,
  emailVerified: boolean
) => {
  try {
    await env.DB.prepare(
      `
        INSERT INTO user_identities (
          id,
          user_id,
          provider,
          provider_subject,
          email_verified,
          last_login_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
    )
      .bind(crypto.randomUUID(), userId, provider, providerSubject, emailVerified ? 1 : 0)
      .run();
    return true;
  } catch {
    return false;
  }
};

export const getUserByIdentity = async (
  env: Env,
  provider: AuthProvider,
  providerSubject: string
) =>
  env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.user_type,
        u.is_admin,
        u.status,
        u.coach_user_id,
        u.invited_by_user_id,
        u.invite_token_hash,
        u.invite_expires_at,
        u.invited_at,
        u.activated_at,
        u.last_login_at,
        u.created_at,
        u.updated_at
      FROM user_identities i
      JOIN users u ON u.id = i.user_id
      WHERE i.provider = ?
        AND i.provider_subject = ?
      LIMIT 1
    `
  )
    .bind(provider, providerSubject)
    .first<UserRow>();

export const touchIdentityLogin = async (
  env: Env,
  provider: AuthProvider,
  providerSubject: string,
  userId: string
) => {
  await env.DB.batch([
    env.DB
      .prepare(
        `
          UPDATE user_identities
          SET last_login_at = CURRENT_TIMESTAMP
          WHERE provider = ?
            AND provider_subject = ?
        `
      )
      .bind(provider, providerSubject),
    env.DB
      .prepare(
        `
          UPDATE users
          SET last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      )
      .bind(userId),
  ]);
};
