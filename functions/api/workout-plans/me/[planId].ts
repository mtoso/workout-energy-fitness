import { requireAuth } from '../../_lib/guards';
import { fail, json } from '../../_lib/response';
import { getPublishedWorkoutPlanForUser } from '../../_lib/workout-plan';
import type { Env } from '../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const planId = params.planId;
  if (!planId) return fail(400, 'invalid_payload', 'Scheda obbligatoria.');

  const plan = await getPublishedWorkoutPlanForUser(env, auth.user.id, planId);
  if (!plan) return fail(404, 'plan_not_found', 'Scheda pubblicata non trovata.');

  return json({ plan });
};
