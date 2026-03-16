import { useCallback, useEffect, useMemo, useState } from 'react';
import { BottomNav } from './components/navigation/BottomNav';
import { ExerciseDetailModal } from './components/modals/ExerciseDetailModal';
import { ActiveWorkoutScreen } from './components/overlays/ActiveWorkoutScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SchedaScreen } from './components/screens/SchedaScreen';
import { useScreenWakeLock } from './hooks/useScreenWakeLock';
import { applyWorkoutPlanOverrides, saveWorkoutExerciseOverrides } from './lib/workout-overrides';
import type { Exercise, WorkoutDay, WorkoutPlan, WorkoutPlanSummary, WeightUnit, WorkoutWeek } from './types/workout';

interface SelectedExerciseRef {
  dayId: number;
  exerciseId: string;
}

interface ActiveWorkoutData {
  planId: string | null;
  day: WorkoutDay;
  initialExercise: Exercise | null;
}

type AppScreen = 'home' | 'scheda' | 'profile';

interface WorkoutAppProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  preferredPlan: WorkoutPlan | null;
  selectedPlan: WorkoutPlan | null;
  selectedPlanId: string | null;
  workoutPlans: WorkoutPlanSummary[];
  hasUnseenPublication: boolean;
  isSettingPreferredPlan: boolean;
  userId: string;
  userEmail: string;
  isAdmin: boolean;
  onSelectPlan: (planId: string) => void;
  onSetPreferredPlan: (planId: string) => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

const ACTIVE_SCHEDA_WEEK_STORAGE_KEY = 'workout-active-scheda-week-id';
const ACTIVE_SCHEDA_DAY_STORAGE_KEY = 'workout-active-scheda-day-id';

