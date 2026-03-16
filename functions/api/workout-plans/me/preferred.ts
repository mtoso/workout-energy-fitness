import { requireAuth } from '../../_lib/guards';
import { readJson } from '../../_lib/http';
import { fail, json } from '../../_lib/response';
import { getPublishedWorkoutPlansOverviewForUser, setPreferredWorkoutPlanForUser } from '../../_lib/workout-plan';
import type { Env } from '../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const bodyOrResponse = await readJson<{ planId?: unknown }>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const planId =
    typeof bodyOrResponse.planId === 'string' && bodyOrResponse.planId.trim()
      ? bodyOrResponse.planId.trim()
      : null;
  if (!planId) return fail(400, 'invalid_payload', 'Scheda preferita obbligatoria.');

  const result = await setPreferredWorkoutPlanForUser(env, auth.user.id, planId);
  if (result instanceof Response) return result;

  const overview = await getPublishedWorkoutPlansOverviewForUser(env, auth.user.id);
  return json(overview);
};
