import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { AuthUser } from '../types/auth';
import defaultProfileLogo from '../assets/profile-default-logo.png';
import { signupEmail, signupGoogle } from '../lib/api/auth';
import { isApiError } from '../lib/api/client';
import { inviteMetadataQueryOptions } from '../lib/api/query-options';
import { mountGoogleSignInButton } from '../lib/auth/oauth-sdk';
import { queryClient } from '../lib/query-client';

const cardClass = 'bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-4';

export const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleSetupError, setGoogleSetupError] = useState<string | null>(null);

  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token')?.trim() ?? '';
  }, []);

  const inviteMetaQuery = useQuery({
    ...inviteMetadataQueryOptions(inviteToken),
    enabled: Boolean(inviteToken),
  });

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
    mutationFn: signupEmail,
    onSuccess: (data) => {
      void handleSuccess(data.user);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Registrazione con email non riuscita.');
    },
  });

  const googleMutation = useMutation({
    mutationFn: signupGoogle,
    onSuccess: (data) => {
      void handleSuccess(data.user);
    },
    onError: (err) => {
      setError(isApiError(err) ? err.message : 'Registrazione con Google non riuscita.');
    },
  });

  const handleGoogleCredential = useEffectEvent((idToken: string) => {
    if (!inviteMetaQuery.data?.valid || !inviteToken) {
      setError("L'invito non è più disponibile.");
      return;
    }

    setError(null);
    googleMutation.mutate({ inviteToken, idToken });
  });

  const handleGoogleSdkError = useEffectEvent((message: string) => {
    setGoogleSetupError(message);
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (!inviteMetaQuery.data?.valid || !inviteToken || !googleClientId) return;

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
  }, [googleClientId, inviteMetaQuery.data?.valid, inviteToken]);

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const email = inviteMetaQuery.data?.email ?? '';
    if (!inviteToken || !inviteMetaQuery.data?.valid || !email) {
      setError("L'invito non è più disponibile.");
      return;
    }

    emailMutation.mutate({ inviteToken, email, password });
  };

  if (!inviteToken) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Invito mancante</h1>
          <p className="text-zinc-500 text-sm mb-4">
            Apri questa pagina usando il link d&apos;invito completo ricevuto dal backoffice.
          </p>
          <Link to="/login" className="text-zinc-900 underline font-semibold">
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  const inviteMeta = inviteMetaQuery.data;
  const inviteIsValid = inviteMeta?.valid === true;

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 md:py-12">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[1.75rem] bg-white border border-zinc-200 shadow-sm mb-5 overflow-hidden">
            <img src={defaultProfileLogo} alt="EnergyFit" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">
            Attiva il tuo account
          </h1>
          <p className="text-zinc-500 mt-3">Scegli come vuoi accedere in futuro.</p>
        </div>

        {inviteMetaQuery.isLoading ? (
          <div className={cardClass}>
            <p className="text-zinc-500">Verifica dell&apos;invito in corso...</p>
          </div>
        ) : inviteMetaQuery.isError || !inviteIsValid ? (
          <div className={cardClass}>
            <h2 className="text-xl font-bold text-zinc-900">Invito non disponibile</h2>
            <p className="text-zinc-500">
              Il link non è valido oppure è già stato utilizzato. Chiedi al backoffice di rigenerare un nuovo invito.
            </p>
            <Link to="/login" className="text-zinc-900 underline font-semibold">
              Torna al login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className={cardClass}>
              <h2 className="font-semibold text-zinc-900">Dettagli invito</h2>
              <div className="space-y-3">
                {inviteMeta.fullName ? (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={inviteMeta.fullName}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 bg-zinc-50 text-zinc-900"
                    />
                  </div>
                ) : null}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Email invitata
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={inviteMeta.email ?? ''}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 bg-zinc-50 text-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="font-semibold text-zinc-900">Crea password</h2>
              <form className="space-y-4" onSubmit={handleEmailSubmit} noValidate>
                <div>
                  <label htmlFor="invite-password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="invite-password"
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
                  {emailMutation.isPending ? 'Attivazione...' : 'Crea password e continua'}
                </button>
              </form>
            </div>

            <div className={cardClass}>
              <h2 className="font-semibold text-zinc-900">Continua con Google</h2>
              <p className="text-sm text-zinc-500">
                Disponibile per account Gmail o Google Workspace gestiti. L&apos;indirizzo Google deve coincidere con l&apos;email invitata.
              </p>
              <div ref={googleButtonRef} className="min-h-12" />
              {(googleConfigError || googleSetupError) && (
                <p className="text-sm text-red-700">{googleConfigError || googleSetupError}</p>
              )}
              {googleMutation.isPending && (
                <p className="text-sm text-zinc-500">Registrazione con Google in corso...</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
