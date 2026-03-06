import { createRemoteJWKSet, jwtVerify } from 'jose';
import { fail } from './response';
import type { AuthProvider, Env } from './types';

interface VerifiedIdentity {
  provider: Exclude<AuthProvider, 'email'>;
  providerSubject: string;
  email: string | null;
  emailVerified: boolean;
}

const googleJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

const ensureString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

export const verifyProviderToken = async (
  provider: Exclude<AuthProvider, 'email'>,
  idToken: string,
  env: Env
): Promise<VerifiedIdentity | Response> => {
  if (!idToken || typeof idToken !== 'string') {
    return fail(400, 'invalid_token', 'Missing identity token.');
  }

  try {
    if (provider === 'google') {
      if (!env.GOOGLE_CLIENT_ID) {
        return fail(500, 'auth_misconfigured', 'GOOGLE_CLIENT_ID is not configured.');
      }

      const { payload } = await jwtVerify(idToken, googleJwks, {
        audience: env.GOOGLE_CLIENT_ID,
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
      });

      const providerSubject = ensureString(payload.sub);
      const email = ensureString(payload.email);
      const emailVerified = payload.email_verified === true;

      if (!providerSubject || !email || !emailVerified) {
        return fail(401, 'invalid_token', 'Google token is missing verified identity data.');
      }

      return {
        provider,
        providerSubject,
        email: email.toLowerCase(),
        emailVerified,
      };
    }

    if (!env.APPLE_CLIENT_ID) {
      return fail(500, 'auth_misconfigured', 'APPLE_CLIENT_ID is not configured.');
    }

    const { payload } = await jwtVerify(idToken, appleJwks, {
      audience: env.APPLE_CLIENT_ID,
      issuer: 'https://appleid.apple.com',
    });

    const providerSubject = ensureString(payload.sub);
    const email = ensureString(payload.email);
    const emailVerified =
      payload.email_verified === true || payload.email_verified === 'true';

    if (!providerSubject) {
      return fail(401, 'invalid_token', 'Apple token is missing subject claim.');
    }

    return {
      provider,
      providerSubject,
      email: email ? email.toLowerCase() : null,
      emailVerified,
    };
  } catch {
    return fail(401, 'invalid_token', 'Identity token validation failed.');
  }
};
