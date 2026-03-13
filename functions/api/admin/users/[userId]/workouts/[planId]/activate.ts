import { activateWorkoutPlanForUser, fail, json, requireManagedUserAccess, requireManager } from '../_lib';
import type { Env } from '../_lib';

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  const planId = params.planId;
  if (!userId || !planId) return fail(400, 'invalid_payload', 'User id and plan id are required.');

  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;

  const plan = await activateWorkoutPlanForUser(env, userId, planId);
  if (plan instanceof Response) return plan;

  return json({ plan });
};
