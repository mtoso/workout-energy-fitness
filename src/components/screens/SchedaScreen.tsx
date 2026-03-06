import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit2,
  Play,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Exercise, WorkoutDay } from '../../types/workout';

interface SchedaScreenProps {
  onExerciseSelect: (day: WorkoutDay, ex: Exercise) => void;
  onStartWorkout: (day: WorkoutDay, ex: Exercise | null) => void;
  schedaData: WorkoutDay[];
  onUpdateDay: (dayId: number, newExercises: Exercise[]) => void;
  completedExerciseIdsByDay: Record<number, string[]>;
  activeDayId: number;
  onActiveDayChange: (dayId: number) => void;
}

export const SchedaScreen = ({
  onExerciseSelect,
  onStartWorkout,
  schedaData,
  onUpdateDay,
  completedExerciseIdsByDay,
  activeDayId,
  onActiveDayChange,
}: SchedaScreenProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const activeDay = useMemo(() => {
    if (schedaData.length === 0) return null;

    const activeDayIdx = Math.max(
      0,
      schedaData.findIndex((day) => day.id === activeDayId)
    );
    return schedaData[activeDayIdx];
  }, [activeDayId, schedaData]);

  if (!activeDay) {
    return (
      <div className="flex-1 flex flex-col bg-zinc-50 relative min-h-0 px-6 pt-20">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-3">
          Scheda Attuale
        </h1>
        <p className="text-zinc-500">
          Nessuna scheda disponibile. Chiedi al tuo admin di assegnarti un piano.
        </p>
      </div>
    );
  }

  const completedIds = new Set(completedExerciseIdsByDay[activeDay.id] ?? []);

  const moveUp = (index: number) => {
    if (index === 0) return;

    const newEx = [...activeDay.exercises];
    [newEx[index - 1], newEx[index]] = [newEx[index], newEx[index - 1]];
    onUpdateDay(activeDay.id, newEx);
  };

  const moveDown = (index: number) => {
    if (index === activeDay.exercises.length - 1) return;

    const newEx = [...activeDay.exercises];
    [newEx[index + 1], newEx[index]] = [newEx[index], newEx[index + 1]];
    onUpdateDay(activeDay.id, newEx);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 relative min-h-0">
      <div className="bg-white px-6 pt-16 pb-4 rounded-b-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Scheda Attuale
          </h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              isEditing
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            <Edit2 size={18} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {schedaData.map((day) => (
            <button
              key={`tab-${day.id}`}
              onClick={() => {
                onActiveDayChange(day.id);
                setIsEditing(false);
              }}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                activeDay.id === day.id
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        <div className="mb-6 flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-zinc-900 truncate">
              {activeDay.name}
            </h2>
            <p className="text-zinc-500 text-sm mt-0.5 truncate">
              {activeDay.focus}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => onStartWorkout(activeDay, null)}
              className="bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 active:scale-95 transition shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Play size={16} fill="currentColor" /> INIZIA
            </button>
          )}
        </div>

        <div className="space-y-3">
          {activeDay.exercises.map((ex, index) => {
            const isCompleted = completedIds.has(ex.id);

            return (
              <div
                key={`ex-${ex.id}`}
                onClick={() => !isEditing && onExerciseSelect(activeDay, ex)}
                className={`bg-white p-4 rounded-2xl border ${
                  isEditing
                    ? 'border-emerald-200 shadow-md'
                    : 'border-zinc-100 shadow-sm'
                } flex items-center transition-transform ${
                  !isEditing && 'cursor-pointer active:scale-[0.98]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-zinc-900 text-[15px] truncate mb-1">
                    {ex.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                    <span className="bg-zinc-100 px-2 py-1 rounded-md">
                      {ex.sets} Serie
                    </span>
                    <span>{ex.reps} Reps</span>
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" /> {ex.rest}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-1 ml-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveUp(index);
                      }}
                      disabled={index === 0}
                      className={`p-1.5 rounded-md ${
                        index === 0
                          ? 'text-zinc-200'
                          : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200 active:scale-95'
                      }`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDown(index);
                      }}
                      disabled={index === activeDay.exercises.length - 1}
                      className={`p-1.5 rounded-md ${
                        index === activeDay.exercises.length - 1
                          ? 'text-zinc-200'
                          : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200 active:scale-95'
                      }`}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                ) : (
                  <ChevronRight size={20} className="text-zinc-300 ml-2 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <div className="h-28"></div>
      </div>
    </div>
  );
};
