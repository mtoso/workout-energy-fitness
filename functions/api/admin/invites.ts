import { randomToken, sha256Hex } from '../_lib/crypto';
import { normalizeEmail, readJson } from '../_lib/http';
import { requireAdmin } from '../_lib/guards';
import { fail, json } from '../_lib/response';
import type { Env, UserRole } from '../_lib/types';

interface CreateInvitePayload {
  email: string;
  role?: UserRole;
  expiresInHours?: number;
}

const DEFAULT_EXPIRY_HOURS = 72;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const adminAuth = await requireAdmin(request, env);
  if (adminAuth instanceof Response) return adminAuth;

  const bodyOrResponse = await readJson<CreateInvitePayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const email = normalizeEmail(bodyOrResponse.email || '');
  const role = bodyOrResponse.role === 'admin' ? 'admin' : 'customer';
  const expiresInHours = Number(bodyOrResponse.expiresInHours);
  const ttlHours =
    Number.isFinite(expiresInHours) && expiresInHours >= 1 && expiresInHours <= 24 * 30
      ? Math.round(expiresInHours)
      : DEFAULT_EXPIRY_HOURS;

  if (!email) {
    return fail(400, 'invalid_payload', 'Email is required.');
  }

  const existingUser = await env.DB.prepare(
    `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
    `
  )
    .bind(email)
    .first();

  if (existingUser) {
    return fail(409, 'account_exists', 'An account with this email already exists.');
  }

  const inviteToken = randomToken(32);
  const inviteTokenHash = await sha256Hex(inviteToken);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `
      INSERT INTO invites (
        id,
        email,
        role,
        token_hash,
        invited_by_user_id,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      crypto.randomUUID(),
      email,
      role,
      inviteTokenHash,
      adminAuth.user.id,
      expiresAt
    )
    .run();

  const requestOrigin = new URL(request.url).origin;
  const baseUrl = env.APP_BASE_URL?.trim() || requestOrigin;

  return json(
    {
      inviteUrl: `${baseUrl}/accept-invite?token=${inviteToken}`,
      expiresAt,
      role,
      email,
    },
    201
  );
};
