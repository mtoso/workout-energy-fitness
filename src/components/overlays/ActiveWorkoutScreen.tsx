import {
  Calendar,
  Check,
  FileText,
  SkipForward,
  Timer,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Exercise, WorkoutDay } from '../../types/workout';
import { getTargetForSet, parseRestTime } from '../../utils/workout';

interface ActiveWorkoutScreenProps {
  day: WorkoutDay;
  initialExercise: Exercise | null;
  onClose: () => void;
  onExerciseCompleted?: (exerciseId: string) => void;
}

const REST_TIMER_PRESETS = [60, 90, 120];
const getNowMs = () => new Date().getTime();

export const ActiveWorkoutScreen = ({
  day,
  initialExercise,
  onClose,
  onExerciseCompleted,
}: ActiveWorkoutScreenProps) => {
  const [queue, setQueue] = useState<Exercise[]>(() => {
    let initialQ = [...day.exercises];

    if (initialExercise) {
      const idx = initialQ.findIndex((e) => e.id === initialExercise.id);
      if (idx > 0) {
        initialQ = [...initialQ.slice(idx), ...initialQ.slice(0, idx)];
      }
    }

    return initialQ;
  });

  const [setNum, setSetNum] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [restDuration, setRestDuration] = useState(0);
  const [restEndAt, setRestEndAt] = useState<number | null>(null);
  const [showExerciseCompleteConfirm, setShowExerciseCompleteConfirm] =
    useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');

  const currentEx = queue[0];
  const nextEx = queue.length > 1 ? queue[1] : null;

  const totalExCount = day.exercises.length;
  const completedCount = totalExCount - queue.length;

  const handleRestComplete = useCallback(() => {
    setIsResting(false);
    setRestEndAt(null);
    setTimeLeft(0);

    setSetNum((prevSetNum) => {
      if (prevSetNum < currentEx.sets) {
        return prevSetNum + 1;
      }

      setQueue((prevQueue) => {
        if (prevQueue.length <= 1) {
          setIsCompleted(true);
        }
        return prevQueue.slice(1);
      });

      return 1;
    });
  }, [currentEx.sets]);

  useEffect(() => {
    if (!isResting || restEndAt === null) return;

    const syncTimer = () => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((restEndAt - getNowMs()) / 1000)
      );
      setTimeLeft(remainingSeconds);
    };

    syncTimer();

    const interval = window.setInterval(syncTimer, 250);
    const handleVisibility = () => syncTimer();
    const handleFocus = () => syncTimer();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isResting, restEndAt]);

  useEffect(() => {
    if (!isResting || timeLeft > 0) return;

    const timeout = window.setTimeout(() => {
      handleRestComplete();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [handleRestComplete, isResting, timeLeft]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (currentEx?.previous && !isResting) {
        setCurrentWeight(currentEx.previous.weight.toString());
      } else {
        setCurrentWeight('');
      }
      setCurrentReps('');
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [currentEx, isResting]);

  const startRestTimer = () => {
    const restSeconds = parseRestTime(currentEx.rest);
    const endAt = getNowMs() + restSeconds * 1000;

    setTimeLeft(restSeconds);
    setRestDuration(restSeconds);
    setRestEndAt(endAt);
    setIsResting(true);
  };

  const handleCompleteSet = () => {
    if (setNum >= currentEx.sets) {
      setShowExerciseCompleteConfirm(true);
      return;
    }

    startRestTimer();
  };

  const handleConfirmExerciseComplete = () => {
    setShowExerciseCompleteConfirm(false);
    onExerciseCompleted?.(currentEx.id);
    startRestTimer();
  };

  const handleSetPresetTimer = (seconds: number) => {
    const endAt = getNowMs() + seconds * 1000;

    setTimeLeft(seconds);
    setRestDuration(seconds);
    setRestEndAt(endAt);
  };

  const handleAdjustTimer = (deltaSeconds: number) => {
    setRestDuration((prev) => Math.max(1, prev + deltaSeconds));
    setRestEndAt((prevEndAt) => {
      if (prevEndAt === null) return null;

      const now = getNowMs();
      const currentRemaining = Math.max(
        0,
        Math.ceil((prevEndAt - now) / 1000)
      );
      const nextRemaining = Math.max(0, currentRemaining + deltaSeconds);

      setTimeLeft(nextRemaining);
      return now + nextRemaining * 1000;
    });
  };

  const handleSkipExercise = () => {
    setQueue((prev) => {
      const newQueue = [...prev];
      const skipped = newQueue.shift();
      if (skipped) newQueue.push(skipped);
      return newQueue;
    });
    setShowExerciseCompleteConfirm(false);
    setSetNum(1);
    setIsResting(false);
    setRestEndAt(null);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatWeight = (weight: number | string | undefined) => {
    if (weight === undefined || weight === null) return null;

    const normalizedWeight = `${weight}`.trim();
    if (!normalizedWeight) return null;

    return /[a-zA-Z]/.test(normalizedWeight)
      ? normalizedWeight
      : `${normalizedWeight} kg`;
  };

  if (isCompleted) {
    return (
      <div className="absolute inset-0 z-[100] bg-emerald-500 flex flex-col items-center justify-center p-6 text-zinc-950 animate-in fade-in duration-300">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-600/50">
          <Check size={48} className="text-emerald-500" strokeWidth={3} />
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-2 text-center">
          Workout
          <br />
          Completato!
        </h2>
        <p className="text-emerald-900 font-medium mb-12 text-center">
          Ottimo lavoro. Riposati, te lo sei meritato.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-zinc-950 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition active:scale-[0.98]"
        >
          Torna alla Dashboard
        </button>
      </div>
    );
  }

  if (isResting) {
    const totalRest = Math.max(restDuration, 1);
    const progress = Math.min(
      100,
      Math.max(0, 100 - (timeLeft / totalRest) * 100)
    );
    const nextWeight = setNum < currentEx.sets
      ? formatWeight(currentWeight.trim() ? currentWeight : currentEx.previous?.weight)
      : formatWeight(nextEx?.previous?.weight);

    return (
      <div className="absolute inset-0 z-[100] bg-zinc-950 text-white flex flex-col animate-in fade-in duration-300">
        <div className="px-6 pt-16 pb-4 flex justify-between items-center relative z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 active:scale-95"
          >
            <X size={20} />
          </button>
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Timer size={14} /> Recupero
          </span>
          <button
            onClick={handleSkipExercise}
            className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 active:scale-95 hover:text-red-400"
          >
            <SkipForward size={18} />
          </button>
        </div>

        <div className="px-6 pb-2 flex items-center justify-center gap-3 z-10">
          {REST_TIMER_PRESETS.map((presetSeconds) => (
            <button
              key={presetSeconds}
              onClick={() => handleSetPresetTimer(presetSeconds)}
              className={`w-16 h-16 rounded-full text-sm font-bold transition active:scale-95 flex items-center justify-center border ${
                restDuration === presetSeconds
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {formatTime(presetSeconds)}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="w-64 h-64 relative flex items-center justify-center mb-10 z-10">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="#27272a"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="#ef4444"
                strokeWidth="6"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={
                  2 * Math.PI * 120 - (progress / 100) * (2 * Math.PI * 120)
                }
                className="transition-all duration-1000 linear"
              />
            </svg>
            <span className="text-7xl font-bold tracking-tighter tabular-nums text-white">
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="text-center z-10 px-6">
            <p className="text-zinc-400 font-medium mb-2">Preparati per</p>
            {setNum < currentEx.sets ? (
              <h3 className="text-2xl font-bold text-white">
                {currentEx.name}{' '}
                <span className="text-red-400 text-lg">
                  (Serie {setNum + 1})
                </span>
              </h3>
            ) : nextEx ? (
              <h3 className="text-2xl font-bold text-white">
                {nextEx.name}{' '}
                <span className="text-zinc-500 text-lg">
                  (Prossimo Esercizio)
                </span>
              </h3>
            ) : (
              <h3 className="text-2xl font-bold text-white">
                Fine Allenamento!
              </h3>
            )}
            {nextWeight && (
              <p className="text-zinc-400 font-medium mt-3">
                Peso previsto:{' '}
                <span className="text-white font-bold">{nextWeight}</span>
              </p>
            )}
          </div>
        </div>

        <div className="px-6 z-10 flex items-center justify-center gap-4 mb-3">
          <button
            onClick={() => handleAdjustTimer(-30)}
            className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold text-sm hover:bg-zinc-700 transition active:scale-[0.98] flex items-center justify-center"
          >
            -30s
          </button>
          <button
            onClick={() => handleAdjustTimer(30)}
            className="w-16 h-16 rounded-full bg-red-500 border border-red-500 text-white font-bold text-sm hover:bg-red-400 transition active:scale-[0.98] flex items-center justify-center"
          >
            +30s
          </button>
        </div>

        <div className="p-6 pt-0 pb-12 z-10 flex gap-3">
          <button
            onClick={handleRestComplete}
            className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition active:scale-[0.98]"
          >
            <SkipForward size={20} /> Salta Recupero
          </button>
        </div>
      </div>
    );
  }

  const currentTargetStr = getTargetForSet(
    currentEx.reps,
    setNum - 1,
    currentEx.sets
  );
  const showRepsLabel = !(
    currentTargetStr.toLowerCase().includes('lato') ||
    currentTargetStr.toLowerCase().includes('max')
  );
  const trainerNote = currentEx.trainerNote?.trim();

  return (
    <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="w-full bg-zinc-100 h-1.5 flex">
        {Array.from({ length: totalExCount }).map((_, i) => (
          <div
            key={`prog-${i}`}
            className={`h-full flex-1 border-r border-white last:border-0 ${
              i < completedCount
                ? 'bg-emerald-500'
                : i === completedCount
                ? 'bg-emerald-400'
                : 'bg-zinc-200'
            }`}
          />
        ))}
      </div>

      <div className="px-6 pt-12 pb-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 active:scale-95 transition"
        >
          <X size={20} />
        </button>
        <div className="text-center flex-1 mx-4">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-0.5">
            Esercizio {completedCount + 1} di {totalExCount}
          </p>
          <p className="text-zinc-900 font-bold truncate">{currentEx.name}</p>
        </div>
        <button
          onClick={handleSkipExercise}
          className="flex flex-col items-center justify-center text-zinc-400 hover:text-emerald-500 active:scale-95 transition"
        >
          <SkipForward size={22} />
          <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">
            Salta
          </span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 pb-32">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-zinc-900 text-white px-4 py-1.5 rounded-full font-bold text-sm mb-4 shadow-md">
            Serie {setNum} di {currentEx.sets}
          </div>
          <h2 className="text-4xl font-bold text-zinc-900 tracking-tight leading-none mb-3">
            {currentEx.name}
          </h2>

          <p className="text-zinc-500 font-medium text-lg flex justify-center items-center gap-2">
            Target:{' '}
            <span className="text-zinc-900 font-bold">
              {currentTargetStr} {showRepsLabel ? 'reps' : ''}
            </span>
          </p>
        </div>

        {currentEx.previous && (
          <div
            className={`bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
              trainerNote ? 'mb-4' : 'mb-8'
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Calendar size={16} />
              <p className="text-xs font-bold uppercase tracking-wider">
                Ultima volta ({currentEx.previous.date})
              </p>
            </div>
            <p className="text-emerald-900 font-bold text-xl">
              {currentEx.previous.weight} kg{' '}
              <span className="text-emerald-600 font-medium text-base">
                x {currentEx.previous.reps} reps
              </span>
            </p>
          </div>
        )}

        {trainerNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                  Nota Personal Trainer
                </p>
                <p className="text-sm font-medium text-amber-900 leading-relaxed">
                  {trainerNote}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-center text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
              Kg sollevati
            </label>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-2xl text-center py-6 text-3xl font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-300"
              placeholder="0"
            />
          </div>
          <div className="relative">
            <label className="block text-center text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
              Ripetizioni
            </label>
            <input
              type="number"
              value={currentReps}
              onChange={(e) => setCurrentReps(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-2xl text-center py-6 text-3xl font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-300"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-zinc-100 pb-10">
        <button
          onClick={handleCompleteSet}
          className="w-full bg-emerald-500 text-zinc-950 font-bold py-5 rounded-[1.25rem] text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Check size={24} strokeWidth={3} /> Completa Serie
        </button>
      </div>

      {showExerciseCompleteConfirm && (
        <div className="absolute inset-0 z-[120] bg-zinc-950/50 p-6 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <p className="text-zinc-900 font-bold text-lg mb-1">
              Confermi fine esercizio?
            </p>
            <p className="text-zinc-500 text-sm mb-5">
              Dopo la conferma parte il recupero e si passa all&apos;esercizio
              successivo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExerciseCompleteConfirm(false)}
                className="bg-zinc-100 text-zinc-700 font-bold py-3.5 rounded-2xl hover:bg-zinc-200 transition active:scale-[0.98]"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmExerciseComplete}
                className="bg-emerald-500 text-zinc-950 font-bold py-3.5 rounded-2xl hover:bg-emerald-400 transition active:scale-[0.98]"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
