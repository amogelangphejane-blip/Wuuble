-- Rollback Microsoft Teams-like Group Chat Schema
-- This migration removes all chat-related tables, functions, triggers, and policies

-- Drop storage policies first
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;

-- Drop storage bucket
DELETE FROM storage.buckets WHERE id = 'chat-files';

-- Drop triggers
DROP TRIGGER IF EXISTS message_update_timestamp_trigger ON chat_messages;
DROP TRIGGER IF EXISTS message_reply_count_trigger ON chat_messages;
DROP TRIGGER IF EXISTS channel_member_count_trigger ON chat_channel_members;

-- Drop functions
DROP FUNCTION IF EXISTS update_message_timestamps();
DROP FUNCTION IF EXISTS update_reply_count();
DROP FUNCTION IF EXISTS update_channel_member_count();

-- Drop indexes
DROP INDEX IF EXISTS idx_typing_indicators_channel_active;
DROP INDEX IF EXISTS idx_message_read_status_user_channel;
DROP INDEX IF EXISTS idx_message_attachments_message_id;
DROP INDEX IF EXISTS idx_message_mentions_unread;
DROP INDEX IF EXISTS idx_message_mentions_user_id;
DROP INDEX IF EXISTS idx_message_reactions_message_id;
DROP INDEX IF EXISTS idx_chat_messages_thread_root;
DROP INDEX IF EXISTS idx_chat_messages_parent_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_messages_channel_id;
DROP INDEX IF EXISTS idx_chat_channel_members_user_id;
DROP INDEX IF EXISTS idx_chat_channel_members_channel_id;
DROP INDEX IF EXISTS idx_chat_channels_type;
DROP INDEX IF EXISTS idx_chat_channels_community_id;

-- Drop RLS policies (they will be dropped automatically with tables)

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS typing_indicators;
DROP TABLE IF EXISTS message_read_status;
DROP TABLE IF EXISTS message_attachments;
DROP TABLE IF EXISTS message_mentions;
DROP TABLE IF EXISTS message_reactions;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_channel_members;
DROP TABLE IF EXISTS chat_channels;