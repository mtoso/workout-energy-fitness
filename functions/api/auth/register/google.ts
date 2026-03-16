import { registerWithGoogle } from './_google-register';
import type { Env } from '../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  registerWithGoogle(request, env);
