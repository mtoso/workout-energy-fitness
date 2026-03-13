import { json, listCoaches, requireAdmin } from '../_lib';
import type { Env } from '../_lib';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const coaches = await listCoaches(env);
  return json({ coaches });
};
