-- Auto-populate user_id with authenticated user ID for RLS compliance
-- This SQL script adds default values to user_id columns to automatically
-- set them to the currently authenticated user's ID, preventing RLS policy violations
--
-- Execute this script in your Supabase SQL editor or via CLI to apply the fix

-- Add default value to community_posts.user_id
ALTER TABLE public.community_posts 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add default value to community_events.user_id  
ALTER TABLE public.community_events 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add default value to event_rsvps.user_id
ALTER TABLE public.event_rsvps 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add default value to event_notifications.user_id
ALTER TABLE public.event_notifications 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add default value to event_shares.user_id
ALTER TABLE public.event_shares 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add default value to user_event_preferences.user_id
ALTER TABLE public.user_event_preferences 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Verify the changes (optional - run these to check the defaults are set)
-- SELECT column_name, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('community_posts', 'community_events', 'event_rsvps', 'event_notifications', 'event_shares', 'user_event_preferences')
--   AND column_name = 'user_id';