import { randomToken, sha256Hex } from './crypto';
import type { AuthSession, Env } from './types';

const DEFAULT_SESSION_COOKIE_NAME = 'wef_session';
const DEFAULT_SESSION_TTL_HOURS = 24 * 30;

const normalizeCookieString = (cookieString: string | null) => cookieString ?? '';

const parseCookieValue = (request: Request, name: string) => {
  const cookieHeader = normalizeCookieString(request.headers.get('cookie'));

  for (const cookiePair of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = cookiePair.trim().split('=');
    if (rawName !== name || rawValueParts.length === 0) continue;
    return decodeURIComponent(rawValueParts.join('='));
  }

  return null;
};

export const getSessionCookieName = (env: Env) =>
  env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME;

const getSessionMaxAgeSeconds = (env: Env) => {
  const parsed = Number(env.SESSION_TTL_HOURS);
  const hours = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_HOURS;
  return Math.round(hours * 60 * 60);
};

export const buildSessionCookie = (
  request: Request,
  env: Env,
  sessionToken: string,
  maxAgeSeconds: number
) => {
  const requestUrl = new URL(request.url);
  const cookieName = getSessionCookieName(env);
  const secure = requestUrl.protocol === 'https:';

  const parts = [
    `${cookieName}=${encodeURIComponent(sessionToken)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (secure) parts.push('Secure');

  return parts.join('; ');
};

export const clearSessionCookie = (request: Request, env: Env) => {
  const requestUrl = new URL(request.url);
  const cookieName = getSessionCookieName(env);
  const secure = requestUrl.protocol === 'https:';

  const parts = [
    `${cookieName}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (secure) parts.push('Secure');

  return parts.join('; ');
};

export const getAuthSession = async (
  request: Request,
  env: Env
): Promise<AuthSession | null> => {
  const cookieName = getSessionCookieName(env);
  const sessionToken = parseCookieValue(request, cookieName);
  if (!sessionToken) return null;

  const tokenHash = await sha256Hex(sessionToken);

  const row = await env.DB.prepare(
    `
      SELECT
        s.id as session_id,
        u.id as user_id,
        u.email as email,
        u.role as role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND datetime(s.expires_at) > CURRENT_TIMESTAMP
        AND u.is_active = 1
      LIMIT 1
    `
  )
    .bind(tokenHash)
    .first<{
      session_id: string;
      user_id: string;
      email: string;
      role: 'admin' | 'customer';
    }>();

  if (!row) return null;

  return {
    sessionId: row.session_id,
    tokenHash,
    user: {
      id: row.user_id,
      email: row.email,
      role: row.role,
    },
  };
};

export const issueSession = async (
  request: Request,
  env: Env,
  userId: string
): Promise<{ cookieHeader: string }> => {
  const sessionToken = randomToken(32);
  const tokenHash = await sha256Hex(sessionToken);
  const maxAgeSeconds = getSessionMaxAgeSeconds(env);

  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();
  const sessionId = crypto.randomUUID();

  await env.DB.prepare(
    `
      INSERT INTO sessions (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `
  )
    .bind(sessionId, userId, tokenHash, expiresAt)
    .run();

  return {
    cookieHeader: buildSessionCookie(request, env, sessionToken, maxAgeSeconds),
  };
};

export const revokeSession = async (request: Request, env: Env) => {
  const session = await getAuthSession(request, env);
  if (!session) return;

  await env.DB.prepare(
    `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(session.sessionId)
    .run();
};
