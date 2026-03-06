import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, FilePenLine, LogOut, Shield, Users } from 'lucide-react';
import { logout } from '../lib/api/auth';
import { disableGoogleAutoSelect } from '../lib/auth/oauth-sdk';
import { meQueryOptions } from '../lib/api/query-options';
import { queryClient } from '../lib/query-client';

const actionCardClass =
  'bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3';

export const AdminHomePage = () => {
  const navigate = useNavigate();
  const meQuery = useQuery(meQueryOptions());

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['workout'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
      await navigate({ to: '/login' });
    },
  });

  const user = meQuery.data?.user;

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-zinc-900 text-white rounded-[2rem] p-6 shadow-lg shadow-zinc-900/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-zinc-800/80 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                <Shield size={14} /> Modalita Admin
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Admin</h1>
              <p className="text-zinc-300 max-w-2xl">
                Gestisci utenti e schede senza uscire dal tuo account. Quando vuoi,
                puoi tornare subito all'app utente.
              </p>
            </div>
            <button
              onClick={() => {
                disableGoogleAutoSelect();
                logoutMutation.mutate();
              }}
              className="shrink-0 bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <button
              onClick={() => {
                void navigate({ to: '/' });
              }}
              className="bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl font-bold"
            >
              Vai all'app utente
            </button>
            <button
              onClick={() => {
                void navigate({ to: '/admin/users' });
              }}
              className="bg-zinc-800 text-white px-4 py-2.5 rounded-xl font-semibold"
            >
              Gestisci utenti
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/admin/users" className={actionCardClass}>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Utenti e inviti</h2>
              <p className="text-zinc-500 mt-1">
                Crea inviti, controlla i ruoli e apri l'editor delle schede.
              </p>
            </div>
            <div className="mt-auto inline-flex items-center gap-2 font-semibold text-zinc-900">
              Apri sezione <ArrowRight size={16} />
            </div>
          </Link>

          {user ? (
            <Link
              to="/admin/users/$userId/workout"
              params={{ userId: user.id }}
              className={actionCardClass}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FilePenLine size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">La mia scheda</h2>
                <p className="text-zinc-500 mt-1">
                  Apri l'editor della tua scheda personale usando il tuo account admin.
                </p>
              </div>
              <div className="mt-auto inline-flex items-center gap-2 font-semibold text-zinc-900">
                Modifica la mia scheda <ArrowRight size={16} />
              </div>
            </Link>
          ) : (
            <div className={`${actionCardClass} opacity-60`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FilePenLine size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">La mia scheda</h2>
                <p className="text-zinc-500 mt-1">
                  Caricamento del tuo profilo admin in corso.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
