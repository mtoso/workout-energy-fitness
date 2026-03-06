import { loginWithProvider } from './_provider-login';
import type { Env } from '../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  loginWithProvider(request, env, 'google');