export default function App({
  currentScreen,
  onNavigate,
  preferredPlan,
  selectedPlan,
  selectedPlanId,
  workoutPlans,
  hasUnseenPublication,
  isSettingPreferredPlan,
  userId,
  userEmail,
  isAdmin,
  onSelectPlan,
  onSetPreferredPlan,
  onOpenAdmin,
  onLogout,
}: WorkoutAppProps) {
  useScreenWakeLock(true);

  const [overridesVersion, setOverridesVersion] = useState(0);
  const [selectedSchedaWeekId, setSelectedSchedaWeekId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(ACTIVE_SCHEDA_WEEK_STORAGE_KEY) ?? '';
  });
  const [selectedSchedaDayId, setSelectedSchedaDayId] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;

    const storedValue = window.localStorage.getItem(ACTIVE_SCHEDA_DAY_STORAGE_KEY);
    const parsedValue = Number(storedValue);
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
  });
  const [completedExerciseIdsByPlanDay, setCompletedExerciseIdsByPlanDay] = useState<Record<string, string[]>>({});
  const [selectedExerciseRef, setSelectedExerciseRef] = useState<SelectedExerciseRef | null>(null);
  const [activeWorkoutData, setActiveWorkoutData] = useState<ActiveWorkoutData | null>(null);

  const effectivePreferredPlan = useMemo(
    () => {
      void overridesVersion;
      return applyWorkoutPlanOverrides(userId, preferredPlan);
    },
    [userId, preferredPlan, overridesVersion]
  );
  const effectiveSelectedPlan = useMemo(
    () => {
      void overridesVersion;
      return applyWorkoutPlanOverrides(userId, selectedPlan);
    },
    [userId, selectedPlan, overridesVersion]
  );

  const resolvedSelectedWeek = useMemo<WorkoutWeek | null>(() => {
    if (!effectiveSelectedPlan?.weeks.length) return null;

    return (
      effectiveSelectedPlan.weeks.find((week) => week.id === selectedSchedaWeekId) ??
      effectiveSelectedPlan.weeks[0]
    );
  }, [effectiveSelectedPlan, selectedSchedaWeekId]);

  const resolvedSelectedSchedaDayId = useMemo(() => {
    if (!resolvedSelectedWeek?.days.length) return selectedSchedaDayId;
    return resolvedSelectedWeek.days.some((day) => day.id === selectedSchedaDayId)
      ? selectedSchedaDayId
      : resolvedSelectedWeek.days[0].id;
  }, [resolvedSelectedWeek, selectedSchedaDayId]);

  const getCompletionKey = useCallback(
    (planId: string | null, dayId: number) => `${planId ?? 'none'}:${dayId}`,
    []
  );

  const completedExerciseIdsByDay = useMemo(() => {
    if (!effectiveSelectedPlan) return {};

    return effectiveSelectedPlan.weeks.flatMap((week) => week.days).reduce<Record<number, string[]>>(
      (acc, day) => {
        acc[day.id] = completedExerciseIdsByPlanDay[getCompletionKey(effectiveSelectedPlan.id, day.id)] ?? [];
        return acc;
      },
      {}
    );
  }, [completedExerciseIdsByPlanDay, effectiveSelectedPlan, getCompletionKey]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_SCHEDA_WEEK_STORAGE_KEY, resolvedSelectedWeek?.id ?? '');
  }, [resolvedSelectedWeek?.id]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_SCHEDA_DAY_STORAGE_KEY, String(resolvedSelectedSchedaDayId));
  }, [resolvedSelectedSchedaDayId]);

  const selectedExerciseData = useMemo(() => {
    if (!selectedExerciseRef || !effectiveSelectedPlan) return null;

    const day = effectiveSelectedPlan.weeks
      .flatMap((week) => week.days)
      .find((entry) => entry.id === selectedExerciseRef.dayId);
    const exercise = day?.exercises.find((entry) => entry.id === selectedExerciseRef.exerciseId);

    if (!day || !exercise) return null;

    return { day, exercise };
  }, [effectiveSelectedPlan, selectedExerciseRef]);

  const handleSaveTargetOverrides = useCallback(
    (items: Array<{ targetLoad: string; targetLoadUnit: WeightUnit }>) => {
      if (!effectiveSelectedPlan || !selectedExerciseRef) return;

      const weekIndex = effectiveSelectedPlan.weeks.findIndex((week) =>
        week.days.some((day) => day.id === selectedExerciseRef.dayId)
      );
      if (weekIndex < 0) return;

      const dayIndex = effectiveSelectedPlan.weeks[weekIndex].days.findIndex(
        (day) => day.id === selectedExerciseRef.dayId
      );
      if (dayIndex < 0) return;

      const exerciseIndex = effectiveSelectedPlan.weeks[weekIndex].days[dayIndex].exercises.findIndex(
        (exercise) => exercise.id === selectedExerciseRef.exerciseId
      );
      if (exerciseIndex < 0) return;

      saveWorkoutExerciseOverrides(userId, effectiveSelectedPlan, weekIndex, dayIndex, exerciseIndex, items);
      setOverridesVersion((current) => current + 1);
    },
    [effectiveSelectedPlan, selectedExerciseRef, userId]
  );

  const markExerciseCompleted = useCallback((planId: string | null, dayId: number, exerciseId: string) => {
    const completionKey = getCompletionKey(planId, dayId);

    setCompletedExerciseIdsByPlanDay((prev) => {
      const prevCompleted = prev[completionKey] ?? [];
      if (prevCompleted.includes(exerciseId)) return prev;

      return { ...prev, [completionKey]: [...prevCompleted, exerciseId] };
    });
  }, [getCompletionKey]);

  const unmarkExerciseCompleted = useCallback((planId: string | null, dayId: number, exerciseId: string) => {
    const completionKey = getCompletionKey(planId, dayId);

    setCompletedExerciseIdsByPlanDay((prev) => {
      const prevCompleted = prev[completionKey] ?? [];
      if (!prevCompleted.includes(exerciseId)) return prev;

      return {
        ...prev,
        [completionKey]: prevCompleted.filter((id) => id !== exerciseId),
      };
    });
  }, [getCompletionKey]);

  const handleStartWorkout = useCallback((day: WorkoutDay, initialExercise: Exercise | null) => {
    const planId = effectiveSelectedPlan?.id ?? null;
    const completionKey = getCompletionKey(planId, day.id);

    setCompletedExerciseIdsByPlanDay((prev) => ({ ...prev, [completionKey]: [] }));
    setActiveWorkoutData({ planId, day, initialExercise });
  }, [effectiveSelectedPlan?.id, getCompletionKey]);

  const handleExerciseCompleted = useCallback(
    (exerciseId: string) => {
      const activeDayId = activeWorkoutData?.day.id;
      if (!activeDayId) return;

      markExerciseCompleted(activeWorkoutData?.planId ?? null, activeDayId, exerciseId);
    },
    [activeWorkoutData?.day.id, activeWorkoutData?.planId, markExerciseCompleted]
  );

  return (
    <div className="app-shell">
      {currentScreen === 'home' && (
        <HomeScreen
          onNavigate={onNavigate}
          onStartWorkout={handleStartWorkout}
          preferredPlan={effectivePreferredPlan}
          hasUnseenPublication={hasUnseenPublication}
          displayName={userEmail.split('@')[0] ?? userEmail}
        />
      )}

      {currentScreen === 'scheda' && (
        <SchedaScreen
          plan={effectiveSelectedPlan}
          plans={workoutPlans}
          selectedPlanId={selectedPlanId}
          activeWeekId={resolvedSelectedWeek?.id ?? null}
          onPlanSelect={onSelectPlan}
          onActiveWeekChange={setSelectedSchedaWeekId}
          onSetPreferred={onSetPreferredPlan}
          isSettingPreferred={isSettingPreferredPlan}
          onExerciseSelect={(day, ex) =>
            setSelectedExerciseRef({ dayId: day.id, exerciseId: ex.id })
          }
          onStartWorkout={handleStartWorkout}
          completedExerciseIdsByDay={completedExerciseIdsByDay}
          activeDayId={resolvedSelectedSchedaDayId}
          onActiveDayChange={setSelectedSchedaDayId}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          userEmail={userEmail}
          onLogout={onLogout}
          showAdminEntry={isAdmin}
          onOpenAdmin={onOpenAdmin}
        />
      )}

      {selectedExerciseData && (
        <ExerciseDetailModal
          key={`${selectedPlanId ?? 'none'}:${selectedExerciseData.day.id}:${selectedExerciseData.exercise.id}`}
          day={selectedExerciseData.day}
          exercise={selectedExerciseData.exercise}
          onClose={() => setSelectedExerciseRef(null)}
          onStartWorkout={handleStartWorkout}
          onSaveTargetOverrides={handleSaveTargetOverrides}
          onMarkExerciseCompleted={(dayId, exerciseId) =>
            markExerciseCompleted(effectiveSelectedPlan?.id ?? null, dayId, exerciseId)
          }
          onMarkExerciseUncompleted={(dayId, exerciseId) =>
            unmarkExerciseCompleted(effectiveSelectedPlan?.id ?? null, dayId, exerciseId)
          }
          isExerciseCompleted={Boolean(
            completedExerciseIdsByDay[selectedExerciseData.day.id]?.includes(
              selectedExerciseData.exercise.id
            )
          )}
        />
      )}

      {activeWorkoutData && (
        <ActiveWorkoutScreen
          day={activeWorkoutData.day}
          initialExercise={activeWorkoutData.initialExercise}
          onClose={() => setActiveWorkoutData(null)}
          onExerciseCompleted={handleExerciseCompleted}
        />
      )}

      <BottomNav
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        showAdminEntry={isAdmin}
        onOpenAdmin={onOpenAdmin}
      />
    </div>
  );
}
