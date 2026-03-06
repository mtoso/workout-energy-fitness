import { getAuthSession } from './auth';
import { fail } from './response';
import type { Env } from './types';

export const requireAuth = async (request: Request, env: Env) => {
  const session = await getAuthSession(request, env);
  if (!session) return fail(401, 'unauthorized', 'Authentication required.');
  return session;
};

export const requireAdmin = async (request: Request, env: Env) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  if (auth.user.role !== 'admin') {
    return fail(403, 'forbidden', 'Admin role required.');
  }

  return auth;
};
