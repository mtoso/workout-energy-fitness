import {
  fail,
  getWorkoutPlanForUser,
  json,
  readJson,
  requireAdmin,
  upsertWorkoutPlanForUser,
  validateWorkoutPlanInput,
} from './_lib';
import type { Env } from './_lib';

const getTargetUser = async (env: Env, userId: string) =>
  env.DB.prepare(
    `
      SELECT id, email, role, is_active
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<{
      id: string;
      email: string;
      role: 'admin' | 'customer';
      is_active: number;
    }>();

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  const targetUser = await getTargetUser(env, userId);
  if (!targetUser) {
    return fail(404, 'user_not_found', 'User not found.');
  }

  const plan = await getWorkoutPlanForUser(env, userId);

  return json({
    user: {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      isActive: Boolean(targetUser.is_active),
    },
    plan,
  });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  const targetUser = await getTargetUser(env, userId);
  if (!targetUser) {
    return fail(404, 'user_not_found', 'User not found.');
  }

  const bodyOrResponse = await readJson<unknown>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const payloadOrResponse = validateWorkoutPlanInput(bodyOrResponse);
  if (payloadOrResponse instanceof Response) return payloadOrResponse;

  const savedPlan = await upsertWorkoutPlanForUser(
    env,
    userId,
    auth.user.id,
    payloadOrResponse
  );

  return json({
    user: {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      isActive: Boolean(targetUser.is_active),
    },
    plan: savedPlan,
  });
};
