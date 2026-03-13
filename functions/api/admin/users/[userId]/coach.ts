import { requireAdmin } from '../../../_lib/guards';
import { readJson } from '../../../_lib/http';
import { assignCoachToCustomer, getAdminUserDetail } from '../../../_lib/admin-users';
import { fail, json } from '../../../_lib/response';
import type { Env } from '../../../_lib/types';

interface AssignCoachPayload {
  coachUserId?: string | null;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  const bodyOrResponse = await readJson<AssignCoachPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const result = await assignCoachToCustomer(
    env,
    userId,
    typeof bodyOrResponse.coachUserId === 'string'
      ? bodyOrResponse.coachUserId.trim() || null
      : null,
    auth.user.id
  );

  if (result instanceof Response) return result;

  const detail = await getAdminUserDetail(env, userId);
  return json(detail);
};
