-- Test Database Trigger
-- This will test if the trigger works by manually inserting a test record

-- First, let's see what streams exist
SELECT id, title, display_image_url FROM live_streams LIMIT 5;

-- Insert a test image record (replace the stream_id with one of your actual stream IDs)
-- Replace 'c33d7587-f455-4efd-99b5-534f459e7fb2' with one of your actual stream IDs
INSERT INTO stream_images (
    stream_id,
    creator_id, 
    image_url,
    image_type,
    is_active
) VALUES (
    'c33d7587-f455-4efd-99b5-534f459e7fb2', -- Replace with your stream ID
    '6f279873-c8f5-4f1f-970a-f69ef0bcb524', -- Replace with your user ID
    'https://example.com/test-image.jpg', -- Test URL
    'display',
    true
);

-- Check if the trigger worked - display_image_url should now be updated
SELECT id, title, display_image_url FROM live_streams 
WHERE id = 'c33d7587-f455-4efd-99b5-534f459e7fb2';

-- Check the stream_images table
SELECT * FROM stream_images WHERE stream_id = 'c33d7587-f455-4efd-99b5-534f459e7fb2';