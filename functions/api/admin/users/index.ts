import { requireAdmin } from '../../_lib/guards';
import { json } from '../../_lib/response';
import type { Env } from '../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const users = await env.DB.prepare(
    `
      SELECT id, email, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `
  ).all<{
    id: string;
    email: string;
    role: 'admin' | 'customer';
    is_active: number;
    created_at: string;
  }>();

  return json({ users: users.results });
};
