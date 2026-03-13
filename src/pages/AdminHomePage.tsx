import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Calendar, FileText, Scale, Shield, Users } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import {
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
  const meQuery = useQuery(meQueryOptions());
  const usersQuery = useQuery(adminUsersQueryOptions());
  const personalDetailQuery = useQuery({
    ...adminUserDetailQueryOptions(meQuery.data?.user.id ?? ''),
    enabled: Boolean(meQuery.data?.user.id),
  });

  const currentUser = meQuery.data?.user;
  const visibleUsers = usersQuery.data?.users ?? [];
  const visibleClients = visibleUsers.filter((user) => user.userType === 'client');
  const visibleCoaches = visibleUsers.filter((user) => user.userType === 'coach');
  const invitedUsers = visibleUsers.filter((user) => user.status === 'invited');
  const latestCheck = personalDetailQuery.data?.checkins[0] ?? null;
  const currentWorkout =
    personalDetailQuery.data?.workouts.find((workout) => workout.isCurrent) ?? null;

  const title = currentUser?.isAdmin ? 'Dashboard Admin' : 'Dashboard Coach';
  const subtitle = currentUser?.isAdmin
    ? 'Gestisci coach, clienti invitati e schede personali dallo stesso workspace.'
    : 'Gestisci i clienti assegnati e usa lo stesso account per la tua scheda personale.';

  return (
    <AdminShell section="dashboard" title={title} subtitle={subtitle} onLogout={handleLogout}>
      <div className="grid xl:grid-cols-[minmax(0,1.3fr)_360px] gap-6">
        <div className="space-y-6">
          <div className="bg-zinc-950 text-white rounded-[2rem] p-6 md:p-7 shadow-xl shadow-zinc-900/10">
            <div className="inline-flex items-center gap-2 bg-zinc-900 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              <Shield size={14} /> {currentUser?.isAdmin ? 'Admin' : 'Coach'}
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Workspace manager</h2>
            <p className="text-zinc-300 max-w-2xl">
              {currentUser?.isAdmin
                ? 'Crea utenti invitati, assegna coach ai clienti e prepara schede anche prima del primo accesso.'
                : 'Hai accesso ai clienti assegnati e alla tua scheda personale senza cambiare account.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/admin/users"
                className="bg-emerald-400 text-zinc-950 px-4 py-3 rounded-2xl font-bold inline-flex items-center gap-2"
              >
                <Users size={16} /> Apri lista utenti
              </Link>
              {currentUser && (
                <Link
                  to="/admin/users/$userId/workout"
                  params={{ userId: currentUser.id }}
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
                Utenti visibili
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{visibleUsers.length}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Clienti
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{visibleClients.length}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Coach visibili
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{visibleCoaches.length}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Invitati
              </p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{invitedUsers.length}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Link to="/admin/users" className={quickCardClass}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Users size={22} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Utenti e inviti</h3>
              <p className="text-zinc-500 mt-2">
                Cerca utenti per tipo, stato o coach assegnato e apri il loro workspace completo.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-zinc-900">
                Vai alla lista <ArrowRight size={16} />
              </span>
            </Link>

            {currentUser && (
              <Link
                to="/admin/users/$userId/workout"
                params={{ userId: currentUser.id }}
                className={quickCardClass}
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-4">
                  <FileText size={22} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Account personale</h3>
                <p className="text-zinc-500 mt-2">
                  Modifica la tua scheda, controlla lo storico workout e verifica l’esperienza utente finale.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-zinc-900">
                  Apri la mia scheda <ArrowRight size={16} />
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Account personale</p>
              <h3 className="text-xl font-bold text-zinc-900 mt-1">
                {currentUser?.fullName ?? currentUser?.email ?? 'Manager'}
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
                <Calendar size={16} /> Stato personale
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Tipo</span>
                  <span className="font-semibold text-zinc-900">
                    {currentUser?.isAdmin ? 'Admin' : currentUser?.userType === 'coach' ? 'Coach' : 'Cliente'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Stato</span>
                  <span className="font-semibold text-zinc-900">{currentUser?.status ?? '-'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Area manager</span>
                  <span className="font-semibold text-zinc-900">
                    {currentUser?.canManageClients ? 'Abilitata' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};
