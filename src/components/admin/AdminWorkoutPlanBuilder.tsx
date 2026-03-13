import { useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Dumbbell,
  GripVertical,
  Link2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AdminWorkoutDay,
  AdminWorkoutGroup,
  AdminWorkoutGroupItem,
  AdminWorkoutPlan,
  AdminWorkoutPlanInput,
  AdminWorkoutWeek,
} from '../../types/admin-workout';

interface AdminWorkoutPlanBuilderProps {
  plan: AdminWorkoutPlan | null;
  isSaving: boolean;
  saveError: string | null;
  saveOk: string | null;
  onSave: (payload: AdminWorkoutPlanInput) => void;
}

const createId = () => crypto.randomUUID();

const createItem = (): AdminWorkoutGroupItem => ({
  id: createId(),
  name: '',
  reps: '10',
});

const createGroup = (type: 'single' | 'superset'): AdminWorkoutGroup => ({
  id: createId(),
  type,
  sets: 3,
  rest: "1'30\"",
  notes: '',
  items: type === 'single' ? [createItem()] : [createItem(), createItem()],
});

const createDay = (index: number): AdminWorkoutDay => ({
  id: createId(),
  name: `Giorno ${index}`,
  focus: '',
  groups: [],
});

const cloneGroupItem = (item: AdminWorkoutGroupItem): AdminWorkoutGroupItem => ({
  id: createId(),
  name: item.name,
  reps: item.reps,
  previous: item.previous ? { ...item.previous } : undefined,
});

const cloneGroup = (group: AdminWorkoutGroup): AdminWorkoutGroup => ({
  id: createId(),
  type: group.type,
  sets: group.sets,
  rest: group.rest,
  notes: group.notes,
  items: group.items.map(cloneGroupItem),
});

const cloneDay = (day: AdminWorkoutDay): AdminWorkoutDay => ({
  id: createId(),
  name: day.name,
  focus: day.focus,
  groups: day.groups.map(cloneGroup),
});

const cloneWeek = (week: AdminWorkoutWeek, index: number): AdminWorkoutWeek => ({
  id: createId(),
  name: `Settimana ${index}`,
  days: week.days.map(cloneDay),
});

const createWeek = (index: number): AdminWorkoutWeek => ({
  id: createId(),
  name: `Settimana ${index}`,
  days: [createDay(1)],
});

const createDefaultPlan = (): AdminWorkoutPlanInput => ({
  title: 'Nuova Scheda',
  weeks: [createWeek(1)],
});

const clonePlanWeeks = (weeks: AdminWorkoutWeek[]): AdminWorkoutWeek[] =>
  weeks.map((week, weekIndex) => ({
    id: week.id,
    name: week.name || `Settimana ${weekIndex + 1}`,
    days: week.days.map((day, dayIndex) => ({
      id: day.id,
      name: day.name || `Giorno ${dayIndex + 1}`,
      focus: day.focus,
      groups: day.groups.map((group) => ({
        id: group.id,
        type: group.type,
        sets: group.sets,
        rest: group.rest,
        notes: group.notes,
        items: group.items.map((item) => ({
          id: item.id,
          name: item.name,
          reps: item.reps,
          previous: item.previous ? { ...item.previous } : undefined,
        })),
      })),
    })),
  }));

const toDraftPlan = (plan: AdminWorkoutPlan | null): AdminWorkoutPlanInput => {
  if (!plan || plan.weeks.length === 0) {
    return createDefaultPlan();
  }

  return {
    title: plan.title,
    weeks: clonePlanWeeks(plan.weeks),
  };
};

