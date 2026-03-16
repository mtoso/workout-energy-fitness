import { Calendar, LogOut, Plus, Shield } from 'lucide-react';
import { ProgressChart } from '../charts/ProgressChart';
import { WEIGHT_HISTORY } from '../../data/workout-data';

interface ProfileScreenProps {
  userEmail: string;
  onLogout: () => void;
  showAdminEntry?: boolean;
  onOpenAdmin?: () => void;
}

export const ProfileScreen = ({
  userEmail,
  onLogout,
  showAdminEntry = false,
  onOpenAdmin,
}: ProfileScreenProps) => {
  const currentStat = WEIGHT_HISTORY[WEIGHT_HISTORY.length - 1];

  return (
    <div className="flex-1 bg-zinc-50 pb-24 overflow-y-auto min-h-0">
      <div className="rounded-b-[2rem] bg-white px-6 pb-8 pt-16 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Profilo
            </p>
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900">
              I tuoi Progressi
            </h1>
            <p className="truncate text-sm text-zinc-500">{userEmail}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 active:scale-[0.98]"
          >
            <LogOut size={16} /> Esci
          </button>
        </div>

        {showAdminEntry && onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900 transition active:scale-[0.98]"
          >
            <Shield size={16} /> Apri Backoffice
          </button>
        )}

        <div className="flex gap-4">
          <div className="flex-1 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Peso Attuale
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-zinc-900">{currentStat.weight}</span>
              <span className="text-zinc-500 font-medium">kg</span>
            </div>
          </div>
          <div className="flex-1 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Massa Grassa
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-zinc-900">{currentStat.fat}</span>
              <span className="text-zinc-500 font-medium">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 px-6">
        <h2 className="mb-4 px-1 text-lg font-bold text-zinc-900">Trend Peso</h2>
        <div className="mb-8 flex h-48 items-center justify-center rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <ProgressChart data={WEIGHT_HISTORY} />
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <h2 className="text-lg font-bold text-zinc-900">Storico Check</h2>
          <button className="flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-600 transition active:scale-95">
            <Plus size={16} className="mr-1" /> Nuovo
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
          {[...WEIGHT_HISTORY].reverse().map((record, i, arr) => (
            <div
              key={`hist-${record.id}`}
              className={`flex items-center justify-between gap-4 p-5 ${
                i !== arr.length - 1 ? 'border-b border-zinc-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400">
                  <Calendar size={18} />
                </div>
                <span className="font-semibold text-zinc-900">{record.date}</span>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-zinc-900">{record.weight} kg</p>
                <p className="text-xs font-medium text-zinc-400">{record.fat}% MG</p>
              </div>
            </div>
          ))}
        </div>
        <div className="h-10"></div>
      </div>
    </div>
  );
};
