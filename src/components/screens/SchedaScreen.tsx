import { ChevronRight, Clock, Play, Star } from 'lucide-react';
import { useMemo } from 'react';
import type { Exercise, WorkoutDay, WorkoutPlan, WorkoutPlanSummary } from '../../types/workout';

interface SchedaScreenProps {
  plan: WorkoutPlan | null;
  plans: WorkoutPlanSummary[];
  selectedPlanId: string | null;
  onPlanSelect: (planId: string) => void;
  onSetPreferred: (planId: string) => void;
  isSettingPreferred: boolean;
  onExerciseSelect: (day: WorkoutDay, ex: Exercise) => void;
  onStartWorkout: (day: WorkoutDay, ex: Exercise | null) => void;
  completedExerciseIdsByDay: Record<number, string[]>;
  activeDayId: number;
  onActiveDayChange: (dayId: number) => void;
}

const formatPublishedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const describeExerciseLoad = (exercise: Exercise) => {
  if (exercise.type === 'superset' && exercise.items?.length) {
    return `${exercise.items.length} esercizi`;
  }

  if (!exercise.targetLoad?.trim()) return null;
  return `${exercise.targetLoad} ${exercise.targetLoadUnit ?? 'kg'}`;
};

export const SchedaScreen = ({
  plan,
  plans,
  selectedPlanId,
  onPlanSelect,
  onSetPreferred,
  isSettingPreferred,
  onExerciseSelect,
  onStartWorkout,
  completedExerciseIdsByDay,
  activeDayId,
  onActiveDayChange,
}: SchedaScreenProps) => {
  const activeDay = useMemo(() => {
    if (!plan || plan.days.length === 0) return null;

    const activeDayIdx = Math.max(
      0,
      plan.days.findIndex((day) => day.id === activeDayId)
    );
    return plan.days[activeDayIdx];
  }, [activeDayId, plan]);

  if (!plan) {
    return (
      <div className="flex-1 flex flex-col bg-zinc-50 relative min-h-0 px-6 pt-20">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-3">
          Le tue schede
        </h1>
        <p className="text-zinc-500">
          Nessuna scheda pubblicata. Chiedi al coach di pubblicarne una.
        </p>
      </div>
    );
  }

  const completedIds = new Set(completedExerciseIdsByDay[activeDay?.id ?? -1] ?? []);

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 relative min-h-0">
      <div className="bg-white px-6 pt-16 pb-5 rounded-b-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-1">
              Storico schede
            </p>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
              Le tue schede
            </h1>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {plans.map((entry) => {
            const isSelected = entry.id === selectedPlanId;
            return (
              <button
                key={entry.id}
                onClick={() => onPlanSelect(entry.id)}
                className={`min-w-[240px] rounded-3xl border px-4 py-4 text-left transition ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-zinc-900">{entry.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Pubblicata il {formatPublishedAt(entry.publishedAt)}
                    </p>
                  </div>
                  {entry.isPreferred ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                      <Star size={12} className="fill-current" /> Preferita
                    </span>
                  ) : null}
                </div>

                {!entry.isPreferred ? (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700">
                      Imposta come preferita
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide space-y-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-zinc-900">{plan.title}</h2>
                {plans.find((entry) => entry.id === plan.id)?.isPreferred ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    <Star size={12} className="fill-current" /> Preferita
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                Pubblicata il {plan.publishedAt ? formatPublishedAt(plan.publishedAt) : '-'}
              </p>
            </div>

            {plans.find((entry) => entry.id === plan.id)?.isPreferred ? null : (
              <button
                onClick={() => onSetPreferred(plan.id)}
                disabled={isSettingPreferred}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                <Star size={16} />
                {isSettingPreferred ? 'Aggiornamento...' : 'Imposta come preferita'}
              </button>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {plan.days.map((day) => (
              <button
                key={`tab-${day.id}`}
                onClick={() => onActiveDayChange(day.id)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  activeDay?.id === day.id
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>

          {activeDay ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-black tracking-tight text-zinc-900">
                    {activeDay.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-zinc-500">{activeDay.focus}</p>
                </div>
                <button
                  onClick={() => onStartWorkout(activeDay, null)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                >
                  <Play size={16} fill="currentColor" /> Inizia
                </button>
              </div>

              <div className="space-y-3">
                {activeDay.exercises.map((ex, index) => {
                  const isCompleted = completedIds.has(ex.id);
                  const loadSummary = describeExerciseLoad(ex);

                  return (
                    <button
                      key={`ex-${ex.id}`}
                      onClick={() => onExerciseSelect(activeDay, ex)}
                      className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4 text-left transition hover:border-zinc-200 hover:bg-white active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                              : 'bg-zinc-200 text-zinc-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-[15px] font-bold text-zinc-900">{ex.name}</h4>
                            {ex.type === 'superset' ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                Super serie
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500">
                            <span className="rounded-md bg-white px-2 py-1">{ex.sets} serie</span>
                            <span>{ex.reps} reps</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {ex.rest}
                            </span>
                            {loadSummary ? <span>{loadSummary}</span> : null}
                          </div>
                        </div>
                        <ChevronRight size={20} className="shrink-0 text-zinc-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};
