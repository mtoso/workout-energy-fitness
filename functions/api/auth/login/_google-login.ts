import { issueSession } from '../../_lib/auth';
import { readJson } from '../../_lib/http';
import { verifyGoogleToken } from '../../_lib/id-token';
import { fail, json } from '../../_lib/response';
import {
  attachIdentityToUser,
  findUserByEmail,
  getAuthUserById,
  getUserByIdentity,
  touchIdentityLogin,
} from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface GoogleLoginPayload {
  idToken: string;
}

const accountStatusError = (status: 'invited' | 'active' | 'disabled') => {
  if (status === 'invited') {
    return fail(403, 'account_not_activated', 'Complete invite activation before logging in.');
  }

  if (status === 'disabled') {
    return fail(403, 'account_disabled', 'Account is disabled.');
  }

  return null;
};

export const loginWithGoogle = async (request: Request, env: Env) => {
  const bodyOrResponse = await readJson<GoogleLoginPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const identityOrResponse = await verifyGoogleToken(bodyOrResponse.idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const googleIdentity = identityOrResponse;

  const existingIdentityUser = await getUserByIdentity(env, 'google', googleIdentity.googleSubject);
  if (existingIdentityUser) {
    const statusError = accountStatusError(existingIdentityUser.status);
    if (statusError) return statusError;

    await touchIdentityLogin(env, 'google', googleIdentity.googleSubject, existingIdentityUser.id);
    const user = await getAuthUserById(env, existingIdentityUser.id);
    if (!user) {
      return fail(500, 'user_not_found', 'Unable to load account.');
    }

    const { cookieHeader } = await issueSession(request, env, existingIdentityUser.id);
    return json({ user }, 200, { 'set-cookie': cookieHeader });
  }

  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(403, 'account_not_provisioned', 'Account is not provisioned. Ask an admin for an invite.');
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
    return fail(403, 'account_not_provisioned', 'Account is not provisioned. Ask an admin for an invite.');
  }

  const statusError = accountStatusError(user.status);
  if (statusError) return statusError;

  const linked = await attachIdentityToUser(
    env,
    user.id,
    'google',
    googleIdentity.googleSubject,
    googleIdentity.emailVerified
  );

  if (!linked) {
    const reloadedIdentityUser = await getUserByIdentity(env, 'google', googleIdentity.googleSubject);
    if (!reloadedIdentityUser || reloadedIdentityUser.id !== user.id) {
      return fail(409, 'identity_conflict', 'Identity is already linked to another account.');
    }
  }

  await touchIdentityLogin(env, 'google', googleIdentity.googleSubject, user.id);
  const authUser = await getAuthUserById(env, user.id);
  if (!authUser) {
    return fail(500, 'user_not_found', 'Unable to load account.');
  }

  const { cookieHeader } = await issueSession(request, env, user.id);
  return json({ user: authUser }, 200, { 'set-cookie': cookieHeader });
};
