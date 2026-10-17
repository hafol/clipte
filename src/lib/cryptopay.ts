import crypto from 'crypto';

const CRYPTO_PAY_TOKEN = process.env.CRYPTO_PAY_TOKEN || '';
const CRYPTO_PAY_NET = process.env.CRYPTO_PAY_NET || 'testnet';

const BASE_URL =
  CRYPTO_PAY_NET === 'testnet'
    ? 'https://testnet-pay.crypt.bot/api'
    : 'https://pay.crypt.bot/api';

export interface CreateInvoiceParams {
  amount: number | string;
  /** limit which coins are accepted (comma-separated); default: all supported */
  asset?: string;
  description?: string;
  hiddenMessage?: string;
  paidBtnName?: 'viewItem' | 'openChannel' | 'openBot' | 'callback';
  paidBtnUrl?: string;
  payload?: string;
  expiresIn?: number;
}

export interface CryptoInvoiceResult {
  invoice_id: number;
  hash: string;
  currency_type: string;
  asset: string;
  amount: string;
  pay_url: string;
  bot_invoice_url: string;
  mini_app_invoice_url: string;
  web_app_invoice_url: string;
  description?: string;
  status: 'active' | 'paid' | 'expired';
  created_at: string;
  expiration_date?: string;
}

export async function createCryptoPayInvoice(
  params: CreateInvoiceParams
): Promise<{ ok: boolean; result?: CryptoInvoiceResult; error?: string }> {
  if (!CRYPTO_PAY_TOKEN) {
    return { ok: false, error: 'CRYPTO_PAY_TOKEN is not configured' };
  }

  try {
    const res = await fetch(`${BASE_URL}/createInvoice`, {
      method: 'POST',
      headers: {
        'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Bill in US dollars; the payer picks the coin in CryptoBot. (A crypto-denominated
        // invoice would read "500" as 500 BTC and wouldn't match the dollar escrow amount.)
        currency_type: 'fiat',
        fiat: 'USD',
        accepted_assets: params.asset || 'USDT,USDC,TON,BTC,ETH',
        amount: String(params.amount),
        description: params.description || 'Clipte Escrow Bounty Deposit',
        hidden_message: params.hiddenMessage || 'Thank you for funding your bounty pool on Clipte!',
        paid_btn_name: params.paidBtnName || 'openChannel',
        paid_btn_url: params.paidBtnUrl,
        payload: params.payload,
        expires_in: params.expiresIn || 3600,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.error?.name || data.error || 'Failed to create invoice' };
    }

    return { ok: true, result: data.result };
  } catch (err: any) {
    console.error('CryptoPay createInvoice error:', err);
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export async function getCryptoPayInvoice(
  invoiceId: number | string
): Promise<{ ok: boolean; result?: CryptoInvoiceResult; error?: string }> {
  if (!CRYPTO_PAY_TOKEN) {
    return { ok: false, error: 'CRYPTO_PAY_TOKEN is not configured' };
  }

  try {
    const res = await fetch(`${BASE_URL}/getInvoices?invoice_ids=${invoiceId}`, {
      method: 'GET',
      headers: {
        'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN,
      },
    });

    const data = await res.json();
    if (!data.ok || !data.result?.items?.[0]) {
      return { ok: false, error: data.error?.name || 'Invoice not found' };
    }

    return { ok: true, result: data.result.items[0] };
  } catch (err: any) {
    console.error('CryptoPay getInvoice error:', err);
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export function verifyCryptoPayWebhook(rawBody: string, signature: string): boolean {
  if (!CRYPTO_PAY_TOKEN || !signature) return false;
  try {
    const secret = crypto.createHash('sha256').update(CRYPTO_PAY_TOKEN).digest();
    const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(hmac, 'hex');
    const b = Buffer.from(signature, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b); // constant-time comparison
  } catch {
    return false;
  }
}
