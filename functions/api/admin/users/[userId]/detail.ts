import { fail, getManagedUserDetail, json, requireManager } from './_lib';
import type { Env } from './_lib';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', "L'identificativo utente è obbligatorio.");
  }

  const detail = await getManagedUserDetail(env, auth, userId);
  return detail instanceof Response ? detail : json(detail);
};
