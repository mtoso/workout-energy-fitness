import { fail } from './response';

export const readJson = async <T>(request: Request): Promise<T | Response> => {
  try {
    return (await request.json()) as T;
  } catch {
    return fail(400, 'invalid_json', 'Il corpo della richiesta deve essere un JSON valido.');
  }
};

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
