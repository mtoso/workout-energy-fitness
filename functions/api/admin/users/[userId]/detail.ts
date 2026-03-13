import { fail, getManagedUserDetail, requireManager } from './_lib';
import type { Env } from './_lib';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  return getManagedUserDetail(env, auth, userId);
};
