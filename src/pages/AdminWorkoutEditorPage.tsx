import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { Check, ChevronLeft } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminWorkoutPlanBuilder } from '../components/admin/AdminWorkoutPlanBuilder';
import {
  cloneAdminWorkoutPlanInput,
  toAdminWorkoutPlanInput,
} from '../components/admin/adminWorkoutPlanBuilderUtils';
import { useAdminLogout } from '../hooks/useAdminLogout';
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
import type {
  AdminWorkoutPlan,
  AdminWorkoutPlanInput,
  AdminWorkoutPlanSummary,
} from '../types/admin-workout';
import type { AdminUserSummary } from '../types/admin';

type SaveState = 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY_MS = 900;

const userTypeLabel = (userType: 'client' | 'coach') => (userType === 'coach' ? 'Coach' : 'Cliente');

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

const arePlanInputsEqual = (a: AdminWorkoutPlanInput, b: AdminWorkoutPlanInput) =>
  JSON.stringify(a) === JSON.stringify(b);

interface EditorViewProps {
  userId: string;
  planId: string;
  user: AdminUserSummary;
  plan: AdminWorkoutPlan;
  selectedPlanSummary: AdminWorkoutPlanSummary | null;
  isPersonalView: boolean;
}

const AdminWorkoutEditorView = ({
  userId,
  planId,
  user,
  plan,
  selectedPlanSummary,
  isPersonalView,
}: EditorViewProps) => {
  const [draft, setDraft] = useState<AdminWorkoutPlanInput>(() => toAdminWorkoutPlanInput(plan));
  const [lastSavedDraft, setLastSavedDraft] = useState<AdminWorkoutPlanInput>(() =>
    toAdminWorkoutPlanInput(plan)
  );
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: AdminWorkoutPlanInput) => saveAdminWorkoutPlan(userId, planId, payload),
    onSuccess: async (data) => {
      const nextDraft = toAdminWorkoutPlanInput(data.plan);
      setDraft(nextDraft);
      setLastSavedDraft(cloneAdminWorkoutPlanInput(nextDraft));
      setSaveState('saved');
      setSaveError(null);
      queryClient.setQueryData(['admin', 'workout-plan', userId, planId], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
      if (isPersonalView) {
        await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
      }
    },
    onError: (error) => {
      setSaveState('error');
      setSaveError(isApiError(error) ? error.message : 'Salvataggio non riuscito.');
    },
  });

  const activateWorkoutMutation = useMutation({
    mutationFn: () => activateAdminWorkoutPlan(userId, planId),
    onSuccess: async (data) => {
      setSaveError(null);
      queryClient.setQueryData(['admin', 'workout-plan', userId, planId], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
      if (isPersonalView) {
        await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
      }
    },
    onError: (error) => {
      setSaveState('error');
      setSaveError(isApiError(error) ? error.message : 'Pubblicazione della scheda non riuscita.');
    },
  });

  useEffect(() => {
    if (arePlanInputsEqual(draft, lastSavedDraft)) {
      return;
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      saveMutation.mutate(cloneAdminWorkoutPlanInput(draft));
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [draft, lastSavedDraft, saveMutation]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    },
    []
  );

  const handleDraftChange = (nextDraft: AdminWorkoutPlanInput) => {
    setDraft(nextDraft);
    if (!arePlanInputsEqual(nextDraft, lastSavedDraft)) {
      setSaveState('saving');
      setSaveError(null);
    }
  };

  const handleTitleChange = (title: string) => {
    handleDraftChange({
      ...cloneAdminWorkoutPlanInput(draft),
      title,
    });
  };

  const isCurrentWorkout = plan.isCurrent;

  return (
    <div className="w-full space-y-0">
      <section className="sticky top-[65px] z-20 border-b border-zinc-200 bg-white md:static">
        <div className="flex flex-col gap-5 px-6 py-6 md:px-8 md:py-7 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4 md:gap-5">
            <Link
              to="/admin/users/$userId"
              params={{ userId }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
              aria-label="Torna al profilo"
            >
              <ChevronLeft size={22} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 md:text-xs">
                <span className="text-emerald-600">Editor scheda</span>
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                <span className="truncate normal-case tracking-normal text-sm font-bold text-zinc-500 md:text-base">
                  {user.fullName}
                </span>
              </div>
              <input
                id="plan-title"
                name="plan-title"
                type="text"
                value={draft.title}
                onChange={(event) => handleTitleChange(event.target.value)}
              className="mt-1 w-full max-w-[520px] border-none bg-transparent px-0 text-3xl font-black tracking-tight text-zinc-900 focus:outline-none focus:ring-0 md:text-[3rem]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 xl:justify-end">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 md:text-base">
              {saveState === 'saving' ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-emerald-500 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : saveState === 'error' ? (
                <span className="text-red-600">Errore salvataggio</span>
              ) : (
                <>
                  <Check size={18} className="text-emerald-500" />
                  <span>Salvato</span>
                </>
              )}
            </div>

            <div className="hidden h-10 w-px bg-zinc-200 md:block" />

            <button
              type="button"
              onClick={() => {
                if (!isCurrentWorkout && !activateWorkoutMutation.isPending) {
                  activateWorkoutMutation.mutate();
                }
              }}
              className="inline-flex items-center gap-3 disabled:cursor-default"
              aria-pressed={isCurrentWorkout}
              disabled={isCurrentWorkout || activateWorkoutMutation.isPending}
            >
              <span
                className={`text-base font-bold transition-colors md:text-xl ${
                  isCurrentWorkout ? 'text-zinc-900' : 'text-zinc-400'
                }`}
              >
                Pubblica
              </span>
              <span
                className={`relative inline-flex h-11 w-[74px] items-center rounded-full border border-transparent transition-colors ${
                  isCurrentWorkout ? 'bg-emerald-500' : 'bg-zinc-200'
                } ${activateWorkoutMutation.isPending ? 'opacity-60' : ''}`}
              >
                <span
                  className={`inline-block h-9 w-9 transform rounded-full bg-white shadow transition ${
                    isCurrentWorkout ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </section>

      <div className="px-6 py-8 md:px-8">
        {saveError ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
            {saveError}
          </div>
        ) : null}

        <AdminWorkoutPlanBuilder value={draft} onChange={handleDraftChange} />

        <div className="mt-6 px-1 text-sm text-zinc-400">
          {selectedPlanSummary?.updatedAt ? (
            <span>Ultimo aggiornamento salvato: {formatDateTime(selectedPlanSummary.updatedAt)}</span>
          ) : (
            <span>
              {isPersonalView ? 'Scheda personale' : `${userTypeLabel(user.userType)} ${user.fullName}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

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

  const isPersonalView = meQuery.data?.user.id === userId;
  const section = isPersonalView ? 'personal' : 'users';
  const user = detailQuery.data?.user;
  const plan = workoutPlanQuery.data?.plan ?? null;
  const selectedPlanSummary =
    detailQuery.data?.workouts.find((workout) => workout.id === planId) ?? null;

  return (
    <AdminShell
      section={section}
      title="Editor scheda"
      onLogout={handleLogout}
      hideHeader
      hideMobileNavigation
      contentClassName="!px-0 !py-0 !space-y-0"
    >
      {detailQuery.isLoading || workoutPlanQuery.isLoading ? (
        <div className="mx-auto max-w-[1360px] rounded-[2rem] border border-zinc-200 bg-white px-10 py-14 text-center text-zinc-500 shadow-sm">
          Caricamento editor...
        </div>
      ) : detailQuery.isError || workoutPlanQuery.isError ? (
        <div className="mx-auto max-w-[1360px] rounded-[2rem] border border-red-200 bg-red-50 px-10 py-14 text-center text-red-700 shadow-sm">
          Errore nel caricamento della scheda.
        </div>
      ) : !user || !plan ? (
        <div className="mx-auto max-w-[1360px] rounded-[2rem] border border-red-200 bg-red-50 px-10 py-14 text-center text-red-700 shadow-sm">
          Scheda non trovata.
        </div>
      ) : (
        <AdminWorkoutEditorView
          userId={userId}
          planId={planId}
          user={user}
          plan={plan}
          selectedPlanSummary={selectedPlanSummary}
          isPersonalView={isPersonalView}
        />
      )}
    </AdminShell>
  );
};
