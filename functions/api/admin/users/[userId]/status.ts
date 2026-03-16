import { fail, getManagedUserDetail, json, readJson, requireAdmin, updateManagedUserStatus } from './_lib';
import type { Env } from './_lib';

interface UpdateStatusPayload {
  status?: 'active' | 'disabled';
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', "L'identificativo utente è obbligatorio.");
  }

  const bodyOrResponse = await readJson<UpdateStatusPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  if (bodyOrResponse.status !== 'active' && bodyOrResponse.status !== 'disabled') {
    return fail(400, 'invalid_status', "Lo stato account deve essere 'active' o 'disabled'.");
  }

  const result = await updateManagedUserStatus(env, auth, userId, bodyOrResponse.status);
  if (result instanceof Response) return result;

  const detail = await getManagedUserDetail(env, auth, userId);
  return detail instanceof Response ? detail : json(detail);
};
