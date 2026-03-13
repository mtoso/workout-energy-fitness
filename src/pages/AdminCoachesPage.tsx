import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Award, ChevronRight, Plus, Search, Users } from 'lucide-react';
import { AdminInviteModal } from '../components/admin/AdminInviteModal';
import { AdminShell } from '../components/admin/AdminShell';
import { isApiError } from '../lib/api/client';
import {
  adminCoachesQueryOptions,
  adminUsersQueryOptions,
} from '../lib/api/query-options';
import { createAdminInvite } from '../lib/api/workout';
import { queryClient } from '../lib/query-client';
import { useAdminLogout } from '../hooks/useAdminLogout';
import type { AdminCoachSummary } from '../types/admin';

const statCardClass = 'bg-white border border-zinc-200 rounded-[2rem] p-5 shadow-sm';
const EMPTY_COACHES: AdminCoachSummary[] = [];

const getInitials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('') || 'CO';

export const AdminCoachesPage = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAdminLogout();
  const coachesQuery = useQuery(adminCoachesQueryOptions());
  const usersQuery = useQuery(adminUsersQueryOptions());

  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteExpiry, setInviteExpiry] = useState(72);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: createAdminInvite,
    onSuccess: async (data) => {
      setCreatedInvite(data.inviteUrl);
      setInviteError(null);
      setInviteEmail('');
      setInviteFullName('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'coaches'] }),
      ]);
    },
    onError: (error) => {
      setInviteError(isApiError(error) ? error.message : 'Creazione invito fallita.');
    },
  });

  const coaches = coachesQuery.data?.coaches ?? EMPTY_COACHES;
  const users = usersQuery.data?.users ?? [];
  const filteredCoaches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return coaches;

    return coaches.filter(
      (coach) =>
        coach.fullName.toLowerCase().includes(query) || coach.email.toLowerCase().includes(query)
    );
  }, [coaches, searchQuery]);

  const totalAssignedCustomers = coaches.reduce(
    (count, coach) => count + coach.assignedCustomerCount,
    0
  );
  const adminCount = users.filter((user) => user.role === 'admin').length;

  return (
    <>
      <AdminShell
        section="coaches"
        title="Team Coach"
        subtitle="Gestisci gli admin che possono creare schede e usare anche l'app come clienti."
        onLogout={handleLogout}
        actions={
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-2xl font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={16} /> <span className="sm:hidden">Nuovo</span><span className="hidden sm:inline">Nuovo coach</span>
          </button>
        }
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <div className={statCardClass}>
            <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
              <Award size={16} /> Coach attivi
            </div>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight">{coaches.length}</p>
          </div>
          <div className={statCardClass}>
            <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
              <Users size={16} /> Clienti assegnati
            </div>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight">{totalAssignedCustomers}</p>
          </div>
          <div className={statCardClass}>
            <div className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-3">
              <Award size={16} /> Account admin
            </div>
            <p className="text-3xl font-bold text-zinc-900 tracking-tight">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[2rem] p-4 md:p-5 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cerca per nome o email..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {coachesQuery.isLoading || usersQuery.isLoading ? (
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
            Caricamento coach...
          </div>
        ) : coachesQuery.isError || usersQuery.isError ? (
          <div className="bg-red-100 border border-red-200 rounded-[2rem] p-10 text-center text-red-700">
            Errore nel caricamento del team coach.
          </div>
        ) : filteredCoaches.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
            Nessun coach trovato con i filtri attuali.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filteredCoaches.map((coach) => (
              <button
                key={coach.id}
                onClick={() => {
                  void navigate({
                    to: '/admin/users/$userId/workout',
                    params: { userId: coach.id },
                  });
                }}
                className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm px-5 py-5 text-left hover:border-emerald-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      {getInitials(coach.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 truncate">{coach.fullName}</p>
                      <p className="text-sm text-zinc-500 truncate">{coach.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-300 shrink-0" />
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Clienti assegnati
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">
                      {coach.assignedCustomerCount}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold">
                    Coach / Admin
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </AdminShell>

      <AdminInviteModal
        mode="coach"
        isOpen={isInviteModalOpen}
        fullName={inviteFullName}
        email={inviteEmail}
        coachUserId={null}
        expiresInHours={inviteExpiry}
        error={inviteError}
        inviteUrl={createdInvite}
        isPending={inviteMutation.isPending}
        onClose={() => setIsInviteModalOpen(false)}
        onFullNameChange={setInviteFullName}
        onEmailChange={setInviteEmail}
        onCoachUserIdChange={() => undefined}
        onExpiryChange={setInviteExpiry}
        onSubmit={() => {
          setInviteError(null);
          setCreatedInvite(null);
          inviteMutation.mutate({
            email: inviteEmail,
            role: 'admin',
            fullName: inviteFullName,
            expiresInHours: inviteExpiry,
          });
        }}
      />
    </>
  );
};
