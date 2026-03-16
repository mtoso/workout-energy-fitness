import { ArrowLeft, Calendar, ChevronRight, Clock, Play, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Exercise, WorkoutDay, WorkoutPlan, WorkoutPlanSummary, WorkoutWeek } from '../../types/workout';

interface SchedaScreenProps {
  plan: WorkoutPlan | null;
  plans: WorkoutPlanSummary[];
  selectedPlanId: string | null;
  activeWeekId: string | null;
  onPlanSelect: (planId: string) => void;
  onActiveWeekChange: (weekId: string) => void;
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

const EmptyPlansState = () => (
  <div className="flex-1 flex flex-col bg-zinc-50 relative min-h-0 px-6 pt-20">
    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-3">Le tue schede</h1>
    <p className="text-zinc-500">Nessuna scheda pubblicata. Chiedi al coach di pubblicarne una.</p>
  </div>
);

export const SchedaScreen = ({
  plan,
  plans,
  selectedPlanId,
  activeWeekId,
  onPlanSelect,
  onActiveWeekChange,
  onSetPreferred,
  isSettingPreferred,
  onExerciseSelect,
  onStartWorkout,
  completedExerciseIdsByDay,
  activeDayId,
  onActiveDayChange,
}: SchedaScreenProps) => {
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const activeWeek = useMemo<WorkoutWeek | null>(() => {
    if (!plan || plan.weeks.length === 0) return null;

    return plan.weeks.find((week) => week.id === activeWeekId) ?? plan.weeks[0];
  }, [activeWeekId, plan]);

  const activeDay = useMemo(() => {
    if (!activeWeek || activeWeek.days.length === 0) return null;

    const activeDayIdx = Math.max(
      0,
      activeWeek.days.findIndex((day) => day.id === activeDayId)
    );
    return activeWeek.days[activeDayIdx];
  }, [activeDayId, activeWeek]);

  const selectedPlanSummary = useMemo(
    () => plans.find((entry) => entry.id === (plan?.id ?? selectedPlanId)) ?? null,
    [plan?.id, plans, selectedPlanId]
  );

  if (!plan || plans.length === 0) {
    return <EmptyPlansState />;
  }

  const completedIds = new Set(completedExerciseIdsByDay[activeDay?.id ?? -1] ?? []);

  const handlePlanOpen = (planId: string) => {
    onPlanSelect(planId);
    setMobileView('detail');
  };

  const renderPlanRow = (entry: WorkoutPlanSummary, compact = false) => {
    const isSelected = entry.id === selectedPlanId;

    return (
      <div
        key={entry.id}
        className={`w-full rounded-3xl border transition ${
          compact
            ? 'border-zinc-200 bg-white px-4 py-4'
            : isSelected
              ? 'border-emerald-300 bg-emerald-50 px-4 py-4 shadow-sm'
              : 'border-zinc-200 bg-white px-4 py-4 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => handlePlanOpen(entry.id)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-bold text-zinc-900">{entry.title}</p>
              {entry.isPreferred ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Preferita
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
              <Calendar size={14} />
              <span>Pubblicata il {formatPublishedAt(entry.publishedAt)}</span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!entry.isPreferred) {
                  onSetPreferred(entry.id);
                }
              }}
              disabled={entry.isPreferred || isSettingPreferred}
              aria-label={entry.isPreferred ? 'Scheda preferita' : 'Imposta come preferita'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${
                entry.isPreferred
                  ? 'border-amber-200 bg-amber-100 text-amber-700'
                  : 'border-zinc-200 bg-white text-zinc-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50'
              }`}
            >
              <Star size={18} className={entry.isPreferred ? 'fill-current' : ''} />
            </button>
            <button
              type="button"
              onClick={() => handlePlanOpen(entry.id)}
              aria-label="Apri scheda"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 transition hover:bg-zinc-200"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderExerciseList = () => {
    if (!activeDay) return null;

    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
              {activeWeek?.name ?? 'Settimana'}
            </p>
            <h3 className="truncate text-2xl font-black tracking-tight text-zinc-900">{activeDay.name}</h3>
            <p className="mt-1 text-sm text-zinc-500">{activeDay.focus || 'Focus non specificato'}</p>
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
                    <div className="flex flex-wrap items-center gap-2">
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
    );
  };

  const renderPlanDetailContent = () => (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-zinc-900">{plan.title}</h2>
              {selectedPlanSummary?.isPreferred ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <Star size={12} className="fill-current" /> Preferita
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Pubblicata il {plan.publishedAt ? formatPublishedAt(plan.publishedAt) : '-'}
            </p>
          </div>

          {selectedPlanSummary?.isPreferred ? null : (
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Settimane</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 lg:flex-col lg:overflow-visible">
                {plan.weeks.map((week, index) => (
                  <button
                    key={week.id}
                    onClick={() => onActiveWeekChange(week.id)}
                    className={`whitespace-nowrap rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      activeWeek?.id === week.id
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    {week.name || `Settimana ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>

            {activeWeek ? (
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Giorni</p>
                <div className="space-y-2">
                  {activeWeek.days.map((day) => (
                    <button
                      key={`day-${day.id}`}
                      onClick={() => onActiveDayChange(day.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        activeDay?.id === day.id
                          ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900">{day.name}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">{day.focus || 'Focus non specificato'}</p>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-zinc-300" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {renderExerciseList()}
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 relative min-h-0">
      <div className="md:hidden flex min-h-0 flex-1 flex-col pb-24">
        {mobileView === 'list' ? (
          <>
            <div className="shrink-0 rounded-b-[2rem] bg-white px-5 pb-5 pt-16 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Storico schede</p>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900">Le tue schede</h1>
              <p className="mt-2 text-sm text-zinc-500">Scegli una scheda da aprire o tocca la stella per renderla predefinita.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
              <div className="space-y-3">{plans.map((entry) => renderPlanRow(entry, true))}</div>
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 border-b border-zinc-200 bg-white px-5 pb-5 pt-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <button
                onClick={() => setMobileView('list')}
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700"
                aria-label="Torna alla lista schede"
              >
                <ArrowLeft size={20} />
              </button>
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Dettaglio scheda</p>
              <h1 className="truncate text-3xl font-black tracking-tight text-zinc-900">{plan.title}</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">{renderPlanDetailContent()}</div>
          </>
        )}
      </div>

      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        <div className="shrink-0 rounded-b-[2rem] bg-white px-6 pb-5 pt-16 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Storico schede</p>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900">Le tue schede</h1>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">{plans.map((entry) => renderPlanRow(entry))}</div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-28">{renderPlanDetailContent()}</div>
      </div>
    </div>
  );
};
