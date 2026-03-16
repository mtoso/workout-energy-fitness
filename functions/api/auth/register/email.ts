import { issueSession } from '../../_lib/auth';
import { normalizeEmail, readJson } from '../../_lib/http';
import { fail, json } from '../../_lib/response';
import { createSelfRegisteredEmailUser, getAuthUserById } from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface RegisterEmailPayload {
  fullName: string;
  email: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const bodyOrResponse = await readJson<RegisterEmailPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const fullName = bodyOrResponse.fullName?.trim() ?? '';
  const email = normalizeEmail(bodyOrResponse.email || '');
  const password = bodyOrResponse.password || '';

  if (!fullName || !email || !password) {
    return fail(400, 'invalid_payload', 'Nome completo, email e password sono obbligatori.');
  }

  const created = await createSelfRegisteredEmailUser(env, {
    fullName,
    email,
    password,
  });
  if (created instanceof Response) return created;

  const user = await getAuthUserById(env, created.userId);
  if (!user) {
    return fail(500, 'user_not_found', "Impossibile caricare l'account.");
  }

  const { cookieHeader } = await issueSession(request, env, created.userId);
  return json({ user }, 201, { 'set-cookie': cookieHeader });
};
