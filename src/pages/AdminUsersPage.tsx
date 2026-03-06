import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { logout } from '../lib/api/auth';
import { isApiError } from '../lib/api/client';
import { disableGoogleAutoSelect } from '../lib/auth/oauth-sdk';
import { adminUsersQueryOptions } from '../lib/api/query-options';
import { createAdminInvite } from '../lib/api/workout';
import { queryClient } from '../lib/query-client';
import type { UserRole } from '../types/auth';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const usersQuery = useQuery(adminUsersQueryOptions());

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('customer');
  const [inviteExpiry, setInviteExpiry] = useState(72);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<string | null>(null);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
      await navigate({ to: '/login' });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: createAdminInvite,
    onSuccess: async (data) => {
      setCreatedInvite(data.inviteUrl);
      setInviteError(null);
      setInviteEmail('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => {
      setInviteError(isApiError(err) ? err.message : 'Creazione invito fallita.');
    },
  });

  const sortedUsers = useMemo(
    () => [...(usersQuery.data?.users ?? [])].sort((a, b) => a.email.localeCompare(b.email)),
    [usersQuery.data?.users]
  );

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Backoffice Admin</h1>
            <p className="text-zinc-500">Gestione utenti e inviti</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin"
              className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl font-semibold"
            >
              Dashboard
            </Link>
            <Link
              to="/"
              className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl font-semibold"
            >
              App utente
            </Link>
            <button
              onClick={() => {
                disableGoogleAutoSelect();
                logoutMutation.mutate();
              }}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">Genera invito</h2>
          <div className="grid md:grid-cols-4 gap-3">
            <input
              type="email"
              placeholder="utente@email.com"
              className="md:col-span-2 rounded-xl border border-zinc-200 px-3 py-2"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <select
              className="rounded-xl border border-zinc-200 px-3 py-2"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as UserRole)}
            >
              <option value="customer">customer</option>
              <option value="admin">admin</option>
            </select>
            <input
              type="number"
              min={1}
              max={720}
              className="rounded-xl border border-zinc-200 px-3 py-2"
              value={inviteExpiry}
              onChange={(event) => setInviteExpiry(Number(event.target.value))}
            />
          </div>
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
            disabled={inviteMutation.isPending}
            onClick={() => {
              setInviteError(null);
              setCreatedInvite(null);
              inviteMutation.mutate({
                email: inviteEmail,
                role: inviteRole,
                expiresInHours: inviteExpiry,
              });
            }}
          >
            {inviteMutation.isPending ? 'Creazione...' : 'Crea invito'}
          </button>
          {inviteError && (
            <div className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl px-3 py-2">
              {inviteError}
            </div>
          )}
          {createdInvite && (
            <div className="text-sm text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 space-y-2">
              <div>Invito creato:</div>
              <div className="break-all text-zinc-900 font-medium">{createdInvite}</div>
              <button
                className="text-sm underline font-semibold"
                onClick={() => void navigator.clipboard.writeText(createdInvite)}
              >
                Copia link
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Utenti</h2>
          {usersQuery.isLoading && <p className="text-zinc-500">Caricamento utenti...</p>}
          {usersQuery.isError && (
            <p className="text-red-600">Errore nel caricamento utenti.</p>
          )}
          {!usersQuery.isLoading && !usersQuery.isError && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-zinc-200 text-zinc-500">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Ruolo</th>
                    <th className="py-2 pr-4">Stato</th>
                    <th className="py-2 pr-4">Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-100">
                      <td className="py-3 pr-4 text-zinc-900">{user.email}</td>
                      <td className="py-3 pr-4">{user.role}</td>
                      <td className="py-3 pr-4">
                        {user.is_active ? 'active' : 'disabled'}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          to="/admin/users/$userId/workout"
                          params={{ userId: user.id }}
                          className="font-semibold underline"
                        >
                          Modifica scheda
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
