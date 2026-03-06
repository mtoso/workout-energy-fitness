import { fail } from './response';

export const readJson = async <T>(request: Request): Promise<T | Response> => {
  try {
    return (await request.json()) as T;
  } catch {
    return fail(400, 'invalid_json', 'Request body must be valid JSON.');
  }
};

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
