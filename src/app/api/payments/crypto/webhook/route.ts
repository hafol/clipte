import { NextResponse } from 'next/server';
import { verifyCryptoPayWebhook } from '@/lib/cryptopay';
import { getAdminClient } from '@/lib/supabase/admin';
import { handleRouteError } from '@/lib/api';

// CryptoPay → "invoice_paid". The signature is checked, then the deposit is confirmed
// through the confirm_escrow_deposit() database function (idempotent, server-only).
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('crypto-pay-api-signature') || '';
    if (!verifyCryptoPayWebhook(rawBody, signature)) {
      return NextResponse.json({ ok: false, error: 'Invalid webhook signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    if (payload.update_type !== 'invoice_paid') return NextResponse.json({ ok: true, ignored: true });

    const invoice = payload.payload;
    const { data, error } = await getAdminClient().rpc('confirm_escrow_deposit', {
      p_invoice_id: Number(invoice.invoice_id),
      p_amount: Number(invoice.amount),
    });
    if (error) {
      console.error('[CryptoPay webhook] confirm failed:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // data === false → unknown invoice or already processed (safe to acknowledge)
    return NextResponse.json({ ok: true, processed: data === true });
  } catch (err) {
    return handleRouteError(err);
  }
}
