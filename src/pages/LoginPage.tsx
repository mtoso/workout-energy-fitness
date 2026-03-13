import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { AuthUser } from '../types/auth';
import { loginEmail, loginGoogle } from '../lib/api/auth';
import { isApiError } from '../lib/api/client';
import { mountGoogleSignInButton } from '../lib/auth/oauth-sdk';
import { queryClient } from '../lib/query-client';

const cardClass = 'bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-4';

export const LoginPage = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleSetupError, setGoogleSetupError] = useState<string | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';
  const googleConfigError = !googleClientId
    ? 'Google login non configurato (VITE_GOOGLE_CLIENT_ID mancante).'
    : null;

  const handleSuccess = async (user: AuthUser) => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
    await navigate({ to: user.canManageClients ? '/admin' : '/' });
  };

  const emailMutation = useMutation({
    mutationFn: loginEmail,
    onSuccess: (data) => {
      void handleSuccess(data.user);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Login email fallito.');
    },
  });

  const googleMutation = useMutation({
    mutationFn: loginGoogle,
    onSuccess: (data) => {
      void handleSuccess(data.user);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Login Google fallito.');
    },
  });

  const handleGoogleCredential = useEffectEvent((idToken: string) => {
    setError(null);
    googleMutation.mutate({ idToken });
  });
  const handleGoogleSdkError = useEffectEvent((message: string) => {
    setGoogleSetupError(message);
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (!googleClientId) return;

    const container = googleButtonRef.current;
    if (!container) return;

    void mountGoogleSignInButton({
      container,
      clientId: googleClientId,
      buttonText: 'signin_with',
      flow: 'signin',
      locale: 'it',
      width: Math.min(container.clientWidth || 360, 480),
      enableOneTap: true,
      onCredential: handleGoogleCredential,
      onError: handleGoogleSdkError,
    })
      .then((dispose) => {
        cleanup = dispose;
        setGoogleSetupError(null);
      })
      .catch((err: unknown) => {
        setGoogleSetupError(
          err instanceof Error ? err.message : 'Impossibile inizializzare Google SDK.'
        );
      });

    return () => {
      cleanup?.();
    };
  }, [googleClientId]);

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 md:py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-white border border-zinc-200 shadow-sm mb-4">
            <img src="/favicon.svg" alt="EnergyFit" className="w-11 h-11" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500 mb-2">
            EnergyFit Pro
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">Accedi</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className={cardClass}>
          <input
            className="w-full rounded-2xl border border-zinc-200 px-5 py-3.5 text-lg bg-zinc-50"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-zinc-200 px-5 py-3.5 text-lg bg-zinc-50"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="w-full bg-zinc-900 text-white rounded-2xl py-4 font-semibold text-lg disabled:opacity-50"
            onClick={() => {
              setError(null);
              emailMutation.mutate({ email, password });
            }}
            disabled={emailMutation.isPending}
          >
            {emailMutation.isPending ? 'Accesso...' : 'Accedi con Email'}
          </button>
          <div className="pt-1">
            <div ref={googleButtonRef} className="min-h-12 w-full flex justify-center" />
          </div>
          {(googleConfigError || googleSetupError) && (
            <p className="text-sm text-red-700">{googleConfigError || googleSetupError}</p>
          )}
          {googleMutation.isPending && (
            <p className="text-sm text-zinc-500">Accesso Google in corso...</p>
          )}
        </div>
      </div>
    </div>
  );
};
