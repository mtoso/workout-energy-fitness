import { issueSession } from '../../_lib/auth';
import { normalizeEmail, readJson } from '../../_lib/http';
import { verifyProviderToken } from '../../_lib/id-token';
import { fail, json } from '../../_lib/response';
import { createUserFromInvite, findInviteByToken } from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface ProviderSignupPayload {
  inviteToken: string;
  idToken: string;
}

export const signupWithProvider = async (
  request: Request,
  env: Env,
  provider: 'google' | 'apple'
) => {
  const bodyOrResponse = await readJson<ProviderSignupPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const inviteToken = (bodyOrResponse.inviteToken || '').trim();
  if (!inviteToken) {
    return fail(400, 'invalid_invite', 'Invite token is required.');
  }

  const invite = await findInviteByToken(env, inviteToken);
  if (!invite) {
    return fail(400, 'invalid_invite', 'Invite is invalid, expired, or already used.');
  }

  const identityOrResponse = await verifyProviderToken(
    provider,
    bodyOrResponse.idToken,
    env
  );
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const identity = identityOrResponse;

  if (!identity.email || !identity.emailVerified) {
    return fail(
      400,
      'invalid_token',
      `${provider} token must include a verified email for invite signup.`
    );
  }

  const inviteEmail = normalizeEmail(invite.email);
  const tokenEmail = normalizeEmail(identity.email);

  if (inviteEmail !== tokenEmail) {
    return fail(400, 'email_mismatch', 'Invite email does not match provider email.');
  }

  const createResult = await createUserFromInvite(env, invite, tokenEmail, {
    provider,
    providerSubject: identity.providerSubject,
    emailVerified: identity.emailVerified,
  });

  if (createResult instanceof Response) return createResult;

  const { cookieHeader } = await issueSession(request, env, createResult.userId);

  return json(
    {
      user: {
        id: createResult.userId,
        email: tokenEmail,
        role: invite.role,
      },
    },
    201,
    {
      'set-cookie': cookieHeader,
    }
  );
};
