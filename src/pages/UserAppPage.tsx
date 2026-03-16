import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import App from '../App';
import { logout } from '../lib/api/auth';
import { isApiError } from '../lib/api/client';
import { markMyWorkoutNotificationsSeen, setMyPreferredWorkoutPlan } from '../lib/api/workout';
import { disableGoogleAutoSelect } from '../lib/auth/oauth-sdk';
import {
  myWorkoutOverviewQueryOptions,
  myWorkoutPlanByIdQueryOptions,
  meQueryOptions,
} from '../lib/api/query-options';
import { queryClient } from '../lib/query-client';
import type { WorkoutPlansOverview } from '../types/workout';

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
  const workoutOverviewQuery = useQuery(myWorkoutOverviewQueryOptions());
  const [selectedPlanIdIntent, setSelectedPlanIdIntent] = useState<string | null>(null);

  const selectedPlanId = useMemo(() => {
    const plans = workoutOverviewQuery.data?.plans ?? [];
    if (plans.length === 0) return null;

    if (selectedPlanIdIntent && plans.some((plan) => plan.id === selectedPlanIdIntent)) {
      return selectedPlanIdIntent;
    }

    return workoutOverviewQuery.data?.preferredPlan?.id ?? plans[0]?.id ?? null;
  }, [selectedPlanIdIntent, workoutOverviewQuery.data]);

  const selectedPlanQuery = useQuery({
    ...myWorkoutPlanByIdQueryOptions(selectedPlanId ?? ''),
    enabled: Boolean(selectedPlanId) && selectedPlanId !== workoutOverviewQuery.data?.preferredPlan?.id,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['workout'] });
      await navigate({ to: '/login' });
    },
  });

  const markSeenMutation = useMutation({
    mutationFn: markMyWorkoutNotificationsSeen,
    onSuccess: () => {
      queryClient.setQueryData(
        ['workout', 'overview'],
        (current: WorkoutPlansOverview | undefined) =>
          current
            ? {
                ...current,
                hasUnseenPublication: false,
              }
            : current
      );
    },
  });

  const setPreferredMutation = useMutation({
    mutationFn: (planId: string) => setMyPreferredWorkoutPlan(planId),
    onSuccess: (overview, planId) => {
      queryClient.setQueryData(['workout', 'overview'], overview);
      queryClient.invalidateQueries({ queryKey: ['workout', 'plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
      setSelectedPlanIdIntent(planId);
    },
  });

  useEffect(() => {
    if (
      screen === 'scheda' &&
      workoutOverviewQuery.data?.hasUnseenPublication &&
      !markSeenMutation.isPending
    ) {
      markSeenMutation.mutate();
    }
  }, [markSeenMutation, screen, workoutOverviewQuery.data?.hasUnseenPublication]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return workoutOverviewQuery.data?.preferredPlan ?? null;
    if (selectedPlanId === workoutOverviewQuery.data?.preferredPlan?.id) {
      return workoutOverviewQuery.data.preferredPlan;
    }

    return selectedPlanQuery.data?.plan ?? null;
  }, [selectedPlanId, selectedPlanQuery.data?.plan, workoutOverviewQuery.data]);

  const isLoading =
    meQuery.isLoading ||
    workoutOverviewQuery.isLoading ||
    (Boolean(selectedPlanId) &&
      selectedPlanId !== workoutOverviewQuery.data?.preferredPlan?.id &&
      selectedPlanQuery.isLoading);

  if (isLoading) {
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

  if (workoutOverviewQuery.isError || selectedPlanQuery.isError) {
    const error = workoutOverviewQuery.error ?? selectedPlanQuery.error;
    const isAuthError = isApiError(error) && error.status === 401;

    return (
      <div
        className={`min-h-screen flex items-center justify-center px-6 text-center ${
          isAuthError ? 'bg-zinc-50 text-red-600' : 'bg-zinc-50 text-zinc-700'
        }`}
      >
        {isAuthError
          ? 'Sessione non valida. Ricarica la pagina o esegui di nuovo il login.'
          : 'Errore nel caricamento delle schede. Ricarica la pagina e riprova.'}
      </div>
    );
  }

  return (
    <App
      currentScreen={screen}
      onNavigate={(nextScreen) => {
        void navigate({ to: routeByScreen[nextScreen] });
      }}
      preferredPlan={workoutOverviewQuery.data?.preferredPlan ?? null}
      selectedPlan={selectedPlan}
      selectedPlanId={selectedPlanId}
      workoutPlans={workoutOverviewQuery.data?.plans ?? []}
      hasUnseenPublication={workoutOverviewQuery.data?.hasUnseenPublication ?? false}
      isSettingPreferredPlan={setPreferredMutation.isPending}
      userId={meQuery.data.user.id}
      userEmail={meQuery.data.user.email}
      isAdmin={meQuery.data.user.canManageClients}
      onSelectPlan={setSelectedPlanIdIntent}
      onSetPreferredPlan={(planId) => setPreferredMutation.mutate(planId)}
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
