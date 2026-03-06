import { clearSessionCookie, revokeSession } from '../_lib/auth';
import { json } from '../_lib/response';
import type { Env } from '../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  await revokeSession(request, env);

  return json(
    { ok: true },
    200,
    {
      'set-cookie': clearSessionCookie(request, env),
    }
  );
};
