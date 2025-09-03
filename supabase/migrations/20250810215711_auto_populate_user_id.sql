-- Auto-populate user_id with authenticated user ID for RLS compliance
-- This migration adds default values to user_id columns to automatically
-- set them to the currently authenticated user's ID, preventing RLS policy violations

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