import { hashPassword } from './crypto';
import { normalizeEmail } from './http';
import { fail } from './response';
import { sha256Hex } from './crypto';
import type { AuthProvider, Env, InviteRow, UserRole } from './types';

interface IdentityInput {
  provider: AuthProvider;
  providerSubject: string;
  emailVerified: boolean;
}

export const findUserByEmail = async (env: Env, email: string) =>
  env.DB.prepare(
    `
      SELECT id, email, role, is_active
      FROM users
      WHERE email = ?
      LIMIT 1
    `
  )
    .bind(normalizeEmail(email))
    .first<{
      id: string;
      email: string;
      role: UserRole;
      is_active: number;
    }>();

export const findInviteByToken = async (
  env: Env,
  inviteToken: string
): Promise<InviteRow | null> => {
  const tokenHash = await sha256Hex(inviteToken);
  return env.DB.prepare(
    `
      SELECT id, email, role, expires_at, accepted_at
      FROM invites
      WHERE token_hash = ?
        AND accepted_at IS NULL
        AND datetime(expires_at) > CURRENT_TIMESTAMP
      LIMIT 1
    `
  )
    .bind(tokenHash)
    .first<InviteRow>();
};

export const markInviteAccepted = async (
  env: Env,
  inviteId: string,
  userId: string
) => {
  await env.DB.prepare(
    `
      UPDATE invites
      SET accepted_at = CURRENT_TIMESTAMP,
          accepted_user_id = ?
      WHERE id = ?
    `
  )
    .bind(userId, inviteId)
    .run();
};

export const createUserFromInvite = async (
  env: Env,
  invite: InviteRow,
  email: string,
  identity: IdentityInput,
  password?: string
): Promise<{ userId: string } | Response> => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(env, normalizedEmail);
  if (existingUser) {
    return fail(409, 'account_exists', 'An account with this email already exists.');
  }

  const userId = crypto.randomUUID();
  const identityId = crypto.randomUUID();

  try {
    await env.DB.batch([
      env.DB
        .prepare(
          `
            INSERT INTO users (id, email, role, is_active)
            VALUES (?, ?, ?, 1)
          `
        )
        .bind(userId, normalizedEmail, invite.role),
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
          identityId,
          userId,
          identity.provider,
          identity.providerSubject,
          identity.emailVerified ? 1 : 0
        ),
    ]);

    if (identity.provider === 'email') {
      if (!password) {
        return fail(400, 'invalid_password', 'Password is required for email signup.');
      }

      const passwordHash = hashPassword(password);
      await env.DB.prepare(
        `
          INSERT INTO email_credentials (user_id, password_hash)
          VALUES (?, ?)
        `
      )
        .bind(userId, passwordHash)
        .run();
    }

    await markInviteAccepted(env, invite.id, userId);

    return { userId };
  } catch {
    return fail(
      500,
      'create_user_failed',
      'Unable to create user from invite at this time.'
    );
  }
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
        u.id as id,
        u.email as email,
        u.role as role,
        u.is_active as is_active
      FROM user_identities i
      JOIN users u ON u.id = i.user_id
      WHERE i.provider = ?
        AND i.provider_subject = ?
      LIMIT 1
    `
  )
    .bind(provider, providerSubject)
    .first<{
      id: string;
      email: string;
      role: UserRole;
      is_active: number;
    }>();

export const touchIdentityLogin = async (
  env: Env,
  provider: AuthProvider,
  providerSubject: string
) => {
  await env.DB.prepare(
    `
      UPDATE user_identities
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE provider = ?
        AND provider_subject = ?
    `
  )
    .bind(provider, providerSubject)
    .run();
};
