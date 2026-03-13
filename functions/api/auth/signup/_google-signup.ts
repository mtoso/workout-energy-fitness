import { issueSession } from '../../_lib/auth';
import { readJson } from '../../_lib/http';
import { verifyGoogleToken } from '../../_lib/id-token';
import { fail, json } from '../../_lib/response';
import { activateInvitedUser, findInvitedUserByToken, getAuthUserById } from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface GoogleSignupPayload {
  inviteToken: string;
  idToken: string;
}

export const signupWithGoogle = async (request: Request, env: Env) => {
  const bodyOrResponse = await readJson<GoogleSignupPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const inviteToken = (bodyOrResponse.inviteToken || '').trim();
  if (!inviteToken) {
    return fail(400, 'invalid_invite', 'Invite token is required.');
  }

  const invitedUser = await findInvitedUserByToken(env, inviteToken);
  if (!invitedUser) {
    return fail(400, 'invalid_invite', 'Invite is invalid, expired, or already used.');
  }

  const identityOrResponse = await verifyGoogleToken(bodyOrResponse.idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const googleIdentity = identityOrResponse;
  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(400, 'invalid_token', 'Google token must include a verified email for invite signup.');
  }

  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      400,
      'google_email_not_authoritative',
      'Google signup is only supported for Gmail or managed Google Workspace addresses. Use email signup for this address.'
    );
  }

  const activated = await activateInvitedUser(env, invitedUser, googleIdentity.email, {
    provider: 'google',
    providerSubject: googleIdentity.googleSubject,
    emailVerified: googleIdentity.emailVerified,
  });

  if (activated instanceof Response) return activated;

  const user = await getAuthUserById(env, activated.userId);
  if (!user) {
    return fail(500, 'user_not_found', 'Unable to load account.');
  }

  const { cookieHeader } = await issueSession(request, env, activated.userId);
  return json({ user }, 201, { 'set-cookie': cookieHeader });
};
