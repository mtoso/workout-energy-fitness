import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import App from '../App';
import { logout } from '../lib/api/auth';
import { isApiError } from '../lib/api/client';
import { disableGoogleAutoSelect } from '../lib/auth/oauth-sdk';
import { myWorkoutQueryOptions, meQueryOptions } from '../lib/api/query-options';
import { queryClient } from '../lib/query-client';

type AppScreen = 'home' | 'scheda' | 'profile';

interface UserAppPageProps {
  screen: AppScreen;
}

const routeByScreen: Record<AppScreen, '/' | '/scheda' | '/profile'> = {
  home: '/',
  scheda: '/scheda',
  profile: '/profile',
};

export const UserAppPage = ({ screen }: UserAppPageProps) => {
  const navigate = useNavigate();

  const meQuery = useQuery(meQueryOptions());
  const workoutQuery = useQuery(myWorkoutQueryOptions());

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['workout'] });
      await navigate({ to: '/login' });
    },
  });

  if (meQuery.isLoading || workoutQuery.isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">
        Caricamento in corso...
      </div>
    );
  }

  if (meQuery.isError || !meQuery.data?.user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-red-600 px-6 text-center">
        Sessione non valida. Ricarica la pagina o esegui di nuovo il login.
      </div>
    );
  }

  if (workoutQuery.isError) {
    const isAuthError = isApiError(workoutQuery.error) && workoutQuery.error.status === 401;

    return (
      <div
        className={`min-h-screen flex items-center justify-center px-6 text-center ${
          isAuthError ? 'bg-zinc-50 text-red-600' : 'bg-zinc-50 text-zinc-700'
        }`}
      >
        {isAuthError
          ? 'Sessione non valida. Ricarica la pagina o esegui di nuovo il login.'
          : 'Errore nel caricamento della scheda. Ricarica la pagina e riprova.'}
      </div>
    );
  }

  const plan = workoutQuery.data?.plan;

  return (
    <App
      currentScreen={screen}
      onNavigate={(nextScreen) => {
        void navigate({ to: routeByScreen[nextScreen] });
      }}
      initialSchedaData={plan?.days ?? []}
      userEmail={meQuery.data.user.email}
      isAdmin={meQuery.data.user.canManageClients}
      onOpenAdmin={() => {
        void navigate({ to: '/admin' });
      }}
      onLogout={() => {
        disableGoogleAutoSelect();
        logoutMutation.mutate();
      }}
    />
  );
};
