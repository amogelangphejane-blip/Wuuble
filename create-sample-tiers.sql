-- Quick Sample Tiers for Testing Patreon-Style Subscriptions
-- This creates 3 sample membership tiers for a community

-- INSTRUCTIONS:
-- 1. Find your community ID by running:
--    SELECT id, name FROM communities WHERE creator_id = auth.uid();
-- 
-- 2. Replace 'YOUR-COMMUNITY-ID-HERE' below with your actual community ID
-- 
-- 3. Run this SQL in Supabase SQL Editor or via psql

-- Delete any existing sample tiers (optional - only if re-running)
-- DELETE FROM membership_tiers WHERE community_id = 'YOUR-COMMUNITY-ID-HERE';

-- Bronze Supporter - $5/month
INSERT INTO membership_tiers (
  community_id,
  name,
  description,
  price_monthly,
  benefits,
  color,
  icon,
  is_highlighted,
  max_members,
  position,
  is_active
) VALUES (
  'YOUR-COMMUNITY-ID-HERE',  -- 👈 CHANGE THIS
  'Bronze Supporter',
  'Show your support and get access to exclusive content',
  5.00,
  '["Access to supporter-only discussions", "Bronze supporter badge", "Monthly thank you message", "Early access to announcements"]'::jsonb,
  '#CD7F32',
  'heart',
  false,
  NULL,
  1,
  true
);

-- Silver Patron - $10/month (MOST POPULAR)
INSERT INTO membership_tiers (
  community_id,
  name,
  description,
  price_monthly,
  benefits,
  color,
  icon,
  is_highlighted,
  max_members,
  position,
  is_active
) VALUES (
  'YOUR-COMMUNITY-ID-HERE',  -- 👈 CHANGE THIS
  'Silver Patron',
  'Enhanced support with exclusive benefits and community input',
  10.00,
  '["All Bronze benefits", "Early access to content", "Vote on community decisions", "Priority support", "Silver patron badge", "Monthly exclusive Q&A session"]'::jsonb,
  '#C0C0C0',
  'star',
  true,  -- 👈 This will show "MOST POPULAR" badge
  NULL,
  2,
  true
);

-- Gold Member - $25/month
INSERT INTO membership_tiers (
  community_id,
  name,
  description,
  price_monthly,
  benefits,
  color,
  icon,
  is_highlighted,
  max_members,
  position,
  is_active
) VALUES (
  'YOUR-COMMUNITY-ID-HERE',  -- 👈 CHANGE THIS
  'Gold Member',
  'Ultimate support package with premium perks and personal access',
  25.00,
  '["All Silver benefits", "Exclusive video calls with creator", "Custom role in community", "Personal mentorship session (1hr/month)", "Gold member badge", "Your name in community credits", "Exclusive behind-the-scenes content"]'::jsonb,
  '#FFD700',
  'crown',
  false,
  50,  -- Limited to 50 members!
  3,
  true
);

-- Verify tiers were created
SELECT 
  id,
  name,
  price_monthly as price,
  is_highlighted as popular,
  max_members,
  position,
  created_at
FROM membership_tiers
WHERE community_id = 'YOUR-COMMUNITY-ID-HERE'  -- 👈 CHANGE THIS
ORDER BY position;

-- EXPECTED OUTPUT:
-- 3 rows showing:
--   Bronze Supporter - $5.00
--   Silver Patron - $10.00 (popular = true)
--   Gold Member - $25.00 (max_members = 50)

-- REVENUE BREAKDOWN:
-- Bronze: $5.00  → Creator gets $3.50 (70%), Platform gets $1.50 (30%)
-- Silver: $10.00 → Creator gets $7.00 (70%), Platform gets $3.00 (30%)
-- Gold:   $25.00 → Creator gets $17.50 (70%), Platform gets $7.50 (30%)

-- Now go to your community → About tab → Subscription & Billing card
-- Click "Become a Patron" and you'll see these 3 tiers!
