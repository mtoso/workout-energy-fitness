import { assignCoachToClient, fail, getManagedUserDetail, json, readJson, requireAdmin } from './_lib';
import type { Env } from './_lib';

interface AssignCoachPayload {
  coachUserId?: string | null;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', "L'identificativo utente è obbligatorio.");
  }

  const bodyOrResponse = await readJson<AssignCoachPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const result = await assignCoachToClient(
    env,
    userId,
    typeof bodyOrResponse.coachUserId === 'string' ? bodyOrResponse.coachUserId.trim() || null : null
  );
  if (result instanceof Response) return result;

  const detail = await getManagedUserDetail(env, auth, userId);
  return detail instanceof Response ? detail : json(detail);
};
