import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// OAuth / magic-link return URL (Google, Discord, email confirmation, password reset).
// The profile row is created by the database trigger on sign-up — we never write
// profile fields here (the old version reset role to 'clipper' on every login).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/dashboard';
  // only allow same-site relative redirects
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error('[auth/callback]', error.message);
  }

  return NextResponse.redirect(`${origin}/register?auth_error=1`);
}
