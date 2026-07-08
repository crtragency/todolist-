import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a route handler, translating thrown auth/validation errors to responses. */
export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((err: unknown) => {
    if (err instanceof ZodError) {
      return errorResponse(err.issues.map((i) => i.message).join(', '), 422);
    }
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Internal error';
    if (status >= 500) console.error(err);
    return errorResponse(message, status);
  });
}
