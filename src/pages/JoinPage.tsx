import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { AuthUser } from '../types/auth';
import defaultProfileLogo from '../assets/profile-default-logo.png';
import { registerEmail, registerGoogle } from '../lib/api/auth';
import { isApiError } from '../lib/api/client';
import { mountGoogleSignInButton } from '../lib/auth/oauth-sdk';
import { queryClient } from '../lib/query-client';

const cardClass = 'bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-4';

export const JoinPage = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleSetupError, setGoogleSetupError] = useState<string | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';
  const googleConfigError = !googleClientId
    ? "Registrazione con Google non configurata (manca VITE_GOOGLE_CLIENT_ID)."
    : null;

  const handleSuccess = async (user: AuthUser) => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
    await navigate({ to: user.canManageClients ? '/admin' : '/' });
  };

  const emailMutation = useMutation({
    mutationFn: registerEmail,
    onSuccess: (data) => {
      void handleSuccess(data.user);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Registrazione con email non riuscita.');
    },
  });

  const googleMutation = useMutation({
    mutationFn: registerGoogle,
    onSuccess: (data) => {
      void handleSuccess(data.user);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Registrazione con Google non riuscita.');
    },
  });

  const handleGoogleCredential = useEffectEvent((idToken: string) => {
    if (!fullName.trim() || !email.trim()) {
      setError('Inserisci nome completo ed email prima di continuare con Google.');
      return;
    }

    setError(null);
    googleMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      idToken,
    });
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
      buttonText: 'continue_with',
      flow: 'signup',
      locale: 'it',
      width: Math.min(container.clientWidth || 360, 480),
      onCredential: handleGoogleCredential,
      onError: handleGoogleSdkError,
    })
      .then((dispose) => {
        cleanup = dispose;
        setGoogleSetupError(null);
      })
      .catch((err: unknown) => {
        setGoogleSetupError(
          err instanceof Error ? err.message : 'Impossibile inizializzare il servizio Google.'
        );
      });

    return () => {
      cleanup?.();
    };
  }, [googleClientId]);

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    emailMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 md:py-12">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[1.75rem] bg-white border border-zinc-200 shadow-sm mb-5 overflow-hidden">
            <img src={defaultProfileLogo} alt="EnergyFit" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">
            Iscriviti
          </h1>
          <p className="text-zinc-500 mt-3">
            Crea il tuo account cliente per accedere all&apos;app personale.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className={cardClass}>
          <h2 className="font-semibold text-zinc-900">Registrazione con email</h2>
          <form className="space-y-4" onSubmit={handleEmailSubmit} noValidate>
            <div>
              <label htmlFor="join-full-name" className="sr-only">
                Nome completo
              </label>
              <input
                id="join-full-name"
                name="fullName"
                autoComplete="name"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2"
                placeholder="Nome e cognome"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="join-email" className="sr-only">
                Email
              </label>
              <input
                id="join-email"
                name="email"
                autoComplete="email"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="join-password" className="sr-only">
                Password
              </label>
              <input
                id="join-password"
                name="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-zinc-900 text-white rounded-xl py-2.5 font-semibold disabled:opacity-50"
              disabled={emailMutation.isPending}
            >
              {emailMutation.isPending ? 'Registrazione...' : 'Crea account'}
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h2 className="font-semibold text-zinc-900">Continua con Google</h2>
          <p className="text-sm text-zinc-500">
            Inserisci prima nome completo ed email. L&apos;indirizzo inserito deve coincidere con quello del tuo account Google.
          </p>
          <div ref={googleButtonRef} className="min-h-12" />
          {(googleConfigError || googleSetupError) && (
            <p className="text-sm text-red-700">{googleConfigError || googleSetupError}</p>
          )}
          {googleMutation.isPending && (
            <p className="text-sm text-zinc-500">Registrazione con Google in corso...</p>
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
