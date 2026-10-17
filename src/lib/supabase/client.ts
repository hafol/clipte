import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-supabase-id.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const createClient = getSupabaseBrowserClient;
export const supabase = getSupabaseBrowserClient();
