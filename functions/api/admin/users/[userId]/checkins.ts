import { createBodyCheckin, fail, readJson, requireManager } from './_lib';
import type { Env } from './_lib';

interface CreateCheckinPayload {
  recordedAt: string;
  weight: number;
  fat?: number | null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireManager(request, env);
  if (auth instanceof Response) return auth;

  const userId = params.userId;
  if (!userId) {
    return fail(400, 'invalid_user', 'User id is required.');
  }

  const bodyOrResponse = await readJson<CreateCheckinPayload>(request);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;

  const weight = Number(bodyOrResponse.weight);
  const fat = bodyOrResponse.fat === undefined || bodyOrResponse.fat === null ? null : Number(bodyOrResponse.fat);

  if (!bodyOrResponse.recordedAt?.trim() || !Number.isFinite(weight) || weight <= 0) {
    return fail(400, 'invalid_payload', 'Recorded date and positive weight are required.');
  }

  if (fat !== null && (!Number.isFinite(fat) || fat < 0 || fat > 100)) {
    return fail(400, 'invalid_payload', 'Body fat must be between 0 and 100.');
  }

  return createBodyCheckin(env, auth, userId, {
    recordedAt: bodyOrResponse.recordedAt.trim(),
    weight,
    fat,
  });
};
