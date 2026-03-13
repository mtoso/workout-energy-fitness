import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Search, UserCircle, Users } from 'lucide-react';
import { AdminInviteModal } from '../components/admin/AdminInviteModal';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { isApiError } from '../lib/api/client';
import {
  adminCoachesQueryOptions,
  adminUsersQueryOptions,
  meQueryOptions,
} from '../lib/api/query-options';
import { createAdminUser } from '../lib/api/workout';
import { queryClient } from '../lib/query-client';
import type { AdminUserSummary } from '../types/admin';
import type { UserStatus, UserType } from '../types/auth';
import { useAdminLogout } from '../hooks/useAdminLogout';

const statCardClass = 'bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm';
const EMPTY_USERS: AdminUserSummary[] = [];

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAdminLogout();
  const meQuery = useQuery(meQueryOptions());
  const usersQuery = useQuery(adminUsersQueryOptions());
  const isAdmin = meQuery.data?.user.isAdmin ?? false;
  const coachesQuery = useQuery({
    ...adminCoachesQueryOptions(),
    enabled: isAdmin,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterUserType, setFilterUserType] = useState<'all' | UserType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');
  const [filterCoachUserId, setFilterCoachUserId] = useState<'all' | string>('all');

  const [userEmail, setUserEmail] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userType, setUserType] = useState<UserType>('client');
  const [inviteCoachUserId, setInviteCoachUserId] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState(72);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async (data) => {
      setCreatedInvite(data.inviteUrl);
      setInviteError(null);
      setUserEmail('');
      setUserFullName('');
      setUserType('client');
      setInviteCoachUserId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'coaches'] }),
      ]);
    },
    onError: (error) => {
      setInviteError(isApiError(error) ? error.message : 'Creazione utente non riuscita.');
    },
  });

  const users = usersQuery.data?.users ?? EMPTY_USERS;
  const coaches = coachesQuery.data?.coaches ?? [];

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (filterUserType !== 'all' && user.userType !== filterUserType) {
        return false;
      }

      if (filterStatus !== 'all' && user.status !== filterStatus) {
        return false;
      }

      if (filterCoachUserId !== 'all') {
        if (user.userType !== 'client') return false;
        if ((user.coach?.id ?? '') !== filterCoachUserId) return false;
      }

      if (!query) return true;

      return (
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.userType.toLowerCase().includes(query) ||
        user.coach?.fullName.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery, filterUserType, filterStatus, filterCoachUserId]);

  const visibleClients = users.filter((user) => user.userType === 'client').length;
  const visibleCoaches = users.filter((user) => user.userType === 'coach').length;
  const visibleInvited = users.filter((user) => user.status === 'invited').length;

  const pageTitle = isAdmin ? 'Utenti' : 'I tuoi clienti';
  const pageSubtitle = isAdmin
    ? 'Lista unificata di coach e clienti. Crea utenti invitati e filtra per coach, tipo o stato.'
    : 'Clienti assegnati al tuo profilo coach. Apri il loro profilo e gestisci schede e check-in.';

  return (
    <>
      <AdminShell
        section="users"
        title={pageTitle}
        subtitle={pageSubtitle}
        onLogout={handleLogout}
        actions={
          isAdmin ? (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-2xl font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus size={16} /> <span className="sm:hidden">Nuovo</span><span className="hidden sm:inline">Nuovo utente</span>
            </button>
          ) : undefined
        }
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <div className={statCardClass}>
            <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
              <Users size={16} /> Utenti visibili
            </div>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight">{users.length}</p>
          </div>
          <div className={statCardClass}>
            <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
              <UserCircle size={16} /> Clienti / Coach
            </div>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight">
              {visibleClients} / {visibleCoaches}
            </p>
          </div>
          <div className={statCardClass}>
            <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
              <Users size={16} /> Invitati
            </div>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight">{visibleInvited}</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[2rem] p-4 md:p-5 shadow-sm space-y-4">
          <div className="relative max-w-md">
            <label htmlFor="admin-users-search" className="sr-only">
              Cerca utenti
            </label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              id="admin-users-search"
              name="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cerca per nome, email, tipo o coach..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <label htmlFor="admin-users-filter-type" className="sr-only">
              Filtra per tipo utente
            </label>
            <select
              id="admin-users-filter-type"
              name="userTypeFilter"
              value={filterUserType}
              onChange={(event) => setFilterUserType(event.target.value as 'all' | UserType)}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tutti i tipi</option>
              <option value="client">Clienti</option>
              <option value="coach">Coach</option>
            </select>

            <label htmlFor="admin-users-filter-status" className="sr-only">
              Filtra per stato
            </label>
            <select
              id="admin-users-filter-status"
              name="statusFilter"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as 'all' | UserStatus)}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="invited">Invitati</option>
              <option value="disabled">Disabilitati</option>
            </select>

            <label htmlFor="admin-users-filter-coach" className="sr-only">
              Filtra per coach
            </label>
            <select
              id="admin-users-filter-coach"
              name="coachFilter"
              value={filterCoachUserId}
              onChange={(event) => setFilterCoachUserId(event.target.value as 'all' | string)}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!isAdmin}
            >
              <option value="all">Tutti i coach</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {usersQuery.isLoading || (isAdmin && coachesQuery.isLoading) ? (
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
            Caricamento utenti...
          </div>
        ) : usersQuery.isError || (isAdmin && coachesQuery.isError) ? (
          <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
            Errore nel caricamento degli utenti.
          </div>
        ) : (
          <AdminUsersTable
            users={filteredUsers}
            onOpenUser={(userId) => {
              void navigate({
                to: '/admin/users/$userId',
                params: { userId },
              });
            }}
          />
        )}
      </AdminShell>

      {isAdmin && (
        <AdminInviteModal
          userType={userType}
          isOpen={isInviteModalOpen}
          fullName={userFullName}
          email={userEmail}
          coachUserId={inviteCoachUserId}
          expiresInHours={inviteExpiry}
          error={inviteError}
          inviteUrl={createdInvite}
          isPending={createUserMutation.isPending}
          coaches={coaches}
          onClose={() => setIsInviteModalOpen(false)}
          onUserTypeChange={(value) => {
            setUserType(value);
            if (value === 'coach') {
              setInviteCoachUserId(null);
            }
          }}
          onFullNameChange={setUserFullName}
          onEmailChange={setUserEmail}
          onCoachUserIdChange={setInviteCoachUserId}
          onExpiryChange={setInviteExpiry}
          onSubmit={() => {
            setInviteError(null);
            setCreatedInvite(null);
            createUserMutation.mutate({
              email: userEmail,
              fullName: userFullName,
              userType,
              coachUserId: userType === 'client' ? inviteCoachUserId : null,
              expiresInHours: inviteExpiry,
            });
          }}
        />
      )}
    </>
  );
};
