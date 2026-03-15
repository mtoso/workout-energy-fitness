import type {
  AdminWorkoutDay,
  AdminWorkoutGroup,
  AdminWorkoutGroupItem,
  AdminWorkoutPlan,
  AdminWorkoutPlanInput,
  AdminWorkoutWeek,
} from '../../types/admin-workout';

const createId = () => crypto.randomUUID();

const createItem = (): AdminWorkoutGroupItem => ({
  id: createId(),
  name: '',
  reps: '10',
});

const createDay = (index: number): AdminWorkoutDay => ({
  id: createId(),
  name: `Giorno ${index}`,
  focus: '',
  groups: [],
});

const createWeek = (index: number): AdminWorkoutWeek => ({
  id: createId(),
  name: `Settimana ${index}`,
  days: [createDay(1)],
});

export const createAdminWorkoutGroup = (type: 'single' | 'superset'): AdminWorkoutGroup => ({
  id: createId(),
  type,
  sets: 3,
  rest: "1'30\"",
  notes: '',
  items: type === 'single' ? [createItem()] : [createItem(), createItem()],
});

export const cloneAdminWorkoutGroupItem = (item: AdminWorkoutGroupItem): AdminWorkoutGroupItem => ({
  id: item.id,
  name: item.name,
  reps: item.reps,
  previous: item.previous ? { ...item.previous } : undefined,
});

export const cloneAdminWorkoutGroup = (group: AdminWorkoutGroup): AdminWorkoutGroup => ({
  id: group.id,
  type: group.type,
  sets: group.sets,
  rest: group.rest,
  notes: group.notes,
  items: group.items.map(cloneAdminWorkoutGroupItem),
});

export const cloneAdminWorkoutDay = (day: AdminWorkoutDay): AdminWorkoutDay => ({
  id: day.id,
  name: day.name,
  focus: day.focus,
  groups: day.groups.map(cloneAdminWorkoutGroup),
});

export const cloneAdminWorkoutWeek = (week: AdminWorkoutWeek): AdminWorkoutWeek => ({
  id: week.id,
  name: week.name,
  days: week.days.map(cloneAdminWorkoutDay),
});

export const cloneAdminWorkoutPlanInput = (
  input: AdminWorkoutPlanInput
): AdminWorkoutPlanInput => ({
  title: input.title,
  weeks: input.weeks.map(cloneAdminWorkoutWeek),
});

export const toAdminWorkoutPlanInput = (plan: AdminWorkoutPlan | null): AdminWorkoutPlanInput => {
  if (!plan || plan.weeks.length === 0) {
    return {
      title: 'Nuova Scheda',
      weeks: [createWeek(1)],
    };
  }

  return {
    title: plan.title,
    weeks: plan.weeks.map((week, weekIndex) => ({
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
    })),
  };
};
