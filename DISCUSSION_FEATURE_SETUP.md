# Community Discussion Feature - Database Setup Guide

## Overview
The discussion feature has been restored to use the original `SkoolDiscussions` component, which provides a rich, full-featured discussion system similar to platforms like Skool, Discord, or Reddit.

## Features Included
- 📝 **Posts** - Create posts with title, content, category, and tags
- 👍 **Likes** - Like posts and comments
- 💬 **Comments** - Nested comments with replies
- 📌 **Pinned Posts** - Pin important posts to the top
- 🔖 **Bookmarks** - Save posts for later
- 👁️ **View Tracking** - Track post views
- 🏷️ **Categories & Tags** - Organize discussions
- 🔍 **Search & Filter** - Find relevant discussions
- 📊 **Activity Tracking** - See most active discussions

## Database Schema Created

### Tables
1. **community_posts** - Main posts table with all post data
2. **community_post_likes** - Track post likes
3. **community_post_comments** - Comments and replies
4. **community_post_bookmarks** - User bookmarks
5. **community_post_views** - View tracking
6. **community_comment_likes** - Comment likes

### Key Features of the Schema
- **Automatic count updates** via triggers (likes, comments, views)
- **Row Level Security (RLS)** for proper access control
- **Optimized indexes** for fast queries
- **Real-time updates** support
- **Cascading deletes** for data integrity

## How to Apply the Database Schema

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration Script**
   - Copy the entire contents of `/workspace/apply-discussions-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

4. **Verify Installation**
   ```sql
   -- Check if tables were created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'community_post%';
   ```

### Option 2: Using Supabase CLI (Local Development)

1. **Start Supabase locally**
   ```bash
   npx supabase start
   ```

2. **Apply the migration**
   ```bash
   npx supabase db push
   ```

3. **Or run directly**
   ```bash
   npx supabase db execute -f apply-discussions-schema.sql
   ```

### Option 3: Using psql Command Line

```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f apply-discussions-schema.sql
```

## Post-Installation Steps

### 1. Verify Tables Created
Run this query in Supabase SQL Editor:
```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
  'community_posts',
  'community_post_likes',
  'community_post_comments',
  'community_post_bookmarks',
  'community_post_views',
  'community_comment_likes'
);
```

### 2. Check Sample Data
```sql
-- View sample posts
SELECT 
  p.id,
  p.title,
  p.category,
  p.likes_count,
  p.comments_count,
  p.views_count,
  c.name as community_name
FROM community_posts p
JOIN communities c ON p.community_id = c.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### 3. Test Permissions
Try creating a post through the application to ensure RLS policies are working correctly.

## Component Usage

The discussion feature is now using the original `SkoolDiscussions` component located at:
```
/workspace/src/components/SkoolDiscussions.tsx
```

This component expects the full schema with all fields including:
- title
- category
- tags
- likes_count
- comments_count
- views_count
- is_pinned
- etc.

## Troubleshooting

### If you get "relation does not exist" errors:
1. Make sure you ran the entire SQL script
2. Check that you're connected to the correct database
3. Verify the tables were created in the 'public' schema

### If you get permission errors:
1. Make sure RLS is enabled on all tables
2. Check that the user is authenticated
3. Verify the user is a member of the community

### If counts aren't updating:
1. Check that triggers were created:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE 'community_post%';
```

## Features Available After Setup

Once the database schema is applied, users can:

1. **Create Posts**
   - Add title and content
   - Select category
   - Add tags
   - Format text

2. **Interact with Posts**
   - Like/unlike posts
   - Comment on posts
   - Reply to comments
   - Bookmark posts
   - Share posts

3. **Browse Discussions**
   - Filter by category
   - Sort by recent/popular
   - Search posts
   - View pinned posts

4. **Track Activity**
   - See view counts
   - Track likes
   - Monitor comments
   - Check last activity

## Security Features

The schema includes comprehensive security:
- Row Level Security (RLS) policies
- Proper authentication checks
- Community membership validation
- Owner-only delete permissions for certain content
- Private community access control

## Performance Optimizations

The schema includes:
- Indexes on frequently queried columns
- GIN index for tag searches
- Automatic count updates via triggers
- Optimized foreign key relationships
- Efficient cascading deletes

## Next Steps

After applying the schema:
1. Test the discussion feature in your application
2. Customize categories and tags as needed
3. Set up moderation rules if required
4. Configure real-time subscriptions if desired
5. Add additional sample data if needed

## Support

If you encounter any issues:
1. Check the Supabase logs for errors
2. Verify all tables and functions were created
3. Ensure your application is using the correct Supabase credentials
4. Check that the user has proper permissions

The discussion feature should now be fully functional with all advanced features working properly!