import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const isConfigured = Boolean(supabaseUrl && !supabaseUrl.includes('your-project-id') && hasAnonKey);

    if (!isConfigured) {
      return NextResponse.json({
        status: 'configured_pending_credentials',
        message: 'Supabase integration code is complete. Add your live SUPABASE_URL and ANON_KEY to .env.local',
        configured: false,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }

    const supabase = await createClient();
    const { data: campaigns, error } = await supabase.from('campaigns').select('id, title, brand_name').limit(5);

    if (error) {
      return NextResponse.json({
        status: 'connection_established_pending_schema',
        message: 'Connected to Supabase project successfully! Next step: Execute supabase/schema.sql in your Supabase SQL Editor.',
        configured: true,
        project_url: supabaseUrl,
        error_details: error.message,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Supabase backend connected & database schema active!',
      configured: true,
      data: { campaigns },
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err?.message || 'Unknown error testing Supabase connection',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
