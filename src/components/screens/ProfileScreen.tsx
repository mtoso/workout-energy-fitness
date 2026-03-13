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
      <div className="px-6 pt-16 pb-8 bg-white rounded-b-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">
              I tuoi Progressi
            </h1>
            <p className="text-sm text-zinc-500">{userEmail}</p>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-[0.98] transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {showAdminEntry && onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="mb-6 w-full bg-amber-100 text-amber-900 px-4 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Shield size={16} /> Apri Backoffice
          </button>
        )}

        <div className="flex gap-4">
          <div className="flex-1 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              Peso Attuale
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-900 tracking-tight">
                {currentStat.weight}
              </span>
              <span className="text-zinc-500 font-medium">kg</span>
            </div>
          </div>
          <div className="flex-1 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              Massa Grassa
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-900 tracking-tight">
                {currentStat.fat}
              </span>
              <span className="text-zinc-500 font-medium">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8">
        <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">Trend Peso</h2>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 mb-8 h-48 flex items-center justify-center">
          <ProgressChart data={WEIGHT_HISTORY} />
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-zinc-900">Storico Check</h2>
          <button className="text-emerald-600 font-semibold text-sm flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg active:scale-95 transition">
            <Plus size={16} className="mr-1" /> Nuovo
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
          {[...WEIGHT_HISTORY].reverse().map((record, i, arr) => (
            <div
              key={`hist-${record.id}`}
              className={`flex items-center justify-between p-5 ${
                i !== arr.length - 1 ? 'border-b border-zinc-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                  <Calendar size={18} />
                </div>
                <span className="font-semibold text-zinc-900">{record.date}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-900">{record.weight} kg</p>
                <p className="text-xs text-zinc-400 font-medium">
                  {record.fat}% MG
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="h-10"></div>
      </div>
    </div>
  );
};
