import { issueSession } from '../../_lib/auth';
import { normalizeEmail, readJson } from '../../_lib/http';
import { verifyGoogleToken } from '../../_lib/id-token';
import { fail, json } from '../../_lib/response';
import { createUserFromInvite, findInviteByToken } from '../../_lib/users';
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

  const invite = await findInviteByToken(env, inviteToken);
  if (!invite) {
    return fail(400, 'invalid_invite', 'Invite is invalid, expired, or already used.');
  }

  const identityOrResponse = await verifyGoogleToken(bodyOrResponse.idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const googleIdentity = identityOrResponse;

  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(
      400,
      'invalid_token',
      'google token must include a verified email for invite signup.'
    );
  }

  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      400,
      'google_email_not_authoritative',
      'Google signup is only supported for Gmail or managed Google Workspace addresses. Use email signup for this address.'
    );
  }

  const inviteEmail = normalizeEmail(invite.email);
  const tokenEmail = normalizeEmail(googleIdentity.email);

  if (inviteEmail !== tokenEmail) {
    return fail(400, 'email_mismatch', 'Invite email does not match provider email.');
  }

  const createResult = await createUserFromInvite(env, invite, tokenEmail, {
    provider: 'google',
    providerSubject: googleIdentity.googleSubject,
    emailVerified: googleIdentity.emailVerified,
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
