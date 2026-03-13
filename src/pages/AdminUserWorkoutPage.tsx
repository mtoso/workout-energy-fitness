import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { FileText, Plus, Scale, Shield, UserCircle, Users, X } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminWorkoutPlanBuilder } from '../components/admin/AdminWorkoutPlanBuilder';
import { isApiError } from '../lib/api/client';
import {
  adminCoachesQueryOptions,
  adminUserDetailQueryOptions,
  meQueryOptions,
} from '../lib/api/query-options';
import {
  activateAdminWorkoutPlan,
  assignAdminUserCoach,
  createAdminCheckin,
  createAdminUserWorkout,
  getAdminWorkoutPlan,
  saveAdminWorkoutPlan,
} from '../lib/api/workout';
import { queryClient } from '../lib/query-client';
import { useAdminLogout } from '../hooks/useAdminLogout';
import type { AdminWorkoutPlanInput } from '../types/admin-workout';

const summaryCardClass = 'bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatDateTime = (value: string) => {
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

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitials = (fullName: string, email: string) =>
  (fullName || email)
    .split(/\s+|[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('') || 'U';

export const AdminUserWorkoutPage = () => {
  const params = useParams({ from: '/admin/users/$userId/workout' });
  const userId = params.userId;
  const { handleLogout } = useAdminLogout();

  const meQuery = useQuery(meQueryOptions());
  const detailQuery = useQuery(adminUserDetailQueryOptions(userId));
  const coachesQuery = useQuery(adminCoachesQueryOptions());

  const isPersonalView = meQuery.data?.user.id === userId;
  const user = detailQuery.data?.user;
  const backLink = user?.role === 'admin' && !isPersonalView ? '/admin/coaches' : '/admin/users';
  const backLabel = user?.role === 'admin' && !isPersonalView ? 'Torna coach' : 'Torna clienti';

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isAddWeightModalOpen, setIsAddWeightModalOpen] = useState(false);
  const [weightDate, setWeightDate] = useState(toDateInputValue(new Date()));
  const [weightValue, setWeightValue] = useState('');
  const [fatValue, setFatValue] = useState('');

  const effectiveSelectedPlanId =
    selectedPlanId ??
    detailQuery.data?.workouts.find((workout) => workout.isCurrent)?.id ??
    detailQuery.data?.workouts[0]?.id ??
    null;

  const selectedPlanSummary = useMemo(
    () => detailQuery.data?.workouts.find((workout) => workout.id === effectiveSelectedPlanId) ?? null,
    [detailQuery.data?.workouts, effectiveSelectedPlanId]
  );

  const workoutPlanQuery = useQuery({
    queryKey: ['admin', 'workout-plan', userId, effectiveSelectedPlanId],
    queryFn: () => getAdminWorkoutPlan(userId, effectiveSelectedPlanId as string),
    enabled: Boolean(effectiveSelectedPlanId),
  });

  const upsertDetailCache = (detail: NonNullable<typeof detailQuery.data>) => {
    queryClient.setQueryData(['admin', 'user-detail', userId], detail);
  };

  const saveMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: AdminWorkoutPlanInput }) =>
      saveAdminWorkoutPlan(userId, planId, payload),
    onSuccess: async (data) => {
      setSaveError(null);
      setSaveOk('Scheda salvata con successo.');
      queryClient.setQueryData(['admin', 'workout-plan', userId, data.plan.id], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
      if (isPersonalView) {
        await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
      }
    },
    onError: (error) => {
      setSaveOk(null);
      setSaveError(isApiError(error) ? error.message : 'Salvataggio fallito.');
    },
  });

  const createWorkoutMutation = useMutation({
    mutationFn: () => createAdminUserWorkout(userId, effectiveSelectedPlanId),
    onSuccess: async (data) => {
      setGeneralError(null);
      setSelectedPlanId(data.plan.id);
      queryClient.setQueryData(['admin', 'workout-plan', userId, data.plan.id], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
    },
    onError: (error) => {
      setGeneralError(isApiError(error) ? error.message : 'Creazione scheda fallita.');
    },
  });

  const activateWorkoutMutation = useMutation({
    mutationFn: (planId: string) => activateAdminWorkoutPlan(userId, planId),
    onSuccess: async (data) => {
      setGeneralError(null);
      queryClient.setQueryData(['admin', 'workout-plan', userId, data.plan.id], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
      if (isPersonalView) {
        await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
      }
    },
    onError: (error) => {
      setGeneralError(isApiError(error) ? error.message : 'Pubblicazione scheda fallita.');
    },
  });

  const assignCoachMutation = useMutation({
    mutationFn: (coachUserId: string | null) => assignAdminUserCoach(userId, coachUserId),
    onSuccess: async (detail) => {
      setGeneralError(null);
      upsertDetailCache(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'coaches'] }),
      ]);
    },
    onError: (error) => {
      setGeneralError(isApiError(error) ? error.message : 'Aggiornamento coach fallito.');
    },
  });

  const createCheckinMutation = useMutation({
    mutationFn: (payload: { recordedAt: string; weight: number; fat: number | null }) =>
      createAdminCheckin(userId, payload),
    onSuccess: async (detail) => {
      setGeneralError(null);
      upsertDetailCache(detail);
      setIsAddWeightModalOpen(false);
      setWeightDate(toDateInputValue(new Date()));
      setWeightValue('');
      setFatValue('');
    },
    onError: (error) => {
      setGeneralError(isApiError(error) ? error.message : 'Salvataggio pesata fallito.');
    },
  });

  const latestCheck = detailQuery.data?.checkins[0] ?? null;

  return (
    <>
      <AdminShell
        section={isPersonalView ? 'personal' : 'editor'}
        title={isPersonalView ? 'La mia scheda' : 'Workspace cliente'}
        subtitle={
          user
            ? `Stai gestendo ${user.fullName} con storico schede, check-in e assegnazione coach.`
            : 'Gestione completa del profilo selezionato.'
        }
        onLogout={handleLogout}
        hideMobileNavigation
        actions={
          <Link
            to={backLink}
            className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-2xl font-semibold w-full sm:w-auto text-center"
          >
            {backLabel}
          </Link>
        }
      >
        {detailQuery.isLoading || coachesQuery.isLoading ? (
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
            Caricamento workspace...
          </div>
        ) : detailQuery.isError || coachesQuery.isError ? (
          <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
            Errore nel caricamento del workspace utente.
          </div>
        ) : !detailQuery.data ? (
          <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
            Utente non trovato.
          </div>
        ) : (
          <div className="space-y-6">
            {generalError && (
              <div className="rounded-2xl px-4 py-3 text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                {generalError}
              </div>
            )}

            <div className="grid xl:grid-cols-[320px_minmax(0,1fr)] gap-4 md:gap-6">
              <div className="space-y-6">
                <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-zinc-200 shadow-sm text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-zinc-100 mx-auto flex items-center justify-center text-zinc-500 font-bold text-xl md:text-2xl mb-4">
                    {getInitials(detailQuery.data.user.fullName, detailQuery.data.user.email)}
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">{detailQuery.data.user.fullName}</h2>
                  <p className="text-zinc-500 text-sm mb-4">{detailQuery.data.user.email}</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        detailQuery.data.user.role === 'admin'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {detailQuery.data.user.role === 'admin' ? 'Coach / Admin' : 'Cliente'}
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                      {detailQuery.data.user.isActive ? 'Attivo' : 'Disabilitato'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-zinc-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-zinc-900">Dettagli gestione</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-zinc-100 pb-2 gap-3">
                      <span className="text-zinc-500">Creato il</span>
                      <span className="font-bold text-zinc-900 text-right">
                        {formatDate(detailQuery.data.user.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-2 gap-3">
                      <span className="text-zinc-500">Ultima pesata</span>
                      <span className="font-bold text-zinc-900 text-right">
                        {latestCheck ? `${latestCheck.weight} kg` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-zinc-500">Scheda corrente</span>
                      <span className="font-bold text-zinc-900 text-right">
                        {detailQuery.data.workouts.find((workout) => workout.isCurrent)?.name ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {detailQuery.data.user.role === 'customer' && (
                  <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-zinc-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold">
                      <Users size={18} /> Coach assegnato
                    </div>
                    <select
                      value={detailQuery.data.coach?.id ?? ''}
                      onChange={(event) =>
                        assignCoachMutation.mutate(event.target.value || null)
                      }
                      disabled={assignCoachMutation.isPending}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Nessun coach</option>
                      {(coachesQuery.data?.coaches ?? []).map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.fullName}
                        </option>
                      ))}
                    </select>
                    {detailQuery.data.coach ? (
                      <p className="text-sm text-zinc-500">
                        Attualmente assegnato a <span className="font-semibold text-zinc-900">{detailQuery.data.coach.fullName}</span>.
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-500">Nessun coach assegnato a questo cliente.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={summaryCardClass}>
                    <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
                      <FileText size={16} /> Versioni scheda
                    </div>
                    <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                      {detailQuery.data.workouts.length}
                    </p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
                      <Scale size={16} /> Ultimo check-in
                    </div>
                    <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                      {latestCheck ? `${latestCheck.weight}` : '-'}
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">
                      {latestCheck?.fat !== null && latestCheck?.fat !== undefined
                        ? `MG ${latestCheck.fat}%`
                        : 'Senza massa grassa'}
                    </p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
                      {detailQuery.data.user.role === 'admin' ? <Shield size={16} /> : <UserCircle size={16} />} 
                      Ruolo account
                    </div>
                    <p className="text-xl font-bold text-zinc-900 tracking-tight">
                      {detailQuery.data.user.role === 'admin' ? 'Coach / Admin' : 'Cliente'}
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">
                      {detailQuery.data.user.role === 'admin'
                        ? 'Può usare l\'app e gestire altri profili.'
                        : 'Profilo gestito dal backoffice.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5 md:p-6 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900">Schede</h3>
                      <p className="text-zinc-500 mt-1">
                        Crea nuove versioni, scegli quella corrente e modifica la struttura completa.
                      </p>
                    </div>
                    <button
                      onClick={() => createWorkoutMutation.mutate()}
                      disabled={createWorkoutMutation.isPending}
                      className="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
                    >
                      <Plus size={16} /> Nuova scheda
                    </button>
                  </div>

                  <div className="space-y-3">
                    {detailQuery.data.workouts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
                        Nessuna scheda presente. Crea la prima versione da qui.
                      </div>
                    ) : (
                      detailQuery.data.workouts.map((workout) => {
                        const isSelected = workout.id === effectiveSelectedPlanId;

                        return (
                          <button
                            key={workout.id}
                            onClick={() => setSelectedPlanId(workout.id)}
                            className={`w-full text-left p-5 rounded-2xl border transition ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-50/40 shadow-sm'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-zinc-900">{workout.name}</p>
                                  {workout.isCurrent ? (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                                      Corrente
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-sm text-zinc-500 mt-1">
                                  Aggiornata il {formatDateTime(workout.updatedAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
                                {!workout.isCurrent ? (
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700">
                                    Storico
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {selectedPlanSummary && !selectedPlanSummary.isCurrent && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => activateWorkoutMutation.mutate(selectedPlanSummary.id)}
                        disabled={activateWorkoutMutation.isPending}
                        className="bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-2xl font-bold disabled:opacity-50 w-full sm:w-auto"
                      >
                        {activateWorkoutMutation.isPending ? 'Pubblicazione...' : 'Imposta come corrente'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5 md:p-6 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900">Pesate e check-in</h3>
                      <p className="text-zinc-500 mt-1">
                        Storico peso e massa grassa collegato al profilo utente.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddWeightModalOpen(true)}
                      className="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                      <Plus size={16} /> Nuova pesata
                    </button>
                  </div>

                  <div className="rounded-[1.5rem] border border-zinc-200 overflow-hidden">
                    <div className="hidden md:grid grid-cols-[160px_1fr_1fr] gap-4 px-5 py-4 bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                      <div>Data</div>
                      <div className="text-right">Peso</div>
                      <div className="text-right">Massa grassa</div>
                    </div>
                    {detailQuery.data.checkins.length === 0 ? (
                      <div className="px-5 py-8 text-center text-zinc-500">Nessuna pesata registrata.</div>
                    ) : (
                      detailQuery.data.checkins.map((checkin) => (
                        <div
                          key={checkin.id}
                          className="grid md:grid-cols-[160px_1fr_1fr] gap-2 md:gap-4 px-5 py-4 border-b border-zinc-100 last:border-b-0 text-sm"
                        >
                          <div className="font-medium text-zinc-900">{formatDate(checkin.date)}</div>
                          <div className="md:text-right text-zinc-700 font-semibold">{checkin.weight} kg</div>
                          <div className="md:text-right text-zinc-500">
                            {checkin.fat !== null ? `${checkin.fat}%` : '-'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {workoutPlanQuery.isLoading ? (
              <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
                Caricamento editor scheda...
              </div>
            ) : workoutPlanQuery.isError ? (
              <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
                Errore nel caricamento della scheda selezionata.
              </div>
            ) : workoutPlanQuery.data?.plan ? (
              <AdminWorkoutPlanBuilder
                key={`${userId}:${workoutPlanQuery.data.plan.id}`}
                plan={workoutPlanQuery.data.plan}
                isSaving={saveMutation.isPending}
                saveError={saveError}
                saveOk={saveOk}
                onSave={(payload) => {
                  setSaveError(null);
                  setSaveOk(null);
                  saveMutation.mutate({
                    planId: workoutPlanQuery.data!.plan.id,
                    payload,
                  });
                }}
              />
            ) : null}
          </div>
        )}
      </AdminShell>

      {isAddWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/25 backdrop-blur-sm"
            onClick={() => setIsAddWeightModalOpen(false)}
          />
          <div className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-zinc-200 p-6 md:p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Nuova pesata</h2>
              <button
                onClick={() => setIsAddWeightModalOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={weightDate}
                  onChange={(event) => setWeightDate(event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightValue}
                    onChange={(event) => setWeightValue(event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Massa grassa %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={fatValue}
                    onChange={(event) => setFatValue(event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsAddWeightModalOpen(false)}
                className="px-5 py-3 rounded-2xl font-semibold text-zinc-600 hover:bg-zinc-100 w-full sm:w-auto"
              >
                Annulla
              </button>
              <button
                onClick={() =>
                  createCheckinMutation.mutate({
                    recordedAt: weightDate,
                    weight: Number(weightValue),
                    fat: fatValue ? Number(fatValue) : null,
                  })
                }
                disabled={createCheckinMutation.isPending}
                className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-2xl font-bold disabled:opacity-50 w-full sm:w-auto"
              >
                {createCheckinMutation.isPending ? 'Salvataggio...' : 'Salva pesata'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
