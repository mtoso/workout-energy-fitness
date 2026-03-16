import { requireAuth } from '../../../_lib/guards';
import { json } from '../../../_lib/response';
import { markWorkoutPublicationsSeen } from '../../../_lib/workout-plan';
import type { Env } from '../../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const result = await markWorkoutPublicationsSeen(env, auth.user.id);
  return json(result);
};
