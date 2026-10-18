import { NextResponse } from 'next/server';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';
import { botInfo, telegramConfigured } from '@/lib/telegram';

// "Connect Telegram": a one-time code (15 min) wrapped in a t.me deep link. Opening it starts
// the bot with /start <code>, and the webhook links the chat to this account.
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return jsonError('Please sign in', 401);
    if (!telegramConfigured()) return jsonError('Telegram is not set up yet', 503);
    const bot = await botInfo();
    if (!bot) return jsonError('Could not reach the Telegram bot', 502);

    const { lang } = await req.json().catch(() => ({ lang: 'en' }));
    const { data: code, error } = await supabase.rpc('telegram_link_code', { p_lang: lang });
    if (error) return jsonError(error.message);
    return NextResponse.json({ ok: true, url: `https://t.me/${bot.username}?start=${code}`, bot: bot.username });
  } catch (err) {
    return handleRouteError(err);
  }
}
