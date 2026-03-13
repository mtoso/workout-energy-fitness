import { requireAdmin } from '../../_lib/guards';
import { listCoaches } from '../../_lib/admin-users';
import { json } from '../../_lib/response';
import type { Env } from '../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const coaches = await listCoaches(env);
  return json({ coaches });
};
