import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { isApiError } from '../lib/api/client';
import { adminWorkoutQueryOptions } from '../lib/api/query-options';
import { saveAdminUserWorkoutPlan } from '../lib/api/workout';
import { queryClient } from '../lib/query-client';
import type { WorkoutDay, WorkoutPlanInput } from '../types/workout';

const defaultDaysTemplate: WorkoutDay[] = [
  {
    id: 1,
    name: 'Giorno 1',
    focus: 'Focus',
    exercises: [
      {
        id: 'ex-1',
        name: 'Esercizio',
        sets: 3,
        reps: '10',
        rest: "1'",
      },
    ],
  },
];

export const AdminUserWorkoutPage = () => {
  const params = useParams({ from: '/admin/users/$userId/workout' });
  const userId = params.userId;
  const navigate = useNavigate();

  const workoutQuery = useQuery(adminWorkoutQueryOptions(userId));

  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const [draftDaysJson, setDraftDaysJson] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const initialTitle = workoutQuery.data?.plan?.title ?? 'Scheda personalizzata';
  const initialDaysJson = useMemo(
    () => JSON.stringify(workoutQuery.data?.plan?.days ?? defaultDaysTemplate, null, 2),
    [workoutQuery.data?.plan?.days]
  );

  const title = draftTitle ?? initialTitle;
  const daysJson = draftDaysJson ?? initialDaysJson;

  const saveMutation = useMutation({
    mutationFn: (payload: WorkoutPlanInput) => saveAdminUserWorkoutPlan(userId, payload),
    onSuccess: async (data) => {
      setSaveError(null);
      setSaveOk('Scheda salvata con successo.');
      setDraftTitle(data.plan?.title ?? 'Scheda personalizzata');
      setDraftDaysJson(JSON.stringify(data.plan?.days ?? defaultDaysTemplate, null, 2));
      await queryClient.invalidateQueries({ queryKey: ['admin', 'workout', userId] });
      await queryClient.invalidateQueries({ queryKey: ['workout', 'me'] });
    },
    onError: (err) => {
      setSaveOk(null);
      setSaveError(isApiError(err) ? err.message : 'Salvataggio fallito.');
    },
  });

  const parsedDays = useMemo(() => {
    try {
      const parsed = JSON.parse(daysJson) as WorkoutDay[];
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [daysJson]);

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Editor Scheda</h1>
            <p className="text-zinc-500">
              Utente:{' '}
              <span className="font-semibold text-zinc-700">
                {workoutQuery.data?.user.email ?? userId}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/users"
              className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl font-semibold"
            >
              Torna utenti
            </Link>
            <button
              onClick={() => {
                void navigate({ to: '/' });
              }}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl font-semibold"
            >
              App utente
            </button>
          </div>
        </div>

        {workoutQuery.isLoading && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-500">
            Caricamento scheda...
          </div>
        )}

        {workoutQuery.isError && (
          <div className="bg-red-100 border border-red-200 rounded-2xl p-5 text-red-700">
            Errore nel caricamento scheda.
          </div>
        )}

        {!workoutQuery.isLoading && !workoutQuery.isError && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                Titolo scheda
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={title}
                onChange={(event) => setDraftTitle(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                Giorni (JSON)
              </label>
              <textarea
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 h-[420px] font-mono text-xs"
                value={daysJson}
                onChange={(event) => setDraftDaysJson(event.target.value)}
              />
            </div>

            {parsedDays === null && (
              <div className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl px-3 py-2">
                JSON non valido. Correggi il formato prima di salvare.
              </div>
            )}

            {saveError && (
              <div className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl px-3 py-2">
                {saveError}
              </div>
            )}

            {saveOk && (
              <div className="text-sm text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-2">
                {saveOk}
              </div>
            )}

            <button
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
              disabled={saveMutation.isPending || parsedDays === null}
              onClick={() => {
                setSaveError(null);
                setSaveOk(null);
                if (!parsedDays) return;

                saveMutation.mutate({
                  title: title.trim() || 'Scheda personalizzata',
                  days: parsedDays,
                });
              }}
            >
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva scheda'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
