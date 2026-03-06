import { signupWithProvider } from './_provider-signup';
import type { Env } from '../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  signupWithProvider(request, env, 'apple');
