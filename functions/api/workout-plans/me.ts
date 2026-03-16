import { requireAuth } from '../_lib/guards';
import { json } from '../_lib/response';
import { getPublishedWorkoutPlansOverviewForUser } from '../_lib/workout-plan';
import type { Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const overview = await getPublishedWorkoutPlansOverviewForUser(env, auth.user.id);
  return json(overview);
};
