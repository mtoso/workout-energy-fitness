import {
  createInvitedUser,
  json,
  listVisibleUsers,
  readJson,
  requireAdmin,
  requireManager,
} from '../_lib';
import { getManagedUserDetail } from '../../_lib/admin-users';
import type { Env, UserType } from '../_lib';

interface CreateUserPayload {
  email: string;
  fullName?: string;
  userType?: UserType;
  coachUserId?: string | null;
}

const buildInviteUrl = (request: Request, env: Env, inviteToken: string) => {
  const base = env.APP_BASE_URL?.trim() || new URL(request.url).origin;
  return `${base.replace(/\/$/, '')}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;

  const users = await listVisibleUsers(env, auth);
  return json({ users });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const bodyOrResponse = await readJson<CreateUserPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const userType = bodyOrResponse.userType === 'coach' ? 'coach' : 'client';
  const createResult = await createInvitedUser(env, {
    email: bodyOrResponse.email,
    fullName: bodyOrResponse.fullName,
    userType,
    coachUserId: userType === 'client' ? bodyOrResponse.coachUserId ?? null : null,
    invitedByUserId: auth.user.id,
  });

  if (createResult instanceof Response) return createResult;

  const detail = await getManagedUserDetail(env, auth, createResult.userId);
  if (detail instanceof Response) return detail;

  return json(
    {
      user: detail.user,
      inviteUrl: buildInviteUrl(request, env, createResult.inviteToken),
      expiresAt: detail.user.inviteExpiresAt,
    },
    201
  );
};
