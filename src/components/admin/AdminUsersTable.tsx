import { ChevronRight, UserCircle } from 'lucide-react';
import type { AdminUserSummary } from '../../types/admin';

interface AdminUsersTableProps {
  users: AdminUserSummary[];
  onOpenUser: (userId: string) => void;
}

const getInitials = (fullName: string, email: string) => {
  const source = fullName.trim() || email.split('@')[0] || 'Utente';

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('') || 'U';
};

const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const AdminUsersTable = ({ users, onOpenUser }: AdminUsersTableProps) => {
  if (users.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-[2rem] p-10 text-center text-zinc-500">
        Nessun cliente trovato con i filtri attuali.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
      <div className="hidden lg:grid grid-cols-[minmax(0,1.8fr)_180px_140px_110px] gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-50 border-b border-zinc-200">
        <div>Cliente</div>
        <div>Coach</div>
        <div>Creato</div>
        <div className="text-right">Azione</div>
      </div>

      <div>
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onOpenUser(user.id)}
            className="w-full text-left px-5 md:px-6 py-4 border-b border-zinc-100 last:border-b-0 hover:bg-emerald-50/40 transition"
          >
            <div className="lg:grid lg:grid-cols-[minmax(0,1.8fr)_180px_140px_110px] lg:gap-4 items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold shrink-0">
                  {getInitials(user.fullName, user.email)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 truncate">{user.fullName}</p>
                  <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="mt-3 lg:mt-0 flex items-center gap-2 text-sm">
                {user.coach ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-semibold max-w-full truncate">
                    <UserCircle size={14} /> {user.coach.fullName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full font-semibold">
                    Nessun coach
                  </span>
                )}
              </div>

              <div className="mt-2 lg:mt-0 text-sm font-medium text-zinc-600">
                {formatCreatedAt(user.createdAt)}
              </div>

              <div className="mt-3 lg:mt-0 flex items-center justify-between lg:justify-end text-sm font-semibold text-zinc-700">
                <span>{user.isActive ? 'Attivo' : 'Disabilitato'}</span>
                <ChevronRight size={18} className="text-zinc-300 lg:ml-2" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
