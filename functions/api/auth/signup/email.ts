import { issueSession } from '../../_lib/auth';
import { normalizeEmail, readJson } from '../../_lib/http';
import { fail, json } from '../../_lib/response';
import { createUserFromInvite, findInviteByToken } from '../../_lib/users';
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

  if (password.length < 8) {
    return fail(400, 'invalid_password', 'Password must be at least 8 characters.');
  }

  const invite = await findInviteByToken(env, inviteToken);
  if (!invite) {
    return fail(400, 'invalid_invite', 'Invite is invalid, expired, or already used.');
  }

  if (normalizeEmail(invite.email) !== email) {
    return fail(400, 'email_mismatch', 'Invite email does not match signup email.');
  }

  const createResult = await createUserFromInvite(
    env,
    invite,
    email,
    {
      provider: 'email',
      providerSubject: email,
      emailVerified: true,
    },
    password
  );

  if (createResult instanceof Response) return createResult;

  const { cookieHeader } = await issueSession(request, env, createResult.userId);

  return json(
    {
      user: {
        id: createResult.userId,
        email,
        role: invite.role,
      },
    },
    201,
    {
      'set-cookie': cookieHeader,
    }
  );
};
