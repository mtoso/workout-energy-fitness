import { createRemoteJWKSet, jwtVerify } from 'jose';
import { fail } from './response';
import type { Env } from './types';

export interface VerifiedGoogleIdentity {
  googleSubject: string;
  email: string;
  emailVerified: boolean;
  hostedDomain: string | null;
  isAuthoritativeEmail: boolean;
}

const googleJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

const ensureString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const isAuthoritativeGoogleEmail = (email: string, hostedDomain: string | null) =>
  email.endsWith('@gmail.com') || hostedDomain !== null;

export const verifyGoogleToken = async (
  idToken: string,
  env: Env
): Promise<VerifiedGoogleIdentity | Response> => {
  if (!idToken || typeof idToken !== 'string') {
    return fail(400, 'invalid_token', "Token d'identità mancante.");
  }

  try {
    if (!env.GOOGLE_CLIENT_ID) {
      return fail(500, 'auth_misconfigured', 'GOOGLE_CLIENT_ID non configurato.');
    }

    const { payload } = await jwtVerify(idToken, googleJwks, {
      audience: env.GOOGLE_CLIENT_ID,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });

    const googleSubject = ensureString(payload.sub);
    const email = ensureString(payload.email);
    const emailVerified = payload.email_verified === true;
    const hostedDomain = ensureString(payload.hd);

    if (!googleSubject || !email || !emailVerified) {
      return fail(401, 'invalid_token', 'Il token Google non contiene dati verificati sufficienti.');
    }

    return {
      googleSubject,
      email: email.toLowerCase(),
      emailVerified,
      hostedDomain,
      isAuthoritativeEmail: isAuthoritativeGoogleEmail(email.toLowerCase(), hostedDomain),
    };
  } catch {
    return fail(401, 'invalid_token', 'Validazione del token d’identità non riuscita.');
  }
};
