import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { signupEmail, signupGoogle } from '../lib/api/auth';
import { isApiError } from '../lib/api/client';
import { mountGoogleSignInButton } from '../lib/auth/oauth-sdk';
import { queryClient } from '../lib/query-client';

const cardClass = 'bg-white border border-zinc-200 rounded-2xl p-5 space-y-4';

export const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleSetupError, setGoogleSetupError] = useState<string | null>(null);

  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token')?.trim() ?? '';
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';
  const googleConfigError = !googleClientId
    ? 'Google signup non configurato (VITE_GOOGLE_CLIENT_ID mancante).'
    : null;

  const handleSuccess = async (role: 'admin' | 'customer') => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
    await navigate({ to: role === 'admin' ? '/admin' : '/' });
  };

  const emailMutation = useMutation({
    mutationFn: signupEmail,
    onSuccess: (data) => {
      void handleSuccess(data.user.role);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Signup email fallito.');
    },
  });

  const googleMutation = useMutation({
    mutationFn: signupGoogle,
    onSuccess: (data) => {
      void handleSuccess(data.user.role);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Signup Google fallito.');
    },
  });

  const handleGoogleCredential = useEffectEvent((idToken: string) => {
    setError(null);
    googleMutation.mutate({ inviteToken, idToken });
  });
  const handleGoogleSdkError = useEffectEvent((message: string) => {
    setGoogleSetupError(message);
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (!inviteToken) return;

    if (!googleClientId) return;

    const container = googleButtonRef.current;
    if (!container) return;

    void mountGoogleSignInButton({
      container,
      clientId: googleClientId,
      buttonText: 'signup_with',
      flow: 'signup',
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
  }, [googleClientId, inviteToken]);

  if (!inviteToken) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Invito mancante</h1>
          <p className="text-zinc-500 text-sm mb-4">
            Apri questa pagina usando il link d'invito completo ricevuto dall'admin.
          </p>
          <Link to="/login" className="text-zinc-900 underline font-semibold">
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Completa registrazione</h1>
          <p className="text-zinc-500 mt-2">Invite-only: usa il canale che preferisci</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className={cardClass}>
          <h2 className="font-semibold text-zinc-900">Signup con Email</h2>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            placeholder="Email invitata"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="w-full bg-zinc-900 text-white rounded-xl py-2.5 font-semibold disabled:opacity-50"
            onClick={() => {
              setError(null);
              emailMutation.mutate({
                inviteToken,
                email,
                password,
              });
            }}
            disabled={emailMutation.isPending}
          >
            {emailMutation.isPending ? 'Registrazione...' : 'Registrati con Email'}
          </button>
        </div>

        <div className={cardClass}>
          <h2 className="font-semibold text-zinc-900">Signup con Google</h2>
          <p className="text-sm text-zinc-500">
            Registrazione con Google Identity Services. Supportata per account
            Gmail o Google Workspace gestiti.
          </p>
          <div ref={googleButtonRef} className="min-h-12" />
          {(googleConfigError || googleSetupError) && (
            <p className="text-sm text-red-700">
              {googleConfigError || googleSetupError}
            </p>
          )}
          {googleMutation.isPending && (
            <p className="text-sm text-zinc-500">Registrazione Google in corso...</p>
          )}
        </div>

        <div className="text-center text-sm text-zinc-500">
          Hai già un account?{' '}
          <Link to="/login" className="text-zinc-900 font-semibold underline">
            Vai al login
          </Link>
        </div>
      </div>
    </div>
  );
};
