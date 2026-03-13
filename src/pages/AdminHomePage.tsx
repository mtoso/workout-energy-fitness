import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Award, Calendar, FileText, Scale, Shield, Users } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import {
  adminCoachesQueryOptions,
  adminUserDetailQueryOptions,
  adminUsersQueryOptions,
  meQueryOptions,
} from '../lib/api/query-options';
import { useAdminLogout } from '../hooks/useAdminLogout';

const statCardClass = 'bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm';
const quickCardClass =
  'bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const AdminHomePage = () => {
  const { handleLogout } = useAdminLogout();
  const usersQuery = useQuery(adminUsersQueryOptions());
  const coachesQuery = useQuery(adminCoachesQueryOptions());
  const meQuery = useQuery(meQueryOptions());
  const personalDetailQuery = useQuery({
    ...adminUserDetailQueryOptions(meQuery.data?.user.id ?? ''),
    enabled: Boolean(meQuery.data?.user.id),
  });

  const users = usersQuery.data?.users ?? [];
  const coaches = coachesQuery.data?.coaches ?? [];
  const totalUsers = users.length;
  const customerUsers = users.filter((user) => user.role === 'customer').length;
  const assignedCustomers = users.filter((user) => user.role === 'customer' && user.coach).length;
  const latestCheck = personalDetailQuery.data?.checkins[0] ?? null;
  const currentWorkout =
    personalDetailQuery.data?.workouts.find((workout) => workout.isCurrent) ?? null;

  return (
    <AdminShell
      section="dashboard"
      title="Dashboard Admin"
      subtitle="Panoramica rapida di clienti, coach e schede attive con dati reali del backoffice."
      onLogout={handleLogout}
    >
      <div className="grid xl:grid-cols-[minmax(0,1.3fr)_360px] gap-6">
        <div className="space-y-6">
          <div className="bg-zinc-950 text-white rounded-[2rem] p-6 md:p-7 shadow-xl shadow-zinc-900/10">
            <div className="inline-flex items-center gap-2 bg-zinc-900 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              <Shield size={14} /> Modalita Admin
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Workspace coach e clienti</h2>
            <p className="text-zinc-300 max-w-2xl">
              Gestisci utenti, inviti, check-in fisici e versioni delle schede da un unico punto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/admin/users"
                className="bg-emerald-400 text-zinc-950 px-4 py-3 rounded-2xl font-bold inline-flex items-center gap-2"
              >
                <Users size={16} /> Apri lista clienti
              </Link>
              <Link
                to="/admin/coaches"
                className="bg-white/10 text-white px-4 py-3 rounded-2xl font-semibold inline-flex items-center gap-2"
              >
                <Award size={16} /> Apri team coach
              </Link>
              {meQuery.data?.user && (
                <Link
                  to="/admin/users/$userId/workout"
                  params={{ userId: meQuery.data.user.id }}
                  className="bg-white/10 text-white px-4 py-3 rounded-2xl font-semibold inline-flex items-center gap-2"
                >
                  <FileText size={16} /> Vai alla mia scheda
                </Link>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className={statCardClass}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Utenti totali
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{totalUsers}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Customer
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{customerUsers}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Coach attivi
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{coaches.length}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Clienti assegnati
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{assignedCustomers}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Link to="/admin/users" className={quickCardClass}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Users size={22} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Clienti e inviti</h3>
              <p className="text-zinc-500 mt-2">
                Cerca clienti, assegna coach e apri il loro storico completo di schede e pesate.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-zinc-900">
                Vai alla lista <ArrowRight size={16} />
              </span>
            </Link>

            <Link to="/admin/coaches" className={quickCardClass}>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Award size={22} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Team coach</h3>
              <p className="text-zinc-500 mt-2">
                Invita nuovi coach e controlla quanti clienti sono assegnati a ciascun profilo admin.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-zinc-900">
                Apri team coach <ArrowRight size={16} />
              </span>
            </Link>

            {meQuery.data?.user && (
              <Link
                to="/admin/users/$userId/workout"
                params={{ userId: meQuery.data.user.id }}
                className={quickCardClass}
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-4">
                  <FileText size={22} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Account personale</h3>
                <p className="text-zinc-500 mt-2">
                  Modifica la tua scheda e verifica l'esperienza cliente senza cambiare account.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-zinc-900">
                  Apri la mia scheda <ArrowRight size={16} />
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Team coach
                </p>
                <h3 className="text-xl font-bold text-zinc-900">Coach attivi</h3>
              </div>
            </div>
            <div className="space-y-3">
              {coaches.length === 0 ? (
                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-5 text-sm text-zinc-500">
                  Nessun coach disponibile.
                </div>
              ) : (
                coaches.slice(0, 5).map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-center justify-between gap-3 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3"
                  >
                    <div>
                      <p className="font-bold text-zinc-900">{coach.fullName}</p>
                      <p className="text-sm text-zinc-500">{coach.email}</p>
                    </div>
                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-600">
                      {coach.assignedCustomerCount} clienti
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Account personale
              </p>
              <h3 className="text-xl font-bold text-zinc-900 mt-1">
                {meQuery.data?.user.email ?? 'Admin'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                  <Scale size={16} /> Ultimo check
                </div>
                <p className="text-2xl font-bold text-zinc-900 tracking-tight">
                  {latestCheck ? `${latestCheck.weight} kg` : '-'}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {latestCheck?.fat !== null && latestCheck?.fat !== undefined
                    ? `MG ${latestCheck.fat}%`
                    : 'Nessun dato MG'}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                  <FileText size={16} /> Scheda corrente
                </div>
                <p className="text-lg font-bold text-zinc-900 leading-tight">
                  {currentWorkout?.name ?? 'Nessuna'}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {currentWorkout ? formatDate(currentWorkout.updatedAt) : '-'}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-zinc-50 border border-zinc-100 p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-3">
                <Calendar size={16} /> Storico schede recente
              </div>
              <div className="space-y-3">
                {personalDetailQuery.isLoading ? (
                  <p className="text-sm text-zinc-500">Caricamento storico...</p>
                ) : personalDetailQuery.data?.workouts.length ? (
                  personalDetailQuery.data.workouts.slice(0, 4).map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{workout.name}</p>
                        <p className="text-sm text-zinc-500">{formatDate(workout.updatedAt)}</p>
                      </div>
                      {workout.isCurrent ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                          Corrente
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">Nessuna scheda disponibile.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};
