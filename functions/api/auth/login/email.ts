import { issueSession } from '../../_lib/auth';
import { verifyPassword } from '../../_lib/crypto';
import { normalizeEmail, readJson } from '../../_lib/http';
import { fail, json } from '../../_lib/response';
import { getAuthUserById, touchIdentityLogin } from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface LoginEmailPayload {
  email: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const bodyOrResponse = await readJson<LoginEmailPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const email = normalizeEmail(bodyOrResponse.email || '');
  const password = bodyOrResponse.password || '';

  if (!email || !password) {
    return fail(400, 'invalid_credentials', 'Email and password are required.');
  }

  const account = await env.DB.prepare(
    `
      SELECT
        u.id,
        u.email,
        u.status,
        c.password_hash
      FROM users u
      JOIN email_credentials c ON c.user_id = u.id
      WHERE u.email = ?
      LIMIT 1
    `
  )
    .bind(email)
    .first<{
      id: string;
      email: string;
      status: 'invited' | 'active' | 'disabled';
      password_hash: string;
    }>();

  if (!account || !verifyPassword(password, account.password_hash)) {
    return fail(401, 'invalid_credentials', 'Invalid email or password.');
  }

  if (account.status === 'invited') {
    return fail(403, 'account_not_activated', 'Complete invite activation before logging in.');
  }

  if (account.status === 'disabled') {
    return fail(403, 'account_disabled', 'Account is disabled.');
  }

  await touchIdentityLogin(env, 'email', account.email, account.id);

  const user = await getAuthUserById(env, account.id);
  if (!user) {
    return fail(500, 'user_not_found', 'Unable to load account.');
  }

  const { cookieHeader } = await issueSession(request, env, account.id);

  return json(
    { user },
    200,
    {
      'set-cookie': cookieHeader,
    }
  );
};
