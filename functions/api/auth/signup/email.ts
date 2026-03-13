import { issueSession } from '../../_lib/auth';
import { normalizeEmail, readJson } from '../../_lib/http';
import { fail, json } from '../../_lib/response';
import { activateInvitedUser, findInvitedUserByToken, getAuthUserById } from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface EmailSignupPayload {
  inviteToken: string;
  email: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const bodyOrResponse = await readJson<EmailSignupPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const inviteToken = (bodyOrResponse.inviteToken || '').trim();
  const email = normalizeEmail(bodyOrResponse.email || '');
  const password = bodyOrResponse.password || '';

  if (!inviteToken || !email || !password) {
    return fail(400, 'invalid_payload', 'Invite token, email and password are required.');
  }

  const invitedUser = await findInvitedUserByToken(env, inviteToken);
  if (!invitedUser) {
    return fail(400, 'invalid_invite', 'Invite is invalid, expired, or already used.');
  }

  const activated = await activateInvitedUser(
    env,
    invitedUser,
    email,
    {
      provider: 'email',
      providerSubject: email,
      emailVerified: true,
    },
    password
  );

  if (activated instanceof Response) return activated;

  const user = await getAuthUserById(env, activated.userId);
  if (!user) {
    return fail(500, 'user_not_found', 'Unable to load account.');
  }

  const { cookieHeader } = await issueSession(request, env, activated.userId);

  return json({ user }, 201, { 'set-cookie': cookieHeader });
};
