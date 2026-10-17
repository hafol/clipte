import { NextResponse } from 'next/server';
import { getCryptoPayInvoice } from '@/lib/cryptopay';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';
import { getAdminClient } from '@/lib/supabase/admin';

// Brand checks one of THEIR invoices. If CryptoPay reports it paid, the deposit is
// confirmed here too (idempotent) — useful locally, where webhooks can't reach you.
export async function GET(req: Request) {
  try {
    const { user } = await requireUser();
    if (!user) return jsonError('Please sign in', 401);

    const invoiceId = Number(new URL(req.url).searchParams.get('invoiceId'));
    if (!invoiceId) return jsonError('Missing invoiceId');

    const admin = getAdminClient();
    const { data: deposit } = await admin
      .from('escrow_deposits')
      .select('id, brand_id, status')
      .eq('invoice_id', invoiceId)
      .maybeSingle();
    if (!deposit || deposit.brand_id !== user.id) return jsonError('Invoice not found', 404);

    const res = await getCryptoPayInvoice(invoiceId);
    if (!res.ok || !res.result) return jsonError(res.error || 'Invoice not found', 404);

    const isPaid = res.result.status === 'paid';
    if (isPaid && deposit.status !== 'paid') {
      const { error } = await admin.rpc('confirm_escrow_deposit', {
        p_invoice_id: invoiceId,
        p_amount: Number(res.result.amount),
      });
      if (error) return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true, status: res.result.status, isPaid });
  } catch (err) {
    return handleRouteError(err);
  }
}
