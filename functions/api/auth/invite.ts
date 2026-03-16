import { getInviteMetadata } from '../_lib/users';
import { json } from '../_lib/response';
import type { Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';
  const metadata = await getInviteMetadata(env, token);
  return json(metadata);
};
