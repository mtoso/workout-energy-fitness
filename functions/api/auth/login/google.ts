import { loginWithGoogle } from './_google-login';
import type { Env } from '../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  loginWithGoogle(request, env);
