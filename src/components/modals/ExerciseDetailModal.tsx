import { Check, ChevronLeft, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { Exercise, WorkoutDay } from '../../types/workout';

interface ExerciseDetailModalProps {
  day: WorkoutDay;
  exercise: Exercise;
  onClose: () => void;
  onStartWorkout: (day: WorkoutDay, ex: Exercise) => void;
  onMarkExerciseCompleted?: (dayId: number, exerciseId: string) => void;
  onMarkExerciseUncompleted?: (dayId: number, exerciseId: string) => void;
  isExerciseCompleted?: boolean;
}

export const ExerciseDetailModal = ({
  day,
  exercise,
  onClose,
  onStartWorkout,
  onMarkExerciseCompleted,
  onMarkExerciseUncompleted,
  isExerciseCompleted = false,
}: ExerciseDetailModalProps) => {
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  if (!exercise) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
      <div className="px-6 pt-16 pb-4 flex items-center justify-between border-b border-zinc-100 bg-white">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 active:scale-95 transition"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-zinc-900 truncate px-4">
          {exercise.name}
        </span>
        <div className="w-10 h-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-40">
        <div className="bg-zinc-50 p-5 rounded-2xl mb-8 border border-zinc-100 flex justify-around text-center">
          <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              Target
            </p>
            <p className="font-bold text-zinc-900 text-lg">
              {exercise.sets} x {exercise.reps}
            </p>
          </div>
          <div className="w-px bg-zinc-200"></div>
          <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              Recupero
            </p>
            <p className="font-bold text-zinc-900 text-lg">{exercise.rest}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">
            Ripetizioni, pesi e note si salvano nel workout attivo.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Apri l&apos;allenamento per annotare come è andata serie per serie.
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-zinc-100 pb-8 z-40">
        <div className="flex gap-3">
          <button
            onClick={() => setShowCompleteConfirm(true)}
            className={`flex-[0.3] font-bold py-4 rounded-2xl transition active:scale-[0.98] flex items-center justify-center ${
              isExerciseCompleted
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            {isExerciseCompleted ? <RotateCcw size={20} /> : <Check size={20} />}
          </button>
          <button
            onClick={() => {
              onClose();
              onStartWorkout(day, exercise);
            }}
            className="flex-1 bg-emerald-500 text-zinc-950 font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" /> Inizia da qui
          </button>
        </div>
      </div>

      {showCompleteConfirm && (
        <div className="absolute inset-0 z-[60] bg-zinc-950/50 p-6 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <p className="text-zinc-900 font-bold text-lg mb-1">
              {isExerciseCompleted
                ? 'Segnare esercizio come non finito?'
                : 'Segnare esercizio come completato?'}
            </p>
            <p className="text-zinc-500 text-sm mb-5">
              {isExerciseCompleted
                ? "Il cerchio verde verrà rimosso dalla lista esercizi."
                : "L'esercizio verrà marcato come completato nella scheda."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="bg-zinc-100 text-zinc-700 font-bold py-3.5 rounded-2xl hover:bg-zinc-200 transition active:scale-[0.98]"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (isExerciseCompleted) {
                    onMarkExerciseUncompleted?.(day.id, exercise.id);
                  } else {
                    onMarkExerciseCompleted?.(day.id, exercise.id);
                  }
                  onClose();
                }}
                className={`font-bold py-3.5 rounded-2xl transition active:scale-[0.98] ${
                  isExerciseCompleted
                    ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                    : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                }`}
              >
                {isExerciseCompleted ? 'Segna non finito' : 'Segna completato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
