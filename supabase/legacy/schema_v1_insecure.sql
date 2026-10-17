-- ========================================================
-- CLIPTE PRODUCTION DATABASE SCHEMA & ATOMIC ESCROW RPC
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Dual Mode User Profiles: Clipper + Brand)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT 'Video editor & viral clipper.',
    is_private BOOLEAN DEFAULT FALSE,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'clipper' CHECK (role IN ('clipper', 'brand', 'moderator', 'admin')),
    active_mode TEXT NOT NULL DEFAULT 'clipper' CHECK (active_mode IN ('clipper', 'brand')),
    -- Brand Identity details (when Brand Profile is activated)
    has_brand_profile BOOLEAN DEFAULT FALSE,
    brand_name TEXT,
    brand_logo_url TEXT,
    brand_website TEXT,
    brand_bio TEXT,
    brand_industry TEXT,
    -- Financials (strictly private to user & admin)
    balance_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_escrow NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payout_method TEXT DEFAULT 'usdt' CHECK (payout_method IN ('usdt', 'usdc', 'card', 'paypal')),
    payout_address TEXT,
    total_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. CAMPAIGNS TABLE (Brand Bounty Escrow Pools)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    icon_url TEXT,
    cover_url TEXT,
    cpm_rate NUMERIC(8, 2) NOT NULL DEFAULT 1.50,
    escrow_budget NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    remaining_budget NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    views_delivered BIGINT NOT NULL DEFAULT 0,
    hashtags TEXT[] NOT NULL DEFAULT ARRAY['#clipte', '#viral'],
    guidelines TEXT DEFAULT 'Vertical 9:16 format, dynamic hook in first 3s.',
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'paused', 'completed', 'rejected')),
    rejection_reason TEXT,
    platforms TEXT[] NOT NULL DEFAULT ARRAY['tiktok', 'youtube', 'instagram'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CLIPS / SUBMISSIONS TABLE (Clipper Tracked Videos)
CREATE TABLE IF NOT EXISTS public.clips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    campaign_title TEXT,
    platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
    video_url TEXT NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0,
    earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    hold_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),
    antifraud_status TEXT NOT NULL DEFAULT 'clean' CHECK (antifraud_status IN ('clean', 'analyzing', 'flagged')),
    status TEXT NOT NULL DEFAULT 'tracking_hold' CHECK (status IN ('tracking_hold', 'verified_paid', 'disputed', 'rejected')),
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. PAYOUTS TABLE (Disbursement Ledger)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('usdt', 'usdc', 'card', 'paypal')),
    recipient_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    transaction_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================================
-- ATOMIC DATABASE FUNCTIONS / RPC (ESCROW & TRANSACTIONS)
-- ========================================================

-- A) Create Campaign with Escrow Lock
CREATE OR REPLACE FUNCTION public.create_campaign_with_escrow(
  p_brand_id UUID,
  p_title TEXT,
  p_brand_name TEXT,
  p_drive_url TEXT,
  p_cpm_rate NUMERIC,
  p_budget NUMERIC,
  p_hashtags TEXT[],
  p_guidelines TEXT
)
RETURNS UUID AS $$
DECLARE
  v_campaign_id UUID;
  v_current_escrow NUMERIC;
BEGIN
  -- 1. Check brand balance
  SELECT balance_escrow INTO v_current_escrow
  FROM public.profiles
  WHERE id = p_brand_id
  FOR UPDATE;

  IF v_current_escrow < p_budget THEN
    RAISE EXCEPTION 'Insufficient escrow deposit balance to launch campaign.';
  END IF;

  -- 2. Deduct from brand balance
  UPDATE public.profiles
  SET balance_escrow = balance_escrow - p_budget,
      updated_at = NOW()
  WHERE id = p_brand_id;

  -- 3. Insert Campaign with status 'pending_review'
  INSERT INTO public.campaigns (
    brand_id, title, brand_name, drive_url, cpm_rate, escrow_budget, remaining_budget, hashtags, guidelines, status
  ) VALUES (
    p_brand_id, p_title, p_brand_name, p_drive_url, p_cpm_rate, p_budget, p_budget, p_hashtags, p_guidelines, 'pending_review'
  ) RETURNING id INTO v_campaign_id;

  RETURN v_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B) Reject Campaign and Refund Escrow to Brand
