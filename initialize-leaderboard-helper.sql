-- Leaderboard Initialization Helper
-- Run this in Supabase SQL Editor to set up leaderboard for testing

-- Function to initialize leaderboard for current user and community
CREATE OR REPLACE FUNCTION initialize_leaderboard_for_current_user()
RETURNS TABLE(
  community_id UUID,
  community_name TEXT,
  user_id UUID,
  username TEXT,
  status TEXT
) AS $$
DECLARE
  comm_record RECORD;
  user_record RECORD;
  membership_exists BOOLEAN;
BEGIN
  -- Get current user
  SELECT p.user_id, p.username INTO user_record
  FROM profiles p 
  WHERE p.user_id = auth.uid();
  
  IF user_record.user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      'ERROR: No authenticated user found'::TEXT, 
      NULL::UUID, 
      NULL::TEXT, 
      'Please log in first'::TEXT;
    RETURN;
  END IF;
  
  -- Get first community (or create one if none exist)
  SELECT c.id, c.name INTO comm_record
  FROM communities c
  LIMIT 1;
  
  IF comm_record.id IS NULL THEN
    -- Create a test community
    INSERT INTO communities (name, description, created_by)
    VALUES ('Test Community', 'Community for testing leaderboard features', user_record.user_id)
    RETURNING id, name INTO comm_record;
  END IF;
  
  -- Check if user is a member of this community
  SELECT EXISTS(
    SELECT 1 FROM community_members 
    WHERE community_id = comm_record.id 
    AND user_id = user_record.user_id
  ) INTO membership_exists;
  
  -- Add user to community if not already a member
  IF NOT membership_exists THEN
    INSERT INTO community_members (community_id, user_id, role)
    VALUES (comm_record.id, user_record.user_id, 'member')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Initialize leaderboard settings for community
  INSERT INTO community_leaderboard_settings (community_id)
  VALUES (comm_record.id)
  ON CONFLICT (community_id) DO NOTHING;
  
  -- Initialize user score
  INSERT INTO community_user_scores (
    community_id,
    user_id,
    performance_score,
    rank,
    chat_score,
    video_call_score,
    participation_score,
    quality_multiplier
  ) VALUES (
    comm_record.id,
    user_record.user_id,
    100,  -- Starting performance score
    1,    -- Starting rank
    25,   -- Starting chat score
    30,   -- Starting video call score
    20,   -- Starting participation score
    1.2   -- Quality multiplier
  ) ON CONFLICT (community_id, user_id) 
  DO UPDATE SET
    performance_score = GREATEST(community_user_scores.performance_score, 100),
    updated_at = NOW();
  
  -- Add some sample activities for context
  INSERT INTO community_user_activities (
    community_id,
    user_id,
    activity_type,
    activity_data,
    impact_score
  ) VALUES 
  (comm_record.id, user_record.user_id, 'chat_message', '{"message": "Hello everyone!"}', 2.5),
  (comm_record.id, user_record.user_id, 'post_created', '{"title": "Welcome post"}', 5.0),
  (comm_record.id, user_record.user_id, 'video_call_joined', '{"duration": 30}', 8.0)
  ON CONFLICT DO NOTHING;
  
  RETURN QUERY SELECT 
    comm_record.id,
    comm_record.name,
    user_record.user_id,
    user_record.username,
    'SUCCESS: Leaderboard initialized! You can now ask questions.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the initialization
SELECT * FROM initialize_leaderboard_for_current_user();

-- Test query: Check if everything is set up
SELECT 
  'Your Community' as type,
  c.name,
  c.id::text as id
FROM communities c
JOIN community_members cm ON c.id = cm.community_id
WHERE cm.user_id = auth.uid()
LIMIT 1

UNION ALL

SELECT 
  'Your Score' as type,
  CONCAT('Score: ', performance_score, ', Rank: #', rank) as name,
  user_id::text as id
FROM community_user_scores 
WHERE user_id = auth.uid()
LIMIT 1

UNION ALL

SELECT 
  'Your Activities' as type,
  CONCAT(COUNT(*), ' activities recorded') as name,
  user_id::text as id
FROM community_user_activities 
WHERE user_id = auth.uid()
GROUP BY user_id
LIMIT 1;