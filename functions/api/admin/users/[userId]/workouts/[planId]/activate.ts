import { requireAdmin } from '../../../../../../_lib/guards';
import { activateWorkoutPlanForUser } from '../../../../../../_lib/admin-workouts';
import { fail, json } from '../../../../../../_lib/response';
import type { Env } from '../../../../../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  const planId = params.planId;
  if (!userId || !planId) {
    return fail(400, 'invalid_payload', 'User id and plan id are required.');
  }

  const plan = await activateWorkoutPlanForUser(env, userId, planId);
  if (plan instanceof Response) return plan;

  return json({ plan });
};
