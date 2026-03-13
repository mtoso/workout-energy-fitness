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
    return fail(403, 'account_not_activated', "Completa l'attivazione dell'invito prima di accedere.");
  }

  if (status === 'disabled') {
    return fail(403, 'account_disabled', "L'account è disabilitato.");
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
      return fail(500, 'user_not_found', "Impossibile caricare l'account.");
    }

    const { cookieHeader } = await issueSession(request, env, existingIdentityUser.id);
    return json({ user }, 200, { 'set-cookie': cookieHeader });
  }

  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(403, 'account_not_provisioned', 'Account non abilitato. Chiedi a un amministratore di inviarti un invito.');
  }

  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      403,
      'google_email_not_authoritative',
      'Google può collegare automaticamente solo indirizzi Gmail o Google Workspace gestiti. Per questo indirizzo usa l’accesso con email.'
    );
  }

  const user = await findUserByEmail(env, googleIdentity.email);
  if (!user) {
    return fail(403, 'account_not_provisioned', 'Account non abilitato. Chiedi a un amministratore di inviarti un invito.');
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
      return fail(409, 'identity_conflict', 'Questa identità è già collegata a un altro account.');
    }
  }

  await touchIdentityLogin(env, 'google', googleIdentity.googleSubject, user.id);
  const authUser = await getAuthUserById(env, user.id);
  if (!authUser) {
    return fail(500, 'user_not_found', "Impossibile caricare l'account.");
  }

  const { cookieHeader } = await issueSession(request, env, user.id);
  return json({ user: authUser }, 200, { 'set-cookie': cookieHeader });
};
