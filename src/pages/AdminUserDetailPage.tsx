import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ChevronLeft, FileText, Plus, Scale, Shield, UserCircle, Users, X } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { isApiError } from '../lib/api/client';
import {
  adminCoachesQueryOptions,
  adminUserDetailQueryOptions,
  meQueryOptions,
} from '../lib/api/query-options';
import {
  assignAdminUserCoach,
  createAdminCheckin,
  createAdminUserWorkout,
} from '../lib/api/workout';
import { queryClient } from '../lib/query-client';
import { useAdminLogout } from '../hooks/useAdminLogout';

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

const userTypeLabel = (userType: 'client' | 'coach') => (userType === 'coach' ? 'Coach' : 'Cliente');
const statusLabel = (status: 'invited' | 'active' | 'disabled') =>
  status === 'invited' ? 'Invitato' : status === 'disabled' ? 'Disabilitato' : 'Attivo';

export const AdminUserDetailPage = () => {
  const params = useParams({ from: '/admin/users/$userId' });
  const userId = params.userId;
  const navigate = useNavigate();
  const { handleLogout } = useAdminLogout();

  const meQuery = useQuery(meQueryOptions());
  const detailQuery = useQuery(adminUserDetailQueryOptions(userId));
  const isAdmin = meQuery.data?.user.isAdmin ?? false;
  const coachesQuery = useQuery({
    ...adminCoachesQueryOptions(),
    enabled: isAdmin,
  });

  const isPersonalView = meQuery.data?.user.id === userId;

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isAddWeightModalOpen, setIsAddWeightModalOpen] = useState(false);
  const [weightDate, setWeightDate] = useState(toDateInputValue(new Date()));
  const [weightValue, setWeightValue] = useState('');
  const [fatValue, setFatValue] = useState('');

  const upsertDetailCache = (detail: NonNullable<typeof detailQuery.data>) => {
    queryClient.setQueryData(['admin', 'user-detail', userId], detail);
  };

  const createWorkoutMutation = useMutation({
    mutationFn: () => createAdminUserWorkout(userId, detailQuery.data?.workouts[0]?.id ?? null),
    onSuccess: async (data) => {
      setGeneralError(null);
      queryClient.setQueryData(['admin', 'workout-plan', userId, data.plan.id], data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', userId] });
      void navigate({
        to: '/admin/users/$userId/workouts/$planId',
        params: { userId, planId: data.plan.id },
      });
    },
    onError: (error) => {
      setGeneralError(isApiError(error) ? error.message : 'Creazione della scheda non riuscita.');
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
      setGeneralError(isApiError(error) ? error.message : 'Aggiornamento del coach non riuscito.');
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
      setGeneralError(isApiError(error) ? error.message : 'Salvataggio del check-in non riuscito.');
    },
  });

  const user = detailQuery.data?.user;
  const latestCheck = detailQuery.data?.checkins[0] ?? null;
  const canAssignCoach = Boolean(isAdmin && detailQuery.data?.user.userType === 'client');
  const section = isPersonalView ? 'personal' : 'users';
  const title = user?.fullName ?? (isPersonalView ? 'Il mio profilo' : 'Profilo utente');
  const eyebrow = isPersonalView
    ? 'Area personale'
    : user?.userType === 'coach'
      ? 'Profilo coach'
      : 'Profilo cliente';
  const subtitle = user
    ? isPersonalView
      ? 'Scheda personale, storico check-in e versioni salvate.'
      : 'Schede, check-in e assegnazione del coach dell’utente selezionato.'
    : 'Gestione completa del profilo selezionato.';

  return (
    <>
      <AdminShell
        section={section}
        title={title}
        eyebrow={eyebrow}
        subtitle={subtitle}
        leading={
          !isPersonalView ? (
            <Link
              to="/admin/users"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
              aria-label="Torna utenti"
            >
              <ChevronLeft size={22} />
            </Link>
          ) : undefined
        }
        onLogout={handleLogout}
      >
        {detailQuery.isLoading || (isAdmin && coachesQuery.isLoading) ? (
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
            Caricamento profilo...
          </div>
        ) : detailQuery.isError || (isAdmin && coachesQuery.isError) ? (
          <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
            Errore nel caricamento del profilo utente.
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
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">
                      {userTypeLabel(detailQuery.data.user.userType)}
                    </span>
                    {detailQuery.data.user.isAdmin ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                        Admin
                      </span>
                    ) : null}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        detailQuery.data.user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800'
                          : detailQuery.data.user.status === 'invited'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {statusLabel(detailQuery.data.user.status)}
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
                      <span className="text-zinc-500">Ultimo login</span>
                      <span className="font-bold text-zinc-900 text-right">
                        {formatDateTime(detailQuery.data.user.lastLoginAt)}
                      </span>
                    </div>
                    {detailQuery.data.user.status === 'invited' && (
                      <div className="flex justify-between border-b border-zinc-100 pb-2 gap-3">
                        <span className="text-zinc-500">Scadenza invito</span>
                        <span className="font-bold text-zinc-900 text-right">
                          {formatDateTime(detailQuery.data.user.inviteExpiresAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-zinc-500">Scheda corrente</span>
                      <span className="font-bold text-zinc-900 text-right">
                        {detailQuery.data.workouts.find((workout) => workout.isCurrent)?.name ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {canAssignCoach && (
                  <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-zinc-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold">
                      <Users size={18} /> Coach assegnato
                    </div>
                    <label htmlFor="assigned-coach-select" className="sr-only">
                      Coach assegnato
                    </label>
                    <select
                      id="assigned-coach-select"
                      name="coachUserId"
                      value={detailQuery.data.coach?.id ?? ''}
                      onChange={(event) => assignCoachMutation.mutate(event.target.value || null)}
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
                        Attualmente assegnato a{' '}
                        <span className="font-semibold text-zinc-900">{detailQuery.data.coach.fullName}</span>.
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
                      {detailQuery.data.user.isAdmin ? <Shield size={16} /> : <UserCircle size={16} />}
                      Profilo
                    </div>
                    <p className="text-xl font-bold text-zinc-900 tracking-tight">
                      {detailQuery.data.user.isAdmin ? 'Admin' : userTypeLabel(detailQuery.data.user.userType)}
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">
                      {detailQuery.data.user.userType === 'coach'
                        ? 'Può gestire clienti assegnati e usare la propria app personale.'
                        : 'Usa l’app personale e riceve le schede assegnate.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5 md:p-6 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900">Schede</h3>
                      <p className="text-zinc-500 mt-1">
                        Crea nuove versioni e apri l’editor dedicato per modificarle o pubblicarle.
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
                      detailQuery.data.workouts.map((workout) => (
                        <button
                          key={workout.id}
                          onClick={() => {
                            void navigate({
                              to: '/admin/users/$userId/workouts/$planId',
                              params: { userId, planId: workout.id },
                            });
                          }}
                          className="w-full text-left p-5 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-white transition"
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
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-sm font-semibold shrink-0">
                              Apri editor
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5 md:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900">Check-in</h3>
                      <p className="text-zinc-500 mt-1">Registra peso e massa grassa per tenere traccia dei progressi.</p>
                    </div>
                    <button
                      onClick={() => setIsAddWeightModalOpen(true)}
                      className="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Plus size={16} /> Nuovo check-in
                    </button>
                  </div>

                  <div className="space-y-3">
                    {detailQuery.data.checkins.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
                        Nessun check-in registrato.
                      </div>
                    ) : (
                      detailQuery.data.checkins.map((checkin) => (
                        <div
                          key={checkin.id}
                          className="rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-4 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-zinc-900">{formatDate(checkin.date)}</p>
                            <p className="text-sm text-zinc-500">
                              {checkin.fat === null ? 'Senza massa grassa' : `MG ${checkin.fat}%`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-zinc-900">{checkin.weight} kg</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminShell>

      {isAddWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
          <div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm pointer-events-auto transition-opacity"
            onClick={() => setIsAddWeightModalOpen(false)}
          />
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl pointer-events-auto relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Nuovo check-in</h2>
              <button
                onClick={() => setIsAddWeightModalOpen(false)}
                className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="checkin-date" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Data</label>
                <input
                  id="checkin-date"
                  name="recordedAt"
                  type="date"
                  value={weightDate}
                  onChange={(event) => setWeightDate(event.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-medium text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkin-weight" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Peso (Kg)</label>
                  <input
                    id="checkin-weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    placeholder="es. 85.5"
                    value={weightValue}
                    onChange={(event) => setWeightValue(event.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-medium text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="checkin-fat" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Grasso % <span className="font-normal normal-case text-zinc-400">(Opz.)</span>
                  </label>
                  <input
                    id="checkin-fat"
                    name="fat"
                    type="number"
                    step="0.1"
                    placeholder="es. 15.2"
                    value={fatValue}
                    onChange={(event) => setFatValue(event.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-medium text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsAddWeightModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition w-full sm:w-auto"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  const weight = Number(weightValue);
                  const fat = fatValue ? Number(fatValue) : null;
                  createCheckinMutation.mutate({ recordedAt: weightDate, weight, fat });
                }}
                disabled={createCheckinMutation.isPending || !weightValue}
                className="w-full sm:w-auto bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:hover:bg-emerald-500 flex items-center justify-center gap-2"
              >
                Salva check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
