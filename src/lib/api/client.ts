export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isApiError = (value: unknown): value is ApiError =>
  value instanceof ApiError;

export const apiFetch = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const shouldParseJson = contentType.includes('application/json');
  const payload = shouldParseJson ? await response.json() : null;

  if (!response.ok) {
    const errorCode =
      isObject(payload) && typeof payload.error === 'string'
        ? payload.error
        : 'request_failed';
    const message =
      isObject(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Richiesta non riuscita.';
    const details = isObject(payload) ? payload.details : undefined;

    throw new ApiError(response.status, errorCode, message, details);
  }

  return payload as T;
};
