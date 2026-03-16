interface SetDraft {
  reps: string;
  weight: string;
}

interface ExerciseDraft {
  sets: SetDraft[];
  note: string;
}

export type WorkoutSessionDrafts = Record<string, ExerciseDraft>;

const getStorageKey = (userId: string, planId: string | null, dayId: number) =>
  `workout-session-drafts:${userId}:${planId ?? 'none'}:${dayId}`;

export const loadWorkoutSessionDrafts = (
  userId: string,
  planId: string | null,
  dayId: number
): WorkoutSessionDrafts => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId, planId, dayId));
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    return parsed as WorkoutSessionDrafts;
  } catch {
    return {};
  }
};

export const saveWorkoutSessionDrafts = (
  userId: string,
  planId: string | null,
  dayId: number,
  drafts: WorkoutSessionDrafts
) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(getStorageKey(userId, planId, dayId), JSON.stringify(drafts));
};
