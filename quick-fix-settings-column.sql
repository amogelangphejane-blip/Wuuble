-- QUICK FIX: Add missing settings column to live_streams table
-- Copy and paste this into Supabase Dashboard > SQL Editor

-- Add the settings column
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}';

-- Update existing streams with default settings
UPDATE live_streams 
SET settings = '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}'::jsonb
WHERE settings IS NULL OR settings = '{}'::jsonb;

-- Verify the fix worked
SELECT 
  'Settings column added successfully' as status,
  COUNT(*) as total_streams,
  COUNT(CASE WHEN settings IS NOT NULL THEN 1 END) as streams_with_settings
FROM live_streams;