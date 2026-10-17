import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client using the SECRET key (service_role).
// It bypasses row-level security, so it must never be imported by client components.
// Use it only for system work: deposit webhooks, bio verification, view tracking.

let cached: SupabaseClient | null = null;

export class AdminNotConfiguredError extends Error {
  constructor() {
    super('SUPABASE_SECRET_KEY is not set — add it to .env.local (Supabase → Project Settings → API Keys → Secret key).');
  }
}

export function getAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') throw new Error('getAdminClient() must only run on the server');
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new AdminNotConfiguredError();
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
