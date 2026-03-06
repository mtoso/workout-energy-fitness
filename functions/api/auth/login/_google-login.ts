import { issueSession } from '../../_lib/auth';
import { readJson } from '../../_lib/http';
import { verifyGoogleToken } from '../../_lib/id-token';
import { fail, json } from '../../_lib/response';
import {
  attachIdentityToUser,
  findUserByEmail,
  getUserByIdentity,
  touchIdentityLogin,
} from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface GoogleLoginPayload {
  idToken: string;
}

export const loginWithGoogle = async (request: Request, env: Env) => {
  const bodyOrResponse = await readJson<GoogleLoginPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const idToken = bodyOrResponse.idToken;
  const identityOrResponse = await verifyGoogleToken(idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const googleIdentity = identityOrResponse;

  const existingIdentityUser = await getUserByIdentity(
    env,
    'google',
    googleIdentity.googleSubject
  );

  if (existingIdentityUser) {
    if (!existingIdentityUser.is_active) {
      return fail(403, 'account_disabled', 'Account is disabled.');
    }

    await touchIdentityLogin(env, 'google', googleIdentity.googleSubject);
    const { cookieHeader } = await issueSession(request, env, existingIdentityUser.id);

    return json(
      {
        user: {
          id: existingIdentityUser.id,
          email: existingIdentityUser.email,
          role: existingIdentityUser.role,
        },
      },
      200,
      {
        'set-cookie': cookieHeader,
      }
    );
  }

  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(
      403,
      'account_not_provisioned',
      'Account is not provisioned. Ask an admin for an invite.'
    );
  }

  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      403,
      'google_email_not_authoritative',
      'Google can only auto-link Gmail or managed Google Workspace addresses. Use email login for this address.'
    );
  }

  const user = await findUserByEmail(env, googleIdentity.email);
  if (!user) {
    return fail(
      403,
      'account_not_provisioned',
      'Account is not provisioned. Ask an admin for an invite.'
    );
  }

  if (!user.is_active) {
    return fail(403, 'account_disabled', 'Account is disabled.');
  }

  const linked = await attachIdentityToUser(
    env,
    user.id,
    'google',
    googleIdentity.googleSubject,
    googleIdentity.emailVerified
  );

  if (!linked) {
    const reloadedIdentityUser = await getUserByIdentity(
      env,
      'google',
      googleIdentity.googleSubject
    );

    if (!reloadedIdentityUser) {
      return fail(409, 'identity_conflict', 'Identity is already linked to another account.');
    }

    if (reloadedIdentityUser.id !== user.id) {
      return fail(409, 'identity_conflict', 'Identity is already linked to another account.');
    }
  }

  await touchIdentityLogin(env, 'google', googleIdentity.googleSubject);
  const { cookieHeader } = await issueSession(request, env, user.id);

  return json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
    200,
    {
      'set-cookie': cookieHeader,
    }
  );
};
