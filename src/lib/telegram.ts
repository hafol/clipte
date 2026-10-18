// Telegram Bot API helpers (server only). The bot token lives in TELEGRAM_BOT_TOKEN; the
// database keeps its own copy in Vault (set by the admin "Connect bot" button) so it can send
// notifications straight from a trigger.
import { createHash } from 'crypto';

const token = () => process.env.TELEGRAM_BOT_TOKEN || '';
export const telegramConfigured = () => !!token();

export async function tg<T = any>(method: string, body?: Record<string, unknown>): Promise<{ ok: boolean; result?: T; description?: string }> {
  if (!token()) return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not set' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, description: e instanceof Error ? e.message : 'network error' };
  }
}

let bot: { username: string; name: string } | null = null;
/** @username of the bot (cached per server instance). */
export async function botInfo() {
  if (bot) return bot;
  const r = await tg<{ username: string; first_name: string }>('getMe');
  if (r.ok && r.result) bot = { username: r.result.username, name: r.result.first_name };
  return bot;
}

/** Secret Telegram sends back on every webhook call — derived from the token, so no extra setting. */
export const webhookSecret = () => createHash('sha256').update(`clipte-telegram:${token()}`).digest('hex').slice(0, 48);

export type TgLang = 'en' | 'ru' | 'kk';
export const tgLang = (code?: string | null): TgLang => (code?.startsWith('kk') ? 'kk' : code?.startsWith('ru') ? 'ru' : 'en');

export const BOT_TEXT: Record<TgLang, Record<'linked' | 'badCode' | 'hello' | 'stopped' | 'resumed' | 'help', string>> = {
  en: {
    linked: '✅ Connected! Hi {name} — Clipte notifications will arrive here: clip checks, earnings, payouts and new campaigns.\n\nSend /stop to pause them, /start to turn them back on.',
    badCode: '⚠️ This link has expired. Open Clipte → Settings → Notifications and press “Connect Telegram” again.',
    hello: '👋 This is the Clipte bot. To get your notifications here, open Clipte → Settings → Notifications and press “Connect Telegram”.',
    stopped: '🔕 Notifications paused. Send /start to turn them back on.',
    resumed: '🔔 Notifications are on again.',
    help: 'Commands: /start — turn notifications on · /stop — pause them.',
  },
  ru: {
    linked: '✅ Подключено! Привет, {name} — уведомления Clipte будут приходить сюда: проверки клипов, заработок, выплаты и новые кампании.\n\n/stop — поставить на паузу, /start — включить снова.',
    badCode: '⚠️ Ссылка устарела. Откройте Clipte → Настройки → Уведомления и снова нажмите «Подключить Telegram».',
    hello: '👋 Это бот Clipte. Чтобы получать уведомления здесь, откройте Clipte → Настройки → Уведомления и нажмите «Подключить Telegram».',
    stopped: '🔕 Уведомления на паузе. Отправьте /start, чтобы включить снова.',
    resumed: '🔔 Уведомления снова включены.',
    help: 'Команды: /start — включить уведомления · /stop — поставить на паузу.',
  },
  kk: {
    linked: '✅ Қосылды! Сәлем, {name} — Clipte хабарламалары осында келеді: клип тексерулері, табыс, төлемдер және жаңа науқандар.\n\n/stop — кідірту, /start — қайта қосу.',
    badCode: '⚠️ Сілтеменің мерзімі өтті. Clipte → Баптаулар → Хабарламалар бөліміне өтіп, «Telegram қосу» батырмасын қайта басыңыз.',
    hello: '👋 Бұл Clipte боты. Хабарламаларды осында алу үшін Clipte → Баптаулар → Хабарламалар бөліміне өтіп, «Telegram қосу» батырмасын басыңыз.',
    stopped: '🔕 Хабарламалар кідіртілді. Қайта қосу үшін /start жіберіңіз.',
    resumed: '🔔 Хабарламалар қайта қосылды.',
    help: 'Командалар: /start — хабарламаларды қосу · /stop — кідірту.',
  },
};
