import { getAuthSession } from '../_lib/auth';
import { fail, json } from '../_lib/response';
import type { Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await getAuthSession(request, env);
  if (!auth) {
    return fail(401, 'unauthorized', 'Autenticazione richiesta.');
  }

  return json({ user: auth.user });
};
