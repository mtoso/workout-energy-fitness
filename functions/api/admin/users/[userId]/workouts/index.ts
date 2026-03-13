import {
  createWorkoutPlanForUser,
  fail,
  json,
  listWorkoutPlansForUser,
  readJson,
  requireManagedUserAccess,
  requireManager,
} from './_lib';
import type { Env } from './_lib';

interface CreateWorkoutPayload {
  copyFromPlanId?: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) return fail(400, 'invalid_user', 'User id is required.');

  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;

  const workouts = await listWorkoutPlansForUser(env, userId);
  return json({ workouts });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) return fail(400, 'invalid_user', 'User id is required.');

  const access = await requireManagedUserAccess(auth, env, userId);
  if (access instanceof Response) return access;

  const bodyOrResponse = await readJson<CreateWorkoutPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const created = await createWorkoutPlanForUser(
    env,
    userId,
    auth.user.id,
    typeof bodyOrResponse.copyFromPlanId === 'string' ? bodyOrResponse.copyFromPlanId.trim() || null : null
  );

  if (created instanceof Response) return created;
  return json({ plan: created }, 201);
};
