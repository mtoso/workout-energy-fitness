import { signupWithGoogle } from './_google-signup';
import type { Env } from '../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  signupWithGoogle(request, env);
