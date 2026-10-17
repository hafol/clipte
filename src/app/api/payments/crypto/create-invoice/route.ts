import { NextResponse } from 'next/server';
import { createCryptoPayInvoice } from '@/lib/cryptopay';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';
import { getAdminClient } from '@/lib/supabase/admin';

const MIN_DEPOSIT = 10;

// Brand funds one of THEIR campaigns. The invoice is recorded in escrow_deposits,
// and the campaign is credited only when CryptoPay confirms payment (webhook / check).
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return jsonError('Please sign in', 401);

    const { campaignId, amount } = await req.json();
    const numAmount = Math.round(Number(amount) * 100) / 100;
    if (!campaignId) return jsonError('campaignId is required');
    if (!numAmount || numAmount < MIN_DEPOSIT) return jsonError(`Minimum deposit is $${MIN_DEPOSIT}`);

    // RLS: brands can only read their own non-active campaigns
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id, brand_name, title, status')
      .eq('id', campaignId)
      .maybeSingle();
    if (!campaign || campaign.brand_id !== user.id) return jsonError('Campaign not found', 404);
    if (!['pending_payment', 'pending_review', 'active', 'paused'].includes(campaign.status)) {
      return jsonError('This campaign can no longer be funded');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invoiceRes = await createCryptoPayInvoice({
      amount: numAmount.toFixed(2),
      description: `Clipte escrow — ${campaign.title}`.slice(0, 1024),
      hiddenMessage: 'Payment received. Your campaign budget will update in a moment.',
      paidBtnName: 'openChannel',
      paidBtnUrl: `${appUrl}/dashboard/campaigns`,
      payload: JSON.stringify({ campaignId: campaign.id, brandId: user.id, type: 'campaign_escrow_deposit' }),
      expiresIn: 3600,
    });
    if (!invoiceRes.ok || !invoiceRes.result) return jsonError(invoiceRes.error || 'Could not create invoice', 502);

    const { error } = await getAdminClient().from('escrow_deposits').insert({
      brand_id: user.id,
      campaign_id: campaign.id,
      invoice_id: invoiceRes.result.invoice_id,
      amount: numAmount,
      asset: 'USD',
    });
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({
      ok: true,
      invoice: invoiceRes.result,
      payUrl: invoiceRes.result.bot_invoice_url || invoiceRes.result.pay_url,
      miniAppUrl: invoiceRes.result.mini_app_invoice_url,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
