import { NextResponse } from 'next/server';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';
import { getAdminClient } from '@/lib/supabase/admin';
import { botInfo, telegramConfigured, tg, webhookSecret } from '@/lib/telegram';

// Admin → Tracking → Telegram bot. GET shows the state; POST connects everything in one go:
// registers the webhook, sets the bot's commands, and stores the token + site address in the
// database (Vault) so notifications can be sent from there.
async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if (!user) return jsonError('Please sign in', 401);
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return jsonError('Admins only', 403);
  return null;
}

const siteOf = (req: Request) => (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');

export async function GET(req: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    if (!telegramConfigured()) return NextResponse.json({ ok: true, token: false });
    const [bot, hook] = await Promise.all([botInfo(), tg<{ url: string; last_error_message?: string; pending_update_count?: number }>('getWebhookInfo')]);
    const expected = `${siteOf(req)}/api/telegram/webhook`;
    return NextResponse.json({
      ok: true,
      token: true,
      bot: bot?.username ?? null,
      webhook: hook.result?.url || null,
      connected: hook.result?.url === expected,
      expected,
      lastError: hook.result?.last_error_message ?? null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    if (!telegramConfigured()) return jsonError('Add TELEGRAM_BOT_TOKEN to the environment first', 400);
    const site = siteOf(req);
    if (!site.startsWith('https://')) return jsonError('Telegram needs a public https address — connect the bot from the live site', 400);

    const hook = await tg('setWebhook', {
      url: `${site}/api/telegram/webhook`,
      secret_token: webhookSecret(),
      allowed_updates: ['message'],
      drop_pending_updates: true,
    });
    if (!hook.ok) return jsonError(`Telegram: ${hook.description}`, 502);
    await tg('setMyCommands', {
      commands: [
        { command: 'start', description: 'Turn notifications on' },
        { command: 'stop', description: 'Pause notifications' },
      ],
    });
    await tg('setMyCommands', {
      language_code: 'ru',
      commands: [
        { command: 'start', description: 'Включить уведомления' },
        { command: 'stop', description: 'Поставить на паузу' },
      ],
    });
    const { error } = await getAdminClient().rpc('configure_telegram', { p_token: process.env.TELEGRAM_BOT_TOKEN, p_site: site });
    if (error) return jsonError(`Database: ${error.message} (run the v2.9 migration)`, 500);
    return NextResponse.json({ ok: true, bot: (await botInfo())?.username ?? null });
  } catch (err) {
    return handleRouteError(err);
  }
}
