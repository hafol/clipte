import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdminNotConfiguredError } from '@/lib/supabase/admin';

/** Signed-in user + a Supabase client that acts as them (row-level security applies). */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export const jsonError = (message: string, status = 400) => NextResponse.json({ ok: false, error: message }, { status });

/** Consistent error response for route handlers. */
export function handleRouteError(err: unknown) {
  if (err instanceof AdminNotConfiguredError) return jsonError(err.message, 503);
  const message = err instanceof Error ? err.message : 'Server error';
  console.error('[api]', message);
  return jsonError(message, 500);
}