export const AdminWorkoutPlanBuilder = ({
  plan,
  isSaving,
  saveError,
  saveOk,
  onSave,
}: AdminWorkoutPlanBuilderProps) => {
  const initialDraft = toDraftPlan(plan);
  const [draftTitle, setDraftTitle] = useState(initialDraft.title);
  const [draftWeeks, setDraftWeeks] = useState<AdminWorkoutWeek[]>(initialDraft.weeks);
  const [activeWeekId, setActiveWeekId] = useState<string>(initialDraft.weeks[0]?.id ?? createId());
  const [activeDayId, setActiveDayId] = useState<string>(initialDraft.weeks[0]?.days[0]?.id ?? createId());

  const activeWeek = useMemo(
    () => draftWeeks.find((week) => week.id === activeWeekId) ?? draftWeeks[0] ?? null,
    [activeWeekId, draftWeeks]
  );

  const activeDay = useMemo(
    () => activeWeek?.days.find((day) => day.id === activeDayId) ?? activeWeek?.days[0] ?? null,
    [activeDayId, activeWeek]
  );

  const updateWeeks = (updater: (weeks: AdminWorkoutWeek[]) => AdminWorkoutWeek[]) => {
    setDraftWeeks((current) => updater(current));
  };

  const updateWeek = (weekId: string, updater: (week: AdminWorkoutWeek) => AdminWorkoutWeek) => {
    updateWeeks((current) =>
      current.map((week) => (week.id === weekId ? updater(week) : week))
    );
  };

  const updateDay = (
    weekId: string,
    dayId: string,
    updater: (day: AdminWorkoutDay) => AdminWorkoutDay
  ) => {
    updateWeek(weekId, (week) => ({
      ...week,
      days: week.days.map((day) => (day.id === dayId ? updater(day) : day)),
    }));
  };

  const handleSelectWeek = (weekId: string) => {
    setActiveWeekId(weekId);
    const week = draftWeeks.find((entry) => entry.id === weekId);
    if (week?.days[0]) {
      setActiveDayId(week.days[0].id);
    }
  };

  const handleAddWeek = () => {
    const nextIndex = draftWeeks.length + 1;
    const sourceWeek = draftWeeks[draftWeeks.length - 1];
    const nextWeek = sourceWeek ? cloneWeek(sourceWeek, nextIndex) : createWeek(nextIndex);

    updateWeeks((current) => [...current, nextWeek]);
    setActiveWeekId(nextWeek.id);
    setActiveDayId(nextWeek.days[0]?.id ?? createId());
  };

  const handleDeleteWeek = (weekId: string) => {
    if (draftWeeks.length === 1) return;

    const nextWeeks = draftWeeks.filter((week) => week.id !== weekId);
    setDraftWeeks(nextWeeks);

    if (activeWeekId === weekId) {
      const nextWeek = nextWeeks[0];
      if (nextWeek) {
        setActiveWeekId(nextWeek.id);
        setActiveDayId(nextWeek.days[0]?.id ?? createId());
      }
    }
  };

  const handleAddDay = () => {
    if (!activeWeek) return;

    const nextDay = createDay(activeWeek.days.length + 1);
    updateWeek(activeWeek.id, (week) => ({
      ...week,
      days: [...week.days, nextDay],
    }));
    setActiveDayId(nextDay.id);
  };

  const handleDeleteDay = (dayId: string) => {
    if (!activeWeek || activeWeek.days.length === 1) return;

    const nextDays = activeWeek.days.filter((day) => day.id !== dayId);
    updateWeek(activeWeek.id, (week) => ({
      ...week,
      days: nextDays,
    }));

    if (activeDayId === dayId && nextDays[0]) {
      setActiveDayId(nextDays[0].id);
    }
  };

  const handleAddGroup = (type: 'single' | 'superset') => {
    if (!activeWeek || !activeDay) return;

    updateDay(activeWeek.id, activeDay.id, (day) => ({
      ...day,
      groups: [...day.groups, createGroup(type)],
    }));
  };

  const handleUpdateGroup = (
    groupId: string,
    updater: (group: AdminWorkoutGroup) => AdminWorkoutGroup
  ) => {
    if (!activeWeek || !activeDay) return;

    updateDay(activeWeek.id, activeDay.id, (day) => ({
      ...day,
      groups: day.groups.map((group) => (group.id === groupId ? updater(group) : group)),
    }));
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!activeWeek || !activeDay) return;

    updateDay(activeWeek.id, activeDay.id, (day) => ({
      ...day,
      groups: day.groups.filter((group) => group.id !== groupId),
    }));
  };

  const handleAddSupersetItem = (groupId: string) => {
    handleUpdateGroup(groupId, (group) => ({
      ...group,
      items: [...group.items, createItem()],
    }));
  };

  const handleRemoveSupersetItem = (groupId: string, itemId: string) => {
    handleUpdateGroup(groupId, (group) => {
      if (group.type !== 'superset' || group.items.length <= 2) {
        return group;
      }

      return {
        ...group,
        items: group.items.filter((item) => item.id !== itemId),
      };
    });
  };

  return (
    <div className="grid xl:grid-cols-[300px_minmax(0,1fr)] gap-4 md:gap-6">
      <div className="w-full shrink-0 flex flex-col gap-4 lg:gap-6">
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5 space-y-5 h-fit">
          <div className="flex justify-between items-center gap-3">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Settimane</p>
              <h2 className="text-xl font-bold text-zinc-900">Piano</h2>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleAddWeek}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-emerald-700 hover:bg-emerald-50 transition"
                title="Duplica ultima settimana"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => handleDeleteWeek(activeWeek?.id ?? '')}
                disabled={draftWeeks.length === 1 || !activeWeek}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                title="Elimina settimana"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Titolo scheda
            </label>
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="w-full rounded-2xl bg-zinc-50 border border-zinc-200 px-4 py-3 font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-row lg:flex-wrap gap-2 overflow-x-auto pb-1 lg:pb-0">
            {draftWeeks.map((week, index) => (
              <button
                key={week.id}
                onClick={() => handleSelectWeek(week.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeWeek?.id === week.id
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                }`}
              >
                S{index + 1}
              </button>
            ))}
          </div>
        </div>

        {activeWeek && (
          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Giorni</p>
                <h3 className="text-lg font-bold text-zinc-900">{activeWeek.name}</h3>
              </div>
              <button
                onClick={handleAddDay}
                className="bg-zinc-900 text-white px-3 py-2 rounded-xl font-semibold text-sm inline-flex items-center gap-2 shrink-0"
              >
                <Plus size={15} /> <span className="hidden sm:inline">Giorno</span>
              </button>
            </div>

            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {activeWeek.days.map((day) => {
                const isActive = activeDay?.id === day.id;

                return (
                  <button
                    key={day.id}
                    onClick={() => setActiveDayId(day.id)}
                    className={`w-[220px] lg:w-full shrink-0 text-left p-4 rounded-2xl border transition ${
                      isActive
                        ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className={`font-bold ${isActive ? 'text-zinc-900' : 'text-zinc-700'}`}>
                          {day.name}
                        </p>
                        <p className="text-xs sm:text-sm mt-1 text-zinc-500 truncate">
                          {day.focus || 'Nessun focus'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-zinc-100 text-zinc-600">
                          {day.groups.length} gruppi
                        </span>
                        <ChevronRight size={16} className="text-zinc-300" />
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={handleAddDay}
                className="w-[150px] lg:w-full shrink-0 p-4 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-100 hover:border-zinc-300 transition flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={18} /> Nuovo
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Editor scheda
                </p>
                {plan?.isCurrent ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    Corrente
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">
                {draftTitle.trim() || 'Nuova Scheda'}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {draftWeeks.length} settimane,{' '}
                {draftWeeks.reduce((count, week) => count + week.days.length, 0)} giorni totali
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              <div className="text-sm font-medium text-zinc-500 inline-flex items-center gap-2">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Check size={16} className="text-emerald-500" />
                    Pronto al salvataggio
                  </>
                )}
              </div>
              <button
                onClick={() =>
                  onSave({
                    title: draftTitle.trim() || 'Nuova Scheda',
                    weeks: draftWeeks,
                  })
                }
                disabled={isSaving}
                className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-2xl font-bold disabled:opacity-50 w-full sm:w-auto"
              >
                {isSaving ? 'Salvataggio...' : 'Salva scheda'}
              </button>
            </div>
          </div>

          {(saveError || saveOk) && (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium border ${
                saveError
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              {saveError || saveOk}
            </div>
          )}
        </div>

        {activeWeek && activeDay ? (
          <>
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-zinc-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Nome giorno
                    </label>
                    <input
                      type="text"
                      value={activeDay.name}
                      onChange={(event) =>
                        updateDay(activeWeek.id, activeDay.id, (day) => ({
                          ...day,
                          name: event.target.value,
                        }))
                      }
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Focus muscolare
                    </label>
                    <input
                      type="text"
                      value={activeDay.focus}
                      onChange={(event) =>
                        updateDay(activeWeek.id, activeDay.id, (day) => ({
                          ...day,
                          focus: event.target.value,
                        }))
                      }
                      placeholder="Es. Petto / Tricipiti"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDay(activeDay.id)}
                  disabled={activeWeek.days.length === 1}
                  className="w-full sm:w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-50 sm:bg-transparent hover:bg-red-100 sm:hover:bg-red-50 transition disabled:opacity-40 shrink-0"
                  title="Elimina giorno"
                >
                  <Trash2 size={18} className="mr-2 sm:mr-0" />
                  <span className="sm:hidden font-bold text-sm">Elimina Giorno</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1 sm:px-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900">
                    Esercizi ({activeDay.groups.length})
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    Aggiungi esercizi singoli o super serie e organizza la giornata.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddGroup('superset')}
                    className="flex-1 sm:flex-none justify-center text-emerald-700 bg-emerald-50 font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 hover:bg-emerald-100 px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition"
                  >
                    <Link2 size={16} /> Super Serie
                  </button>
                  <button
                    onClick={() => handleAddGroup('single')}
                    className="flex-1 sm:flex-none justify-center text-white bg-zinc-900 font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 hover:bg-zinc-800 px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition"
                  >
                    <Plus size={16} /> Esercizio
                  </button>
                </div>
              </div>

              {activeDay.groups.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[2rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                    <Dumbbell size={24} className="text-zinc-300 sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-zinc-900 mb-2">Nessun esercizio</h4>
                  <p className="text-xs sm:text-sm text-zinc-500 max-w-sm">
                    Inizia ad aggiungere esercizi o super serie usando i pulsanti in alto a destra.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="hidden lg:flex items-center px-4 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <div className="w-8 mr-4" />
                    <div className="flex-1 min-w-[200px]">Esercizio</div>
                    <div className="w-20 text-center mx-2">Serie</div>
                    <div className="w-32 text-center mx-2">Ripetizioni</div>
                    <div className="w-24 text-center mx-2">Recupero</div>
                    <div className="w-48 ml-2">Note</div>
                    <div className="w-10 ml-4" />
                  </div>

                  {activeDay.groups.map((group, groupIndex) => {
                    if (group.type === 'single') {
                      const item = group.items[0];

                      return (
                        <div
                          key={group.id}
                          className="bg-white border border-zinc-200 rounded-2xl p-3 lg:p-2 flex flex-col lg:flex-row lg:items-center group shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative gap-3 lg:gap-0"
                        >
                          <div className="absolute right-2 top-4 lg:static lg:w-8 flex items-center justify-center text-zinc-300 hover:text-zinc-500 lg:mr-2 shrink-0">
                            <GripVertical size={20} />
                          </div>

                          <div className="w-full lg:flex-1 lg:min-w-[200px] flex items-center gap-2 lg:gap-3 pr-8 lg:pr-0 lg:px-2 shrink-0">
                            <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-[10px] lg:text-xs font-bold shrink-0">
                              {groupIndex + 1}
                            </div>
                            <input
                              type="text"
                              value={item?.name ?? ''}
                              onChange={(event) =>
                                handleUpdateGroup(group.id, (current) => ({
                                  ...current,
                                  items: current.items.map((entry, itemIndex) =>
                                    itemIndex === 0 ? { ...entry, name: event.target.value } : entry
                                  ),
                                }))
                              }
                              placeholder="Nome esercizio..."
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="w-full lg:w-auto flex flex-row lg:contents gap-2">
                            <div className="flex-1 lg:w-20 lg:mx-2 shrink-0">
                              <label className="lg:hidden text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Serie</label>
                              <input
                                type="number"
                                min={1}
                                value={group.sets}
                                onChange={(event) =>
                                  handleUpdateGroup(group.id, (current) => ({
                                    ...current,
                                    sets: Number(event.target.value) || 1,
                                  }))
                                }
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 sm:px-3 py-2 text-center text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div className="flex-[1.5] lg:w-32 lg:mx-2 shrink-0">
                              <label className="lg:hidden text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Ripetizioni</label>
                              <input
                                type="text"
                                value={item?.reps ?? ''}
                                onChange={(event) =>
                                  handleUpdateGroup(group.id, (current) => ({
                                    ...current,
                                    items: current.items.map((entry, itemIndex) =>
                                      itemIndex === 0 ? { ...entry, reps: event.target.value } : entry
                                    ),
                                  }))
                                }
                                placeholder="12-10-8"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 sm:px-3 py-2 text-center text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div className="flex-1 lg:w-24 lg:mx-2 shrink-0 relative">
                              <label className="lg:hidden text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Recupero</label>
                              <Clock3 className="hidden lg:block absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                              <input
                                type="text"
                                value={group.rest}
                                onChange={(event) =>
                                  handleUpdateGroup(group.id, (current) => ({
                                    ...current,
                                    rest: event.target.value,
                                  }))
                                }
                                className="w-full lg:pl-9 bg-zinc-50 border border-zinc-200 rounded-lg px-2 sm:px-3 py-2 text-center text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="w-full lg:w-auto flex items-center gap-2">
                            <div className="flex-1 lg:w-48 lg:ml-2 shrink-0">
                              <input
                                type="text"
                                value={group.notes}
                                onChange={(event) =>
                                  handleUpdateGroup(group.id, (current) => ({
                                    ...current,
                                    notes: event.target.value,
                                  }))
                                }
                                placeholder="Note opzionali..."
                                className="w-full bg-transparent border border-dashed border-zinc-200 lg:border lg:border-zinc-200 rounded-lg px-3 py-2 text-xs lg:text-sm font-medium text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="hidden lg:flex w-10 h-10 ml-4 rounded-xl items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <X size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-red-500 bg-red-50 shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={group.id}
                        className="bg-emerald-50/30 border-2 border-emerald-200 rounded-2xl p-3 lg:p-2 flex flex-col lg:flex-row lg:items-stretch group shadow-sm hover:shadow-md transition-all relative overflow-hidden gap-4 lg:gap-0"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-emerald-500" />
                        <div className="absolute right-2 top-4 lg:static lg:w-8 lg:pl-1 flex items-center justify-center text-emerald-300 hover:text-emerald-500 lg:mr-2 shrink-0">
                          <GripVertical size={20} />
                        </div>

                        <div className="w-full lg:flex-1 lg:min-w-[220px] flex flex-col justify-center gap-2 pr-8 lg:pr-0 lg:px-2 shrink-0 relative pl-2 lg:pl-0">
                          <div className="absolute left-5 top-5 bottom-5 w-px bg-emerald-200 z-0 hidden lg:block" />
                          {group.items.map((item, itemIndex) => (
                            <div key={item.id} className="flex items-center gap-2 lg:gap-3 relative z-10">
                              <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] lg:text-[10px] font-bold shrink-0 lg:ring-4 ring-emerald-50">
                                {groupIndex + 1}
                                {String.fromCharCode(97 + itemIndex)}
                              </div>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(event) =>
                                  handleUpdateGroup(group.id, (current) => ({
                                    ...current,
                                    items: current.items.map((entry) =>
                                      entry.id === item.id
                                        ? { ...entry, name: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                                placeholder={`Esercizio ${itemIndex + 1}...`}
                                className="w-full bg-white border border-emerald-100 rounded-lg px-3 py-2 text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 shadow-sm"
                              />
                              <button
                                onClick={() => handleRemoveSupersetItem(group.id, item.id)}
                                disabled={group.items.length <= 2}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddSupersetItem(group.id)}
                            className="self-start ml-7 lg:ml-9 mt-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1.5"
                          >
                            <Plus size={14} /> Aggiungi esercizio
                          </button>
                        </div>

                        <div className="w-full lg:w-auto flex flex-row lg:contents gap-2 pl-2 lg:pl-0">
                          <div className="flex-1 lg:w-20 lg:mx-2 shrink-0 flex flex-col lg:justify-center">
                            <label className="lg:hidden text-[9px] font-bold text-emerald-600/70 uppercase mb-1 block">Serie</label>
                            <input
                              type="number"
                              min={1}
                              value={group.sets}
                              onChange={(event) =>
                                handleUpdateGroup(group.id, (current) => ({
                                  ...current,
                                  sets: Number(event.target.value) || 1,
                                }))
                              }
                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 sm:px-3 lg:py-4 py-2 text-center text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 shadow-sm h-full"
                            />
                          </div>
                          <div className="flex-[1.5] lg:w-32 lg:mx-2 shrink-0 flex flex-col justify-center gap-2">
                            <label className="lg:hidden text-[9px] font-bold text-emerald-600/70 uppercase mb-0 block">Reps</label>
                            {group.items.map((item) => (
                              <input
                                key={`reps-${item.id}`}
                                type="text"
                                value={item.reps}
                                onChange={(event) =>
                                  handleUpdateGroup(group.id, (current) => ({
                                    ...current,
                                    items: current.items.map((entry) =>
                                      entry.id === item.id
                                        ? { ...entry, reps: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                                placeholder="Reps..."
                                className="w-full bg-white border border-emerald-100 rounded-lg px-2 sm:px-3 py-2 text-center text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 shadow-sm"
                              />
                            ))}
                          </div>
                          <div className="flex-1 lg:w-24 lg:mx-2 shrink-0 flex flex-col lg:justify-center">
                            <label className="lg:hidden text-[9px] font-bold text-emerald-600/70 uppercase mb-1 block">Recupero</label>
                            <input
                              type="text"
                              value={group.rest}
                              onChange={(event) =>
                                handleUpdateGroup(group.id, (current) => ({
                                  ...current,
                                  rest: event.target.value,
                                }))
                              }
                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 sm:px-3 lg:py-4 py-2 text-center text-sm lg:text-base font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 shadow-sm h-full"
                            />
                          </div>
                        </div>

                        <div className="w-full lg:w-auto flex flex-col lg:flex-row lg:contents gap-2 pl-2 lg:pl-0 mt-1 lg:mt-0">
                          <div className="flex-1 lg:w-48 lg:ml-2 shrink-0 flex items-center">
                            <textarea
                              value={group.notes}
                              onChange={(event) =>
                                handleUpdateGroup(group.id, (current) => ({
                                  ...current,
                                  notes: event.target.value,
                                }))
                              }
                              placeholder="Note super serie..."
                              rows={2}
                              className="w-full bg-transparent border border-emerald-200/50 lg:border lg:border-emerald-200 rounded-lg px-3 py-2 text-xs lg:text-sm font-medium text-emerald-800 placeholder:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none min-h-[60px] lg:min-h-0"
                            />
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="hidden lg:flex w-10 h-10 ml-4 rounded-xl items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <X size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="lg:hidden w-full mt-1 py-2 flex items-center justify-center gap-1.5 text-red-500 bg-red-50/70 rounded-lg text-xs font-bold"
                            >
                              <Trash2 size={14} /> Rimuovi Super Serie
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-8" />
          </>
        ) : null}
      </div>
    </div>
  );
};
