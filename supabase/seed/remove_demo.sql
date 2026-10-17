-- Removes everything created by demo_campaigns.sql (run before launch).
-- Deleting the demo user cascades to its profile, campaigns and any clips on them.
delete from public.campaigns where brand_id = 'd3d3d3d3-0000-4000-8000-000000000001';
delete from auth.users where id = 'd3d3d3d3-0000-4000-8000-000000000001';
