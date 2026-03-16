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
        AND (
          invite_expires_at IS NULL
          OR datetime(invite_expires_at) > CURRENT_TIMESTAMP
        )
      LIMIT 1
    `
  )
    .bind(tokenHash)
    .first<InvitedUserRow>();
};

export const getInviteMetadata = async (env: Env, inviteToken: string) => {
  const normalizedToken = inviteToken.trim();
  if (!normalizedToken) {
    return { valid: false, email: null, fullName: null, userType: null };
  }

  const invitedUser = await findInvitedUserByToken(env, normalizedToken);
  if (!invitedUser) {
    return { valid: false, email: null, fullName: null, userType: null };
  }

  return {
    valid: true,
    email: invitedUser.email,
    fullName: invitedUser.full_name?.trim() || null,
    userType: invitedUser.user_type,
  } satisfies {
    valid: boolean;
    email: string | null;
    fullName: string | null;
    userType: UserType | null;
  };
};

export const createInvitedUser = async (
  env: Env,
  input: CreateInvitedUserInput
): Promise<{ userId: string; inviteToken: string } | Response> => {
  const normalizedEmail = normalizeEmail(input.email);
  const fullName = input.fullName?.trim() || null;

  if (!normalizedEmail) {
    return fail(400, 'invalid_email', "L'email è obbligatoria.");
  }

  if (!['client', 'coach'].includes(input.userType)) {
    return fail(400, 'invalid_user_type', 'Il tipo utente deve essere cliente oppure coach.');
  }

  const existingUser = await findUserByEmail(env, normalizedEmail);
  if (existingUser) {
    return fail(409, 'account_exists', 'Esiste già un utente con questa email.');
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
      return fail(400, 'invalid_coach', 'Il coach assegnato deve essere un utente coach esistente.');
    }

    coachUserId = input.coachUserId;
  }

  const userId = crypto.randomUUID();
  const inviteToken = crypto.randomUUID();
  const inviteTokenHash = await sha256Hex(inviteToken);

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
      null
    )
    .run();

  return { userId, inviteToken };
};

export const regenerateInviteForUser = async (
  env: Env,
  userId: string
): Promise<{ userId: string; inviteToken: string } | Response> => {
  const user = await env.DB.prepare(
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
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<UserRow>();

  if (!user) {
    return fail(404, 'user_not_found', 'Utente non trovato.');
  }

  if (user.status !== 'invited') {
    return fail(400, 'invite_not_available', "L'utente non è più in stato invitato.");
  }

  const inviteToken = crypto.randomUUID();
  const inviteTokenHash = await sha256Hex(inviteToken);

  await env.DB.prepare(
    `
      UPDATE users
      SET invite_token_hash = ?,
          invite_expires_at = NULL,
          invited_at = COALESCE(invited_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(inviteTokenHash, userId)
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
    return fail(400, 'email_mismatch', "L'email dell'invito non corrisponde a quella inserita.");
  }

  if (identity.provider === 'email') {
    if (!password || password.length < 8) {
      return fail(400, 'invalid_password', 'La password deve contenere almeno 8 caratteri.');
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
    return fail(409, 'identity_conflict', 'Questa identità è già collegata a un altro account.');
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

export const createSelfRegisteredEmailUser = async (
  env: Env,
  input: { fullName: string; email: string; password: string }
): Promise<{ userId: string } | Response> => {
  const normalizedEmail = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  const password = input.password;

  if (!fullName) {
    return fail(400, 'invalid_full_name', 'Il nome completo è obbligatorio.');
  }

  if (!normalizedEmail) {
    return fail(400, 'invalid_email', "L'email è obbligatoria.");
  }

  if (!password || password.length < 8) {
    return fail(400, 'invalid_password', 'La password deve contenere almeno 8 caratteri.');
  }

  const existingUser = await findUserByEmail(env, normalizedEmail);
  if (existingUser) {
    return fail(409, 'account_exists', 'Esiste già un account con questa email. Usa il login.');
  }

  const userId = crypto.randomUUID();
  await env.DB.batch([
    env.DB
      .prepare(
        `
          INSERT INTO users (
            id,
            email,
            full_name,
            user_type,
            is_admin,
            status,
            activated_at,
            last_login_at
          )
          VALUES (?, ?, ?, 'client', 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `
      )
      .bind(userId, normalizedEmail, fullName),
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
          VALUES (?, ?, 'email', ?, 1, CURRENT_TIMESTAMP)
        `
      )
      .bind(crypto.randomUUID(), userId, normalizedEmail),
    env.DB
      .prepare(
        `
          INSERT INTO email_credentials (user_id, password_hash)
          VALUES (?, ?)
        `
      )
      .bind(userId, hashPassword(password)),
  ]);

  return { userId };
};

export const createSelfRegisteredGoogleUser = async (
  env: Env,
  input: {
    fullName: string;
    email: string;
    googleSubject: string;
    emailVerified: boolean;
  }
): Promise<{ userId: string } | Response> => {
  const normalizedEmail = normalizeEmail(input.email);
  const fullName = input.fullName.trim();

  if (!fullName) {
    return fail(400, 'invalid_full_name', 'Il nome completo è obbligatorio.');
  }

  if (!normalizedEmail) {
    return fail(400, 'invalid_email', "L'email è obbligatoria.");
  }

  if (!input.emailVerified) {
    return fail(400, 'invalid_token', "Il token Google deve includere un'email verificata.");
  }

  const [existingUser, existingIdentity] = await Promise.all([
    findUserByEmail(env, normalizedEmail),
    env.DB.prepare(
      `
        SELECT id
        FROM user_identities
        WHERE provider = 'google'
          AND provider_subject = ?
        LIMIT 1
      `
    )
      .bind(input.googleSubject)
      .first(),
  ]);

  if (existingUser || existingIdentity) {
    return fail(409, 'account_exists', 'Esiste già un account con questa email. Usa il login.');
  }

  const userId = crypto.randomUUID();
  await env.DB.batch([
    env.DB
      .prepare(
        `
          INSERT INTO users (
            id,
            email,
            full_name,
            user_type,
            is_admin,
            status,
            activated_at,
            last_login_at
          )
          VALUES (?, ?, ?, 'client', 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `
      )
      .bind(userId, normalizedEmail, fullName),
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
          VALUES (?, ?, 'google', ?, ?, CURRENT_TIMESTAMP)
        `
      )
      .bind(crypto.randomUUID(), userId, input.googleSubject, input.emailVerified ? 1 : 0),
  ]);

  return { userId };
};

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
