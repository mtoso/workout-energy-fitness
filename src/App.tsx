import { useCallback, useEffect, useState } from 'react';
import { BottomNav } from './components/navigation/BottomNav';
import { ExerciseDetailModal } from './components/modals/ExerciseDetailModal';
import { ActiveWorkoutScreen } from './components/overlays/ActiveWorkoutScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SchedaScreen } from './components/screens/SchedaScreen';
import { INITIAL_SCHEDA_DATA } from './data/workout-data';
import { useScreenWakeLock } from './hooks/useScreenWakeLock';
import type { Exercise, WorkoutDay } from './types/workout';

interface SelectedExerciseData {
  day: WorkoutDay;
  exercise: Exercise;
}

interface ActiveWorkoutData {
  day: WorkoutDay;
  initialExercise: Exercise | null;
}

const ACTIVE_SCHEDA_DAY_STORAGE_KEY = 'workout-active-scheda-day-id';

export default function App() {
  useScreenWakeLock(true);

  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [schedaData, setSchedaData] =
    useState<WorkoutDay[]>(INITIAL_SCHEDA_DATA);
  const [selectedSchedaDayId, setSelectedSchedaDayId] = useState<number>(() => {
    const fallbackDayId = INITIAL_SCHEDA_DATA[0]?.id ?? 1;
    if (typeof window === 'undefined') return fallbackDayId;

    const storedValue = window.localStorage.getItem(
      ACTIVE_SCHEDA_DAY_STORAGE_KEY
    );
    const parsedValue = Number(storedValue);
    const isStoredDayValid =
      Number.isInteger(parsedValue) &&
      INITIAL_SCHEDA_DATA.some((day) => day.id === parsedValue);

    return isStoredDayValid ? parsedValue : fallbackDayId;
  });
  const [completedExerciseIdsByDay, setCompletedExerciseIdsByDay] =
    useState<Record<number, string[]>>({});
  const [selectedExerciseData, setSelectedExerciseData] =
    useState<SelectedExerciseData | null>(null);
  const [activeWorkoutData, setActiveWorkoutData] =
    useState<ActiveWorkoutData | null>(null);

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleUpdateDay = (dayId: number, newExercises: Exercise[]) => {
    setSchedaData((prev) =>
      prev.map((day) =>
        day.id === dayId ? { ...day, exercises: newExercises } : day
      )
    );
  };

  const markExerciseCompleted = useCallback(
    (dayId: number, exerciseId: string) => {
      setCompletedExerciseIdsByDay((prev) => {
        const prevCompleted = prev[dayId] ?? [];
        if (prevCompleted.includes(exerciseId)) return prev;

        return { ...prev, [dayId]: [...prevCompleted, exerciseId] };
      });
    },
    []
  );

  const unmarkExerciseCompleted = useCallback(
    (dayId: number, exerciseId: string) => {
      setCompletedExerciseIdsByDay((prev) => {
        const prevCompleted = prev[dayId] ?? [];
        if (!prevCompleted.includes(exerciseId)) return prev;

        return {
          ...prev,
          [dayId]: prevCompleted.filter((id) => id !== exerciseId),
        };
      });
    },
    []
  );

  const handleStartWorkout = useCallback(
    (day: WorkoutDay, initialExercise: Exercise | null) => {
      // Reset completion markers for this day when a new workout starts.
      setCompletedExerciseIdsByDay((prev) => ({ ...prev, [day.id]: [] }));
      setActiveWorkoutData({ day, initialExercise });
    },
    []
  );

  const handleExerciseCompleted = useCallback(
    (exerciseId: string) => {
      const activeDayId = activeWorkoutData?.day.id;
      if (!activeDayId) return;

      markExerciseCompleted(activeDayId, exerciseId);
    },
    [activeWorkoutData?.day.id, markExerciseCompleted]
  );

  useEffect(() => {
    window.localStorage.setItem(
      ACTIVE_SCHEDA_DAY_STORAGE_KEY,
      String(selectedSchedaDayId)
    );
  }, [selectedSchedaDayId]);

  return (
    <div className="app-shell">
      {currentScreen === 'home' && (
        <HomeScreen
          onNavigate={handleNavigate}
          onStartWorkout={handleStartWorkout}
          schedaData={schedaData}
        />
      )}

      {currentScreen === 'scheda' && (
        <SchedaScreen
          onExerciseSelect={(day, ex) =>
            setSelectedExerciseData({ day, exercise: ex })
          }
          onStartWorkout={handleStartWorkout}
          schedaData={schedaData}
          onUpdateDay={handleUpdateDay}
          completedExerciseIdsByDay={completedExerciseIdsByDay}
          activeDayId={selectedSchedaDayId}
          onActiveDayChange={setSelectedSchedaDayId}
        />
      )}

      {currentScreen === 'profile' && <ProfileScreen />}

      {selectedExerciseData && (
        <ExerciseDetailModal
          day={selectedExerciseData.day}
          exercise={selectedExerciseData.exercise}
          onClose={() => setSelectedExerciseData(null)}
          onStartWorkout={handleStartWorkout}
          onMarkExerciseCompleted={markExerciseCompleted}
          onMarkExerciseUncompleted={unmarkExerciseCompleted}
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

      <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
    </div>
  );
}
