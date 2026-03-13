import { requireAdmin } from '../../../../../_lib/guards';
import { readJson } from '../../../../../_lib/http';
import {
  getWorkoutPlanById,
  saveWorkoutPlanById,
  validateAdminWorkoutPlanInput,
} from '../../../../../_lib/admin-workouts';
import { fail, json } from '../../../../../_lib/response';
import type { Env } from '../../../../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  const planId = params.planId;
  if (!userId || !planId) {
    return fail(400, 'invalid_payload', 'User id and plan id are required.');
  }

  const plan = await getWorkoutPlanById(env, userId, planId);
  if (!plan) {
    return fail(404, 'plan_not_found', 'Workout plan not found.');
  }

  return json({ plan });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  const planId = params.planId;
  if (!userId || !planId) {
    return fail(400, 'invalid_payload', 'User id and plan id are required.');
  }

  const bodyOrResponse = await readJson<unknown>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const payloadOrResponse = validateAdminWorkoutPlanInput(bodyOrResponse);
  if (payloadOrResponse instanceof Response) return payloadOrResponse;

  const saved = await saveWorkoutPlanById(env, userId, planId, auth.user.id, payloadOrResponse);
  if (saved instanceof Response) return saved;

  return json({ plan: saved });
};
