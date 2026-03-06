export interface ApiErrorPayload {
  error: string;
  message?: string;
  details?: unknown;
}

export const json = (payload: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  });

export const fail = (
  status: number,
  error: string,
  message?: string,
  details?: unknown
) => json({ error, message, details } satisfies ApiErrorPayload, status);
