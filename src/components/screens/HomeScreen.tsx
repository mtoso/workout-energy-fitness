import { Dumbbell, FileText, Play, Scale, TrendingDown } from 'lucide-react';
import { WEIGHT_HISTORY } from '../../data/workout-data';
import defaultProfileLogo from '../../assets/profile-default-logo.png';
import type { Exercise, WorkoutDay } from '../../types/workout';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onStartWorkout: (day: WorkoutDay, ex: Exercise | null) => void;
  schedaData: WorkoutDay[];
}

export const HomeScreen = ({
  onNavigate,
  onStartWorkout,
  schedaData,
}: HomeScreenProps) => {
  const currentWeight = WEIGHT_HISTORY[WEIGHT_HISTORY.length - 1];
  const todayWorkout = schedaData[0];

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 pb-24 scrollbar-hide min-h-0">
      <div className="px-6 pt-16 pb-6 bg-white rounded-b-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4">
        <div>
          <p className="text-zinc-500 font-medium">Ciao,</p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Mattia
          </h1>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          aria-label="Apri profilo"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden shadow-sm shrink-0 flex items-center justify-center active:scale-95 transition"
        >
          <img
            src={defaultProfileLogo}
            alt="Logo profilo"
            className="w-full h-full object-contain p-1.5 sm:p-1"
          />
        </button>
      </div>

      <div className="px-6 mt-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">
            Il tuo allenamento
          </h2>
          <div className="bg-zinc-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-zinc-900/10">
            <div className="relative z-10">
              <div className="bg-zinc-800/50 w-fit px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-4 flex items-center gap-1.5">
                <FileText size={14} /> Scheda Attuale
              </div>
              <h3 className="text-2xl font-bold mb-1">Massa 6 Settimane</h3>
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
                  Vedi tutta la scheda
                </button>
              </div>
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
            className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Scale size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium mb-0.5">
                  {currentWeight.date}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-900">
                    {currentWeight.weight}
                  </span>
                  <span className="text-zinc-500 text-sm font-medium">kg</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-zinc-400 font-medium mb-1">
                Massa Grassa
              </p>
              <div className="flex items-center justify-end text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg text-sm">
                <TrendingDown size={14} className="mr-1" /> {currentWeight.fat}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
