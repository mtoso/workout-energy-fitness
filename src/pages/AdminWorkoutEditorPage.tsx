import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { CheckCircle2, FileText } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminWorkoutPlanBuilder } from '../components/admin/AdminWorkoutPlanBuilder';
import { isApiError } from '../lib/api/client';
import {
  adminUserDetailQueryOptions,
  meQueryOptions,
} from '../lib/api/query-options';
import {
  activateAdminWorkoutPlan,
  getAdminWorkoutPlan,
  saveAdminWorkoutPlan,
} from '../lib/api/workout';
import { queryClient } from '../lib/query-client';
import { useAdminLogout } from '../hooks/useAdminLogout';
import type { AdminWorkoutPlanInput } from '../types/admin-workout';

const formatDateTime = (value: string | null) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const userTypeLabel = (userType: 'client' | 'coach') => (userType === 'coach' ? 'Coach' : 'Cliente');

export const AdminWorkoutEditorPage = () => {
  const params = useParams({ from: '/admin/users/$userId/workouts/$planId' });
  const { userId, planId } = params;
  const { handleLogout } = useAdminLogout();

  const meQuery = useQuery(meQueryOptions());
  const detailQuery = useQuery(adminUserDetailQueryOptions(userId));
  const workoutPlanQuery = useQuery({
    queryKey: ['admin', 'workout-plan', userId, planId],
    queryFn: () => getAdminWorkoutPlan(userId, planId),
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const isPersonalView = meQuery.data?.user.id === userId;
  const user = detailQuery.data?.user;
  const selectedPlanSummary = useMemo(
    () => detailQuery.data?.workouts.find((workout) => workout.id === planId) ?? null,
    [detailQuery.data?.workouts, planId]
  );

  const saveMutation = useMutation({
    mutationFn: (payload: AdminWorkoutPlanInput) => saveAdminWorkoutPlan(userId, planId, payload),
    onSuccess: async (data) => {
      setSaveError(null);
      setGeneralError(null);
      setSaveOk('Scheda salvata con successo.');
      queryClient.setQueryData(['admin', 'workout-plan', userId, planId], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
      if (isPersonalView) {
        await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
      }
    },
    onError: (error) => {
      setSaveOk(null);
      setSaveError(isApiError(error) ? error.message : 'Salvataggio non riuscito.');
    },
  });

  const activateWorkoutMutation = useMutation({
    mutationFn: () => activateAdminWorkoutPlan(userId, planId),
    onSuccess: async (data) => {
      setGeneralError(null);
      queryClient.setQueryData(['admin', 'workout-plan', userId, planId], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
      if (isPersonalView) {
        await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
      }
    },
    onError: (error) => {
      setGeneralError(isApiError(error) ? error.message : 'Pubblicazione della scheda non riuscita.');
    },
  });

  const section = isPersonalView ? 'personal' : 'users';
  const title = isPersonalView ? 'Editor scheda personale' : 'Editor scheda';
  const subtitle = user
    ? `${user.fullName} · ${user.isAdmin ? 'Admin' : userTypeLabel(user.userType)}`
    : 'Modifica la struttura completa della scheda selezionata.';

  return (
    <AdminShell
      section={section}
      title={title}
      subtitle={subtitle}
      onLogout={handleLogout}
      hideMobileNavigation
      actions={
        <Link
          to="/admin/users/$userId"
          params={{ userId }}
          className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-2xl font-semibold w-full sm:w-auto text-center"
        >
          Torna al profilo
        </Link>
      }
    >
      {detailQuery.isLoading || workoutPlanQuery.isLoading ? (
        <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
          Caricamento editor...
        </div>
      ) : detailQuery.isError || workoutPlanQuery.isError ? (
        <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
          Errore nel caricamento della scheda.
        </div>
      ) : !detailQuery.data || !workoutPlanQuery.data?.plan ? (
        <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
          Scheda non trovata.
        </div>
      ) : (
        <div className="space-y-6">
          {generalError && (
            <div className="rounded-2xl px-4 py-3 text-sm font-medium bg-red-100 text-red-700 border border-red-200">
              {generalError}
            </div>
          )}

          <div className="grid md:grid-cols-[minmax(0,1fr)_280px] gap-4">
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                      {workoutPlanQuery.data.plan.title}
                    </h2>
                    {workoutPlanQuery.data.plan.isCurrent ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                        Corrente
                      </span>
                    ) : null}
                  </div>
                  <p className="text-zinc-500 mt-1">
                    Ultimo aggiornamento {formatDateTime(selectedPlanSummary?.updatedAt ?? workoutPlanQuery.data.plan.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Azioni</p>
                <p className="text-sm text-zinc-500">
                  Salva la bozza o pubblica questa versione come scheda corrente dell’utente.
                </p>
              </div>
              <button
                onClick={() => activateWorkoutMutation.mutate()}
                disabled={activateWorkoutMutation.isPending || workoutPlanQuery.data.plan.isCurrent}
                className="w-full bg-emerald-500 text-zinc-950 px-4 py-3 rounded-2xl font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                {workoutPlanQuery.data.plan.isCurrent
                  ? 'Scheda già corrente'
                  : activateWorkoutMutation.isPending
                    ? 'Pubblicazione...'
                    : 'Imposta come corrente'}
              </button>
            </div>
          </div>

          <AdminWorkoutPlanBuilder
            key={planId}
            plan={workoutPlanQuery.data.plan}
            isSaving={saveMutation.isPending}
            saveError={saveError}
            saveOk={saveOk}
            onSave={(payload) => {
              setSaveOk(null);
              setSaveError(null);
              saveMutation.mutate(payload);
            }}
          />
        </div>
      )}
    </AdminShell>
  );
};
