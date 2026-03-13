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
    return fail(400, 'invalid_invite', "Il token d'invito è obbligatorio.");
  }

  const invitedUser = await findInvitedUserByToken(env, inviteToken);
  if (!invitedUser) {
    return fail(400, 'invalid_invite', "L'invito non è valido, è scaduto oppure è già stato utilizzato.");
  }

  const identityOrResponse = await verifyGoogleToken(bodyOrResponse.idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const googleIdentity = identityOrResponse;
  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(400, 'invalid_token', "Il token Google deve includere un'email verificata per completare l'invito.");
  }

  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      400,
      'google_email_not_authoritative',
      'La registrazione con Google è supportata solo per indirizzi Gmail o Google Workspace gestiti. Per questo indirizzo usa la registrazione con email.'
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
    return fail(500, 'user_not_found', "Impossibile caricare l'account.");
  }

  const { cookieHeader } = await issueSession(request, env, activated.userId);
  return json({ user }, 201, { 'set-cookie': cookieHeader });
};
