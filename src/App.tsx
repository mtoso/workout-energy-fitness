import { useCallback, useEffect, useState } from 'react';
import { BottomNav } from './components/navigation/BottomNav';
import { ExerciseDetailModal } from './components/modals/ExerciseDetailModal';
import { ActiveWorkoutScreen } from './components/overlays/ActiveWorkoutScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SchedaScreen } from './components/screens/SchedaScreen';
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

type AppScreen = 'home' | 'scheda' | 'profile';

interface WorkoutAppProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  initialSchedaData: WorkoutDay[];
  userEmail: string;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

const ACTIVE_SCHEDA_DAY_STORAGE_KEY = 'workout-active-scheda-day-id';

export default function App({
  currentScreen,
  onNavigate,
  initialSchedaData,
  userEmail,
  isAdmin,
  onOpenAdmin,
  onLogout,
}: WorkoutAppProps) {
  useScreenWakeLock(true);

  const [schedaData, setSchedaData] = useState<WorkoutDay[]>(initialSchedaData);
  const [selectedSchedaDayId, setSelectedSchedaDayId] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;

    const storedValue = window.localStorage.getItem(
      ACTIVE_SCHEDA_DAY_STORAGE_KEY
    );
    const parsedValue = Number(storedValue);
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
  });
  const [completedExerciseIdsByDay, setCompletedExerciseIdsByDay] =
    useState<Record<number, string[]>>({});
  const [selectedExerciseData, setSelectedExerciseData] =
    useState<SelectedExerciseData | null>(null);
  const [activeWorkoutData, setActiveWorkoutData] =
    useState<ActiveWorkoutData | null>(null);

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
          onNavigate={onNavigate}
          onStartWorkout={handleStartWorkout}
          schedaData={schedaData}
          displayName={userEmail.split('@')[0] ?? userEmail}
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

      <BottomNav
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        showAdminEntry={isAdmin}
        onOpenAdmin={onOpenAdmin}
      />
    </div>
  );
}
