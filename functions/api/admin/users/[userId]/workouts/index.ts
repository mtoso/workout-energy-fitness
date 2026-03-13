import { requireAdmin } from '../../../../_lib/guards';
import { readJson } from '../../../../_lib/http';
import {
  createWorkoutPlanForUser,
  listWorkoutPlansForUser,
} from '../../../../_lib/admin-workouts';
import { fail, json } from '../../../../_lib/response';
import type { Env } from '../../../../_lib/types';

interface CreateWorkoutPayload {
  copyFromPlanId?: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  const workouts = await listWorkoutPlansForUser(env, userId);
  return json({ workouts });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  const bodyOrResponse = await readJson<CreateWorkoutPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const created = await createWorkoutPlanForUser(
    env,
    userId,
    auth.user.id,
    typeof bodyOrResponse.copyFromPlanId === 'string'
      ? bodyOrResponse.copyFromPlanId.trim() || null
      : null
  );

  if (created instanceof Response) return created;

  return json({ plan: created }, 201);
};
