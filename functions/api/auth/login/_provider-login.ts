import { issueSession } from '../../_lib/auth';
import { readJson } from '../../_lib/http';
import { verifyProviderToken } from '../../_lib/id-token';
import { fail, json } from '../../_lib/response';
import {
  attachIdentityToUser,
  findUserByEmail,
  getUserByIdentity,
  touchIdentityLogin,
} from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface ProviderLoginPayload {
  idToken: string;
}

export const loginWithProvider = async (
  request: Request,
  env: Env,
  provider: 'google' | 'apple'
) => {
  const bodyOrResponse = await readJson<ProviderLoginPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const idToken = bodyOrResponse.idToken;
  const identityOrResponse = await verifyProviderToken(provider, idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const identity = identityOrResponse;

  const existingIdentityUser = await getUserByIdentity(
    env,
    provider,
    identity.providerSubject
  );

  if (existingIdentityUser) {
    if (!existingIdentityUser.is_active) {
      return fail(403, 'account_disabled', 'Account is disabled.');
    }

    await touchIdentityLogin(env, provider, identity.providerSubject);
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

  if (!identity.email || !identity.emailVerified) {
    return fail(
      403,
      'account_not_provisioned',
      'Account is not provisioned. Ask an admin for an invite.'
    );
  }

  const user = await findUserByEmail(env, identity.email);
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
    provider,
    identity.providerSubject,
    identity.emailVerified
  );

  if (!linked) {
    const reloadedIdentityUser = await getUserByIdentity(
      env,
      provider,
      identity.providerSubject
    );

    if (!reloadedIdentityUser) {
      return fail(409, 'identity_conflict', 'Identity is already linked to another account.');
    }

    if (reloadedIdentityUser.id !== user.id) {
      return fail(409, 'identity_conflict', 'Identity is already linked to another account.');
    }
  }

  await touchIdentityLogin(env, provider, identity.providerSubject);
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
