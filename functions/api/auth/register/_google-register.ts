import { issueSession } from '../../_lib/auth';
import { normalizeEmail, readJson } from '../../_lib/http';
import { verifyGoogleToken } from '../../_lib/id-token';
import { fail, json } from '../../_lib/response';
import { createSelfRegisteredGoogleUser, getAuthUserById } from '../../_lib/users';
import type { Env } from '../../_lib/types';

interface RegisterGooglePayload {
  fullName: string;
  email: string;
  idToken: string;
}

export const registerWithGoogle = async (request: Request, env: Env) => {
  const bodyOrResponse = await readJson<RegisterGooglePayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const fullName = bodyOrResponse.fullName?.trim() ?? '';
  const email = normalizeEmail(bodyOrResponse.email || '');
  if (!fullName || !email) {
    return fail(400, 'invalid_payload', 'Nome completo ed email sono obbligatori.');
  }

  const identityOrResponse = await verifyGoogleToken(bodyOrResponse.idToken, env);
  if (identityOrResponse instanceof Response) return identityOrResponse;

  const googleIdentity = identityOrResponse;
  if (!googleIdentity.email || !googleIdentity.emailVerified) {
    return fail(400, 'invalid_token', "Il token Google deve includere un'email verificata.");
  }

  if (!googleIdentity.isAuthoritativeEmail) {
    return fail(
      400,
      'google_email_not_authoritative',
      'La registrazione con Google è supportata solo per indirizzi Gmail o Google Workspace gestiti. Per questo indirizzo usa la registrazione con email.'
    );
  }

  if (email !== normalizeEmail(googleIdentity.email)) {
    return fail(
      400,
      'email_mismatch',
      "L'email inserita deve coincidere con quella del tuo account Google."
    );
  }

  const created = await createSelfRegisteredGoogleUser(env, {
    fullName,
    email,
    googleSubject: googleIdentity.googleSubject,
    emailVerified: googleIdentity.emailVerified,
  });
  if (created instanceof Response) return created;

  const user = await getAuthUserById(env, created.userId);
  if (!user) {
    return fail(500, 'user_not_found', "Impossibile caricare l'account.");
  }

  const { cookieHeader } = await issueSession(request, env, created.userId);
  return json({ user }, 201, { 'set-cookie': cookieHeader });
};
