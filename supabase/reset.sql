-- =====================================================================
-- CLIPTE — RESET (run BEFORE schema.sql when old tables already exist)
--
-- ⚠️ DELETES all Clipte tables and their data (profiles, campaigns, clips,
--    payouts, messages …). Only run this while there is NO real user data.
--    Auth users (auth.users) are kept; their profiles are recreated when
--    schema.sql runs (see the backfill at the end of schema.sql).
-- Safe to run on an empty project too (everything is "if exists").
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop view if exists public.public_profiles cascade;

drop table if exists public.direct_messages cascade;
drop table if exists public.notifications cascade;
drop function if exists public.has_contact_leak(text) cascade;
drop function if exists public.guard_message() cascade;
drop function if exists public.touch_conversation() cascade;
drop function if exists public.start_direct(uuid) cascade;
drop function if exists public.my_support_conversation() cascade;
drop function if exists public.staff_room() cascade;
drop function if exists public.campaign_room(uuid) cascade;
drop function if exists public.my_unread() cascade;
drop function if exists public.guard_notification() cascade;
drop function if exists public.notify(uuid, text, jsonb, text) cascade;
drop function if exists public.notify_clip() cascade;
drop function if exists public.notify_campaign() cascade;
drop function if exists public.notify_payout() cascade;
drop function if exists public.notify_account() cascade;
drop table if exists public.conversations cascade;
drop table if exists public.user_follows cascade;
drop table if exists public.view_snapshots cascade;
drop table if exists public.clips cascade;
drop table if exists public.escrow_deposits cascade;
drop table if exists public.payouts cascade;
drop table if exists public.payout_methods cascade;
drop table if exists public.social_accounts cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.profiles cascade;

-- functions from both the old and the new schema
drop function if exists public.handle_new_user() cascade;
drop function if exists public.guard_profile() cascade;
drop function if exists public.guard_social_account() cascade;
drop function if exists public.guard_campaign() cascade;
drop function if exists public.guard_clip() cascade;
drop function if exists public.can_access_conversation(uuid) cascade;
drop function if exists public.confirm_escrow_deposit(bigint, numeric) cascade;
drop function if exists public.approve_campaign(uuid) cascade;
drop function if exists public.reject_campaign(uuid, text) cascade;
drop function if exists public.moderate_clip(uuid, text, text) cascade;
drop function if exists public.record_view_snapshot(uuid, bigint, text) cascade;
drop function if exists public.settle_clip(uuid) cascade;
drop function if exists public.request_payout(uuid) cascade;
drop function if exists public.process_payout(uuid, text, text) cascade;
drop function if exists public.is_staff() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.is_trusted() cascade;
drop function if exists public.trust() cascade;
drop function if exists public.is_service() cascade;
drop function if exists public.can_see_campaign_stats(uuid) cascade;
drop function if exists public.campaign_leaderboard(uuid) cascade;
drop function if exists public.campaign_public_stats(uuid[]) cascade;
drop function if exists public.creator_public_stats(uuid) cascade;
drop function if exists public.my_referral_count() cascade;
drop function if exists public.staff_verify_account(uuid) cascade;
drop function if exists public.list_public_profiles() cascade;
drop function if exists public.campaign_card_stats(uuid[]) cascade;
-- old (insecure) v1 functions
drop function if exists public.create_campaign_with_escrow(uuid, text, text, text, numeric, numeric, text[], text) cascade;
drop function if exists public.reject_campaign_and_refund(uuid, text) cascade;
drop function if exists public.credit_clipper_earnings(uuid, bigint) cascade;
drop function if exists public.is_moderator_or_admin() cascade;
