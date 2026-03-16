import { getAuthSession } from './auth';
import { fail } from './response';
import type { AuthSession, Env, UserRow } from './types';

export const requireAuth = async (request: Request, env: Env) => {
  const session = await getAuthSession(request, env);
  if (!session) return fail(401, 'unauthorized', 'Autenticazione richiesta.');
  return session;
};

export const requireManager = async (request: Request, env: Env) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  if (!auth.user.canManageClients) {
    return fail(403, 'forbidden', 'Accesso riservato ai gestori.');
  }

  return auth;
};

export const requireAdmin = async (request: Request, env: Env) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  if (!auth.user.isAdmin) {
    return fail(403, 'forbidden', 'Accesso riservato agli amministratori.');
  }

  return auth;
};

export const loadManagedUser = async (env: Env, userId: string) =>
  env.DB.prepare(
    `
      SELECT
        id,
        email,
        full_name,
        user_type,
        is_admin,
        status,
        coach_user_id,
        invited_by_user_id,
        invite_token_hash,
        invite_expires_at,
        invited_at,
        activated_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<UserRow>();

export const requireManagedUserAccess = async (
  auth: AuthSession,
  env: Env,
  userId: string
): Promise<UserRow | Response> => {
  const targetUser = await loadManagedUser(env, userId);
  if (!targetUser) {
    return fail(404, 'user_not_found', 'Utente non trovato.');
  }

  if (auth.user.id === targetUser.id && !auth.user.canUsePersonalApp) {
    return fail(403, 'forbidden', 'Questo account non usa l’app personale.');
  }

  if (auth.user.isAdmin) {
    return targetUser;
  }

  if (auth.user.id === targetUser.id) {
    return targetUser;
  }

  if (
    auth.user.userType === 'coach' &&
    targetUser.user_type === 'client' &&
    targetUser.coach_user_id === auth.user.id
  ) {
    return targetUser;
  }

  return fail(403, 'forbidden', 'Non puoi gestire questo utente.');
};