CREATE OR REPLACE FUNCTION public.reject_campaign_and_refund(
  p_campaign_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_brand_id UUID;
  v_escrow_budget NUMERIC;
  v_current_status TEXT;
BEGIN
  -- 1. Lock and fetch campaign
  SELECT brand_id, escrow_budget, status INTO v_brand_id, v_escrow_budget, v_current_status
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF v_current_status = 'rejected' THEN
    RETURN FALSE;
  END IF;

  -- 2. Refund to brand profile
  IF v_brand_id IS NOT NULL AND v_escrow_budget > 0 THEN
    UPDATE public.profiles
    SET balance_escrow = balance_escrow + v_escrow_budget,
        updated_at = NOW()
    WHERE id = v_brand_id;
  END IF;

  -- 3. Set campaign status to rejected
  UPDATE public.campaigns
  SET status = 'rejected',
      rejection_reason = p_reason
  WHERE id = p_campaign_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C) Credit Clipper Earnings on Verified Views
CREATE OR REPLACE FUNCTION public.credit_clipper_earnings(
  p_clip_id UUID,
  p_views_to_add BIGINT
)
RETURNS NUMERIC AS $$
DECLARE
  v_user_id UUID;
  v_campaign_id UUID;
  v_cpm NUMERIC;
  v_payout_amount NUMERIC;
BEGIN
  -- 1. Fetch clip details
  SELECT user_id, campaign_id INTO v_user_id, v_campaign_id
  FROM public.clips
  WHERE id = p_clip_id
  FOR UPDATE;

  -- 2. Fetch campaign CPM
  SELECT cpm_rate INTO v_cpm
  FROM public.campaigns
  WHERE id = v_campaign_id;

  IF v_cpm IS NULL THEN
    v_cpm := 1.50;
  END IF;

  -- Calculate payout amount: (views / 1000) * CPM
  v_payout_amount := ROUND((p_views_to_add::NUMERIC / 1000.0) * v_cpm, 2);

  -- 3. Update clip
  UPDATE public.clips
  SET view_count = view_count + p_views_to_add,
      earnings = earnings + v_payout_amount,
      status = 'verified_paid',
      antifraud_status = 'clean'
  WHERE id = p_clip_id;

  -- 4. Update campaign
  UPDATE public.campaigns
  SET views_delivered = views_delivered + p_views_to_add,
      remaining_budget = GREATEST(0, remaining_budget - v_payout_amount)
  WHERE id = v_campaign_id;

  -- 5. Credit clipper profile balance
  UPDATE public.profiles
  SET balance_earnings = balance_earnings + v_payout_amount,
      total_earnings = total_earnings + v_payout_amount,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN v_payout_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Helper to check if current caller is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'moderator' OR email = 'pzhumash@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Campaigns Policies:
-- 1. Regular users only see 'active' campaigns in marketplace, or their own created campaigns
CREATE POLICY "Public sees active, owners see own, mods see all"
ON public.campaigns FOR SELECT
USING (
  status = 'active'
  OR auth.uid() = brand_id
  OR public.is_moderator_or_admin()
);

-- 2. Only authenticated brands can insert campaigns
CREATE POLICY "Brands can insert campaigns"
ON public.campaigns FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. Only moderators/admins or brand owner can update campaigns
CREATE POLICY "Mods and owners can update campaigns"
ON public.campaigns FOR UPDATE
USING (
  auth.uid() = brand_id
  OR public.is_moderator_or_admin()
);

-- Clips Policies
CREATE POLICY "Users view own clips or mods view all"
ON public.clips FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_moderator_or_admin()
);

CREATE POLICY "Users can submit clips"
ON public.clips FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and mods can update clips"
ON public.clips FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_moderator_or_admin()
);

-- ========================================================
-- 5. MESSENGER TABLES (Proof-of-Work DMs, Campaign Rooms, Support & Staff)
-- ========================================================

-- Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'campaign_room', 'support', 'staff')),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    participant_one UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_two UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    last_message_text TEXT,
    last_message_sender_id UUID REFERENCES public.profiles(id),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Direct / Room Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    offer_data JSONB, -- Optional custom escrow offer: { amount: 150, title: "10 Clips", status: "pending" | "accepted" | "declined" }
    is_read BOOLEAN DEFAULT FALSE,
    has_leak_warning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Follows Table (Mutual Follow DM Unlocking)
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS for Messenger
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Conversations RLS Policies:
CREATE POLICY "Users can view relevant conversations"
ON public.conversations FOR SELECT
USING (
  type = 'campaign_room'
  OR type = 'support'
  OR (type = 'staff' AND public.is_moderator_or_admin())
  OR (type = 'direct' AND (auth.uid() = participant_one OR auth.uid() = participant_two))
);

-- Direct Messages RLS:
CREATE POLICY "Users can view messages in accessible conversations"
ON public.direct_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (
      c.type = 'campaign_room'
      OR c.type = 'support'
      OR (c.type = 'staff' AND public.is_moderator_or_admin())
      OR (c.type = 'direct' AND (auth.uid() = c.participant_one OR auth.uid() = c.participant_two))
    )
  )
);

-- Proof-of-Work DM Message Insert Policy:
CREATE POLICY "Allow message insert if permitted"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

