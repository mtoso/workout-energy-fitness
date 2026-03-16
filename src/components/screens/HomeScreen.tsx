import { BellRing, Dumbbell, FileText, Play, Scale, TrendingDown } from 'lucide-react';
import { WEIGHT_HISTORY } from '../../data/workout-data';
import defaultProfileLogo from '../../assets/profile-default-logo.png';
import type { Exercise, WorkoutDay, WorkoutPlan } from '../../types/workout';

interface HomeScreenProps {
  onNavigate: (screen: 'home' | 'scheda' | 'profile') => void;
  onStartWorkout: (day: WorkoutDay, ex: Exercise | null) => void;
  preferredPlan: WorkoutPlan | null;
  hasUnseenPublication: boolean;
  displayName: string;
}

export const HomeScreen = ({
  onNavigate,
  onStartWorkout,
  preferredPlan,
  hasUnseenPublication,
  displayName,
}: HomeScreenProps) => {
  const currentWeight = WEIGHT_HISTORY[WEIGHT_HISTORY.length - 1];
  const todayWorkout = preferredPlan?.weeks[0]?.days[0] ?? null;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 pb-24 scrollbar-hide min-h-0">
      <div className="rounded-b-[2rem] bg-white px-6 pb-6 pt-16 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Home
            </p>
            <p className="text-zinc-500 font-medium">Ciao,</p>
            <h1 className="truncate text-3xl font-bold text-zinc-900 tracking-tight">
            {displayName}
            </h1>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            aria-label="Apri profilo"
            className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 shadow-sm transition active:scale-95 sm:h-20 sm:w-20"
          >
            <img
              src={defaultProfileLogo}
              alt="Logo profilo"
              className="h-full w-full object-contain p-1.5 sm:p-1"
            />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-6 px-6">
        {hasUnseenPublication ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600">
                <BellRing size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                  Nuova scheda disponibile
                </p>
                <p className="mt-1 text-sm text-emerald-900">
                  Il coach ha pubblicato una nuova scheda. Apri lo storico per scegliere se usarla.
                </p>
              </div>
              </div>
              <button
                onClick={() => onNavigate('scheda')}
                className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto"
              >
                Apri schede
              </button>
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">
            La tua scheda
          </h2>
          <div className="bg-zinc-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-zinc-900/10">
            <div className="relative z-10">
              <div className="bg-zinc-800/50 w-fit px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-4 flex items-center gap-1.5">
                <FileText size={14} /> Scheda preferita
              </div>
              {todayWorkout ? (
                <>
                  <h3 className="text-2xl font-bold mb-1">{preferredPlan?.title ?? 'Scheda preferita'}</h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    Oggi: {todayWorkout.name} - {todayWorkout.focus}
                  </p>

                  <div className="flex flex-col gap-3 mt-4">
                    <button
                      onClick={() => onStartWorkout(todayWorkout, null)}
                      className="w-full bg-emerald-500 text-zinc-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                      <Play size={18} fill="currentColor" /> Inizia Ora
                    </button>
                    <button
                      onClick={() => onNavigate('scheda')}
                      className="w-full bg-zinc-800 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                      Apri storico schede
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-1">Nessuna scheda</h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    Non hai ancora una scheda pubblicata. Contatta il tuo coach o admin.
                  </p>
                </>
              )}
            </div>
            <Dumbbell className="absolute -right-4 -bottom-4 text-zinc-800 w-32 h-32 opacity-50 rotate-12 pointer-events-none" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">
            Ultimo Check
          </h2>
          <div
            onClick={() => onNavigate('profile')}
            className="cursor-pointer rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Scale size={24} />
                </div>
                <div>
                  <p className="mb-0.5 text-sm font-medium text-zinc-500">{currentWeight.date}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-900">{currentWeight.weight}</span>
                    <span className="text-sm font-medium text-zinc-500">kg</span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="mb-1 text-xs font-medium text-zinc-400">Massa Grassa</p>
                <div className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-600">
                  <TrendingDown size={14} className="mr-1" /> {currentWeight.fat}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
