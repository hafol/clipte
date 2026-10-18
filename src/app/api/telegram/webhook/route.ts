import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { BOT_TEXT, tg, tgLang, webhookSecret } from '@/lib/telegram';

// Updates from Telegram. Only /start [code] and /stop matter; everything else gets a short help.
// Telegram signs each call with the secret we registered in setWebhook.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== webhookSecret()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const chatId: number | undefined = msg?.chat?.id;
  const text: string = (msg?.text || '').trim();
  // private chats only; always answer 200 so Telegram doesn't retry
  if (!chatId || msg?.chat?.type !== 'private') return NextResponse.json({ ok: true });

  const db = getAdminClient();
  let lang = tgLang(msg?.from?.language_code);
  const say = (s: string) => tg('sendMessage', { chat_id: chatId, text: s, disable_web_page_preview: true });

  const [cmd, arg] = text.split(/\s+/, 2);
  if (cmd === '/start' && arg) {
    const { data } = await db.rpc('telegram_connect', { p_code: arg, p_chat_id: chatId, p_username: msg?.from?.username ?? null });
    if (data) {
      lang = (data.lang as typeof lang) || lang;
      await say(BOT_TEXT[lang].linked.replace('{name}', data.name || msg?.from?.first_name || ''));
    } else {
      await say(BOT_TEXT[lang].badCode);
    }
  } else if (cmd === '/start') {
    const { data: l } = await db.rpc('telegram_chat_enabled', { p_chat_id: chatId, p_enabled: true });
    await say(l ? BOT_TEXT[(l as typeof lang) || lang].resumed : BOT_TEXT[lang].hello);
  } else if (cmd === '/stop') {
    const { data: l } = await db.rpc('telegram_chat_enabled', { p_chat_id: chatId, p_enabled: false });
    await say(l ? BOT_TEXT[(l as typeof lang) || lang].stopped : BOT_TEXT[lang].hello);
  } else {
    await say(BOT_TEXT[lang].help);
  }
  return NextResponse.json({ ok: true });
}
