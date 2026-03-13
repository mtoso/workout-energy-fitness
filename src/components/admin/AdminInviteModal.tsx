import { Copy, Mail, UserPlus, X } from 'lucide-react';
import type { AdminCoachSummary } from '../../types/admin';
import type { UserType } from '../../types/auth';

interface AdminInviteModalProps {
  userType: UserType;
  isOpen: boolean;
  fullName: string;
  email: string;
  coachUserId: string | null;
  expiresInHours: number;
  error: string | null;
  inviteUrl: string | null;
  isPending: boolean;
  coaches?: AdminCoachSummary[];
  onClose: () => void;
  onUserTypeChange: (value: UserType) => void;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onCoachUserIdChange: (value: string | null) => void;
  onExpiryChange: (value: number) => void;
  onSubmit: () => void;
}

export const AdminInviteModal = ({
  userType,
  isOpen,
  fullName,
  email,
  coachUserId,
  expiresInHours,
  error,
  inviteUrl,
  isPending,
  coaches = [],
  onClose,
  onUserTypeChange,
  onFullNameChange,
  onEmailChange,
  onCoachUserIdChange,
  onExpiryChange,
  onSubmit,
}: AdminInviteModalProps) => {
  if (!isOpen) return null;

  const isCoachUser = userType === 'coach';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-zinc-200 p-6 md:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
              <UserPlus size={14} /> Nuovo utente
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Crea utente invitato
            </h2>
            <p className="text-zinc-500 mt-1">
              Il record utente viene creato subito in stato <span className="font-semibold">invited</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Tipo utente
            </label>
            <select
              value={userType}
              onChange={(event) => onUserTypeChange(event.target.value === 'coach' ? 'coach' : 'client')}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="client">Cliente</option>
              <option value="coach">Coach</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => onFullNameChange(event.target.value)}
              placeholder={isCoachUser ? 'Es. Anna Costa' : 'Es. Marco Rossi'}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Email invitata
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="utente@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {!isCoachUser && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Coach assegnato
              </label>
              <select
                value={coachUserId ?? ''}
                onChange={(event) => onCoachUserIdChange(event.target.value || null)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Nessun coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Scadenza invito (ore)
            </label>
            <input
              type="number"
              min={1}
              max={720}
              value={expiresInHours}
              onChange={(event) => onExpiryChange(Number(event.target.value))}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-5 bg-red-100 text-red-700 border border-red-200 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {inviteUrl && (
          <div className="mt-5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-2xl px-4 py-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Link generato</p>
            <p className="break-all text-sm font-medium text-zinc-900">{inviteUrl}</p>
            <button
              onClick={() => void navigator.clipboard.writeText(inviteUrl)}
              className="inline-flex items-center gap-2 text-sm font-semibold underline"
            >
              <Copy size={14} /> Copia link
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl font-semibold text-zinc-600 hover:bg-zinc-100 w-full sm:w-auto"
          >
            Chiudi
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-2xl font-bold disabled:opacity-50 w-full sm:w-auto"
          >
            {isPending ? 'Creazione...' : 'Crea utente'}
          </button>
        </div>
      </div>
    </div>
  );
};
