import { fail, json, regenerateInviteForUser, requireAdmin } from '../_lib';
import type { Env } from '../_lib';

const buildInviteUrl = (request: Request, env: Env, inviteToken: string) => {
  const base = env.APP_BASE_URL?.trim() || new URL(request.url).origin;
  return `${base.replace(/\/$/, '')}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', "L'identificativo utente è obbligatorio.");
  }

  const regenerated = await regenerateInviteForUser(env, userId);
  if (regenerated instanceof Response) return regenerated;

  return json(
    {
      userId: regenerated.userId,
      inviteUrl: buildInviteUrl(request, env, regenerated.inviteToken),
      expiresAt: null,
    },
    200
  );
};
