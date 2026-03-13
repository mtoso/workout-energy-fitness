import { requireAdmin } from '../../../_lib/guards';
import { getAdminUserDetail } from '../../../_lib/admin-users';
import { fail, json } from '../../../_lib/response';
import type { Env } from '../../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  const detail = await getAdminUserDetail(env, userId);
  if (!detail) {
    return fail(404, 'user_not_found', 'User not found.');
  }

  return json(detail);
};
