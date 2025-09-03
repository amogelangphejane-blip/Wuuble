-- Test script to verify user_id auto-population works correctly
-- Run this AFTER applying the auto_populate_user_id_fix.sql

-- First, verify the default values are set correctly
SELECT 
    table_name,
    column_name, 
    column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('community_posts', 'community_events', 'event_rsvps', 'event_notifications', 'event_shares', 'user_event_preferences')
  AND column_name = 'user_id'
ORDER BY table_name;

-- Test inserting a community post without specifying user_id
-- This should now work without RLS violations
-- (Replace 'your-community-id' with an actual community ID from your database)

-- INSERT INTO public.community_posts (community_id, content) 
-- VALUES ('your-community-id', 'Test post with auto-populated user_id');

-- Test inserting an event RSVP without specifying user_id  
-- (Replace 'your-event-id' with an actual event ID from your database)

-- INSERT INTO public.event_rsvps (event_id, status) 
-- VALUES ('your-event-id', 'going');

-- Verify the inserts worked and user_id was auto-populated
-- SELECT user_id, content FROM public.community_posts WHERE content = 'Test post with auto-populated user_id';
-- SELECT user_id, status FROM public.event_rsvps WHERE event_id = 'your-event-id' ORDER BY created_at DESC LIMIT 1;