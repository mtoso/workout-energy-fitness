import { useMemo, useState } from 'react';
import { Copy, Dumbbell, GripVertical, Link2, Plus, Trash2, X } from 'lucide-react';
import type {
  AdminWorkoutDay,
  AdminWorkoutGroup,
  AdminWorkoutPlanInput,
  AdminWorkoutWeek,
} from '../../types/admin-workout';
import {
  cloneAdminWorkoutDay,
  cloneAdminWorkoutGroup,
  cloneAdminWorkoutGroupItem,
  cloneAdminWorkoutPlanInput,
  createAdminWorkoutGroup,
} from './adminWorkoutPlanBuilderUtils';

interface AdminWorkoutPlanBuilderProps {
  value: AdminWorkoutPlanInput;
  onChange: (payload: AdminWorkoutPlanInput) => void;
}

const createId = () => crypto.randomUUID();

const createDay = (index: number): AdminWorkoutDay => ({
  id: createId(),
  name: `Giorno ${index}`,
  focus: '',
  groups: [],
});

const getExerciseCountLabel = (count: number) => `${count} es.`;

export const AdminWorkoutPlanBuilder = ({ value, onChange }: AdminWorkoutPlanBuilderProps) => {
  const draftWeeks = value.weeks;
  const [activeWeekId, setActiveWeekId] = useState<string>(draftWeeks[0]?.id ?? createId());
  const [activeDayId, setActiveDayId] = useState<string>(draftWeeks[0]?.days[0]?.id ?? createId());

  const activeWeek = useMemo(
    () => draftWeeks.find((week) => week.id === activeWeekId) ?? draftWeeks[0] ?? null,
    [activeWeekId, draftWeeks]
  );

  const activeDay = useMemo(
    () => activeWeek?.days.find((day) => day.id === activeDayId) ?? activeWeek?.days[0] ?? null,
    [activeDayId, activeWeek]
  );

  const updateValue = (updater: (current: AdminWorkoutPlanInput) => AdminWorkoutPlanInput) => {
    onChange(updater(cloneAdminWorkoutPlanInput(value)));
  };

  const updateWeeks = (updater: (weeks: AdminWorkoutWeek[]) => AdminWorkoutWeek[]) => {
    updateValue((current) => ({
      ...current,
      weeks: updater(current.weeks),
    }));
  };

  const updateWeek = (weekId: string, updater: (week: AdminWorkoutWeek) => AdminWorkoutWeek) => {
    updateWeeks((current) => current.map((week) => (week.id === weekId ? updater(week) : week)));
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
    const nextWeek = sourceWeek
      ? {
          id: createId(),
          name: `Settimana ${nextIndex}`,
          days: sourceWeek.days.map((day) => ({
            ...cloneAdminWorkoutDay(day),
            id: createId(),
            groups: day.groups.map((group) => ({
              ...cloneAdminWorkoutGroup(group),
              id: createId(),
              items: group.items.map((item) => ({
                ...cloneAdminWorkoutGroupItem(item),
                id: createId(),
              })),
            })),
          })),
        }
      : {
          id: createId(),
          name: `Settimana ${nextIndex}`,
          days: [createDay(1)],
        };

    updateWeeks((current) => [...current, nextWeek]);
    setActiveWeekId(nextWeek.id);
    setActiveDayId(nextWeek.days[0]?.id ?? createId());
  };

  const handleDeleteWeek = (weekId: string) => {
    if (draftWeeks.length === 1) return;

    const nextWeeks = draftWeeks.filter((week) => week.id !== weekId);
    updateWeeks(() => nextWeeks);

    if (activeWeekId === weekId && nextWeeks[0]) {
      setActiveWeekId(nextWeeks[0].id);
      setActiveDayId(nextWeeks[0].days[0]?.id ?? createId());
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
      groups: [...day.groups, createAdminWorkoutGroup(type)],
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
      items: [...group.items, { id: createId(), name: '', reps: '10' }],
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

  if (!activeWeek || !activeDay) return null;

  return (
    <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-8 xl:gap-10">
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Settimane</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddWeek}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                title="Duplica ultima settimana"
              >
                <Copy size={16} />
                <span>Duplica settimana</span>
              </button>
              <button
                onClick={() => handleDeleteWeek(activeWeek.id)}
                disabled={draftWeeks.length === 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-500 transition hover:bg-red-100 disabled:opacity-30"
                title="Elimina settimana"
              >
                <Trash2 size={16} />
                <span>Elimina settimana</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {draftWeeks.map((week, index) => {
              const isActive = activeWeek.id === week.id;

              return (
                <button
                  key={week.id}
                  onClick={() => handleSelectWeek(week.id)}
                  className={`h-12 w-12 rounded-2xl text-lg font-black transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10'
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  S{index + 1}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 border-t border-zinc-200 pt-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
            Giorni {activeWeek.name.toUpperCase()}
          </p>

          <div className="space-y-4">
            {activeWeek.days.map((day) => {
              const isActive = activeDay.id === day.id;

              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={`w-full rounded-[1.75rem] border p-6 text-left transition-all ${
                    isActive
                      ? 'bg-white border-emerald-500 shadow-[0_12px_30px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/50'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[2rem] font-black tracking-tight text-zinc-900">{day.name}</p>
                      <p className="mt-2 truncate text-lg text-zinc-500">{day.focus || 'Nessun focus'}</p>
                    </div>
                    <span className="shrink-0 rounded-2xl bg-zinc-100 px-4 py-2 text-lg font-black text-zinc-500">
                      {getExerciseCountLabel(day.groups.length)}
                    </span>
                  </div>
                </button>
              );
            })}

            <button
              onClick={handleAddDay}
              className="w-full rounded-[1.75rem] border-2 border-dashed border-zinc-200 bg-white/50 px-6 py-7 text-left text-zinc-500 transition hover:border-zinc-300 hover:bg-white"
            >
              <span className="inline-flex items-center gap-3 text-[2rem] font-black tracking-tight">
                <Plus size={20} /> Nuovo Giorno
              </span>
            </button>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-[2rem] border border-zinc-200 bg-white px-5 py-6 shadow-sm md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <label htmlFor={`day-name-${activeDay.id}`} className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                  Nome giorno
                </label>
                <input
                  id={`day-name-${activeDay.id}`}
                  name={`day-name-${activeDay.id}`}
                  type="text"
                  value={activeDay.name}
                  onChange={(event) =>
                    updateDay(activeWeek.id, activeDay.id, (day) => ({
                      ...day,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4 text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label htmlFor={`day-focus-${activeDay.id}`} className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                  Focus muscolare
                </label>
                <input
                  id={`day-focus-${activeDay.id}`}
                  name={`day-focus-${activeDay.id}`}
                  type="text"
                  value={activeDay.focus}
                  onChange={(event) =>
                    updateDay(activeWeek.id, activeDay.id, (day) => ({
                      ...day,
                      focus: event.target.value,
                    }))
                  }
                  placeholder="Es. Petto / Dorso / Gambe"
                  className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4 text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              onClick={() => handleDeleteDay(activeDay.id)}
              disabled={activeWeek.days.length === 1}
              className="mt-8 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 text-sm font-bold text-red-500 transition hover:bg-red-100 disabled:opacity-40"
              title="Elimina giorno"
            >
              <Trash2 size={18} />
              <span className="hidden xl:inline">Elimina giorno</span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-4xl font-black tracking-tight text-zinc-900">
              Esercizi ({activeDay.groups.length})
            </h2>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => handleAddGroup('single')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800"
                title="Aggiungi esercizio singolo"
              >
                <Plus size={20} />
                <span>Nuovo esercizio</span>
              </button>
              <button
                onClick={() => handleAddGroup('superset')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                title="Aggiungi super serie"
              >
                <Link2 size={20} />
                <span>Nuova super serie</span>
              </button>
            </div>
          </div>

          <div className="hidden xl:grid xl:grid-cols-[96px_minmax(260px,1.5fr)_120px_170px_130px_minmax(120px,0.7fr)_148px] items-center px-4 text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
            <div />
            <div>Esercizio</div>
            <div className="text-center">Serie</div>
            <div className="text-center">Ripetizioni</div>
            <div className="text-center">Recupero</div>
            <div>Note</div>
            <div />
          </div>

          {activeDay.groups.length === 0 ? (
            <div className="rounded-[2.5rem] border-2 border-dashed border-zinc-200 bg-white px-8 py-14 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-300">
                <Dumbbell size={28} />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-zinc-900">Nessun esercizio</h3>
              <p className="mt-2 text-lg text-zinc-500">
                Aggiungi un esercizio singolo o una super serie per iniziare la giornata.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDay.groups.map((group, groupIndex) => {
                if (group.type === 'single') {
                  const item = group.items[0];

                  return (
                    <div
                      key={group.id}
                      className="grid items-center gap-3 rounded-[1.5rem] border border-zinc-200 bg-white px-3 py-3 shadow-sm xl:grid-cols-[96px_minmax(260px,1.5fr)_120px_170px_130px_minmax(120px,0.7fr)_148px]"
                    >
                      <div className="flex items-center gap-3 text-zinc-300">
                        <GripVertical size={20} />
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500">
                          {groupIndex + 1}
                        </span>
                      </div>

                      <input
                        id={`single-name-${group.id}`}
                        name={`single-name-${group.id}`}
                        aria-label={`Nome esercizio ${groupIndex + 1}`}
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
                        className="w-full rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />

                      <input
                        id={`single-sets-${group.id}`}
                        name={`single-sets-${group.id}`}
                        type="number"
                        min="1"
                        value={group.sets}
                        onChange={(event) =>
                          handleUpdateGroup(group.id, (current) => ({
                            ...current,
                            sets: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                        className="w-full rounded-[1rem] border border-zinc-200 bg-white px-3 py-3 text-center text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />

                      <input
                        id={`single-reps-${group.id}`}
                        name={`single-reps-${group.id}`}
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
                        className="w-full rounded-[1rem] border border-zinc-200 bg-white px-3 py-3 text-center text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />

                      <input
                        id={`single-rest-${group.id}`}
                        name={`single-rest-${group.id}`}
                        type="text"
                        value={group.rest}
                        onChange={(event) =>
                          handleUpdateGroup(group.id, (current) => ({
                            ...current,
                            rest: event.target.value,
                          }))
                        }
                        placeholder="2'"
                        className="w-full rounded-[1rem] border border-zinc-200 bg-white px-3 py-3 text-center text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />

                      <input
                        id={`single-notes-${group.id}`}
                        name={`single-notes-${group.id}`}
                        type="text"
                        value={group.notes}
                        onChange={(event) =>
                          handleUpdateGroup(group.id, (current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Note"
                        className="w-full rounded-[1rem] border border-dashed border-zinc-200 bg-transparent px-3 py-3 text-sm font-semibold text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />

                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Rimuovi esercizio"
                      >
                        <X size={18} />
                        <span>Rimuovi</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={group.id}
                    className="grid gap-3 rounded-[1.5rem] border-2 border-emerald-200 bg-emerald-50/40 px-3 py-3 shadow-sm xl:grid-cols-[96px_minmax(260px,1.5fr)_120px_170px_130px_minmax(120px,0.7fr)_148px]"
                  >
                    <div className="flex items-center gap-3 text-emerald-300">
                      <GripVertical size={20} />
                      <div className="space-y-3">
                        {group.items.map((_, itemIndex) => (
                          <span
                            key={`${group.id}-badge-${itemIndex}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700"
                          >
                            {groupIndex + 1}
                            {String.fromCharCode(97 + itemIndex)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item, itemIndex) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            id={`superset-name-${group.id}-${item.id}`}
                            name={`superset-name-${group.id}-${item.id}`}
                            type="text"
                            value={item.name}
                            onChange={(event) =>
                              handleUpdateGroup(group.id, (current) => ({
                                ...current,
                                items: current.items.map((entry) =>
                                  entry.id === item.id ? { ...entry, name: event.target.value } : entry
                                ),
                              }))
                            }
                            placeholder={`Esercizio ${itemIndex + 1}`}
                            className="w-full rounded-[1rem] border border-emerald-200 bg-white px-4 py-3 text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                          {group.items.length > 2 ? (
                            <button
                              onClick={() => handleRemoveSupersetItem(group.id, item.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-emerald-500 transition hover:bg-red-50 hover:text-red-500"
                              title="Rimuovi esercizio dalla super serie"
                            >
                              <X size={16} />
                            </button>
                          ) : null}
                        </div>
                      ))}

                      <button
                        onClick={() => handleAddSupersetItem(group.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-white"
                      >
                        <Plus size={16} /> Aggiungi esercizio
                      </button>
                    </div>

                    <input
                      id={`superset-sets-${group.id}`}
                      name={`superset-sets-${group.id}`}
                      type="number"
                      min="1"
                      value={group.sets}
                      onChange={(event) =>
                        handleUpdateGroup(group.id, (current) => ({
                          ...current,
                          sets: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                      className="w-full self-stretch rounded-[1rem] border border-emerald-200 bg-white px-3 py-3 text-center text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />

                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <input
                          key={`${item.id}-reps`}
                          id={`superset-reps-${group.id}-${item.id}`}
                          name={`superset-reps-${group.id}-${item.id}`}
                          type="text"
                          value={item.reps}
                          onChange={(event) =>
                            handleUpdateGroup(group.id, (current) => ({
                              ...current,
                              items: current.items.map((entry) =>
                                entry.id === item.id ? { ...entry, reps: event.target.value } : entry
                              ),
                            }))
                          }
                          placeholder="Ripetizioni"
                          className="w-full rounded-[1rem] border border-emerald-200 bg-white px-3 py-3 text-center text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      ))}
                    </div>

                    <input
                      id={`superset-rest-${group.id}`}
                      name={`superset-rest-${group.id}`}
                      type="text"
                      value={group.rest}
                      onChange={(event) =>
                        handleUpdateGroup(group.id, (current) => ({
                          ...current,
                          rest: event.target.value,
                        }))
                      }
                      placeholder={'1\'30"'}
                      className="w-full self-stretch rounded-[1rem] border border-emerald-200 bg-white px-3 py-3 text-center text-xl font-black text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />

                    <textarea
                      id={`superset-notes-${group.id}`}
                      name={`superset-notes-${group.id}`}
                      value={group.notes}
                      onChange={(event) =>
                        handleUpdateGroup(group.id, (current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Note super serie"
                      rows={group.items.length}
                      className="w-full rounded-[1rem] border border-emerald-200/70 bg-white/70 px-3 py-3 text-sm font-semibold text-emerald-900 placeholder:text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />

                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Rimuovi super serie"
                    >
                      <X size={18} />
                      <span>Rimuovi</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
