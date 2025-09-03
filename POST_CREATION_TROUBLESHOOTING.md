# Post Creation Troubleshooting Guide

## Error: "Failed to create post"

This error can occur due to several common issues. Follow this guide to diagnose and fix the problem.

## 🔍 Common Causes

1. **Missing database columns** - The `community_posts` table may be missing required columns (`image_url`, `category`, `is_pinned`)
2. **Storage bucket issues** - The `community-post-images` bucket may not exist or have incorrect policies
3. **Authentication problems** - User not logged in or missing profile
4. **Permission issues** - User not a member of the community they're trying to post in
5. **RLS policy conflicts** - Row Level Security policies preventing insert operations
6. **Foreign key constraints** - References to non-existent communities or users

## 🛠️ Quick Fix Steps

### Step 1: Run the SQL Fix Script

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix_post_creation.sql`
4. Run the script

This will:
- Add missing columns to the `community_posts` table
- Create the storage bucket and policies
- Fix RLS policies
- Add performance indexes

### Step 2: Verify User Authentication

Ensure the user is properly logged in:

```javascript
// Check in browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### Step 3: Check Community Membership

Verify the user is a member of the community:

```javascript
// Replace 'community-id' with the actual community ID
const { data: membership } = await supabase
  .from('community_members')
  .select('*')
  .eq('community_id', 'community-id')
  .eq('user_id', user.id);

console.log('Membership:', membership);
```

### Step 4: Test Post Creation

Try creating a simple post:

```javascript
const { data, error } = await supabase
  .from('community_posts')
  .insert([{
    community_id: 'your-community-id',
    user_id: user.id,
    content: 'Test post',
    category: 'general'
  }]);

console.log('Result:', { data, error });
```

## 🔧 Manual Fixes

### Fix 1: Add Missing Columns

```sql
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
```

### Fix 2: Create Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-post-images',
  'Community Post Images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
```

### Fix 3: Fix RLS Policies

```sql
DROP POLICY IF EXISTS "Users can create posts in communities they belong to" ON community_posts;

CREATE POLICY "Users can create posts in communities they belong to" 
ON community_posts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM communities c 
    WHERE c.id = community_posts.community_id 
    AND (
      c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);
```

### Fix 4: Join Community

If the user is not a member, they need to join the community:

```javascript
const { error } = await supabase
  .from('community_members')
  .insert([{
    community_id: 'community-id',
    user_id: user.id,
    role: 'member'
  }]);
```

## 🐛 Debugging Tips

### Check Browser Console

Look for specific error messages in the browser console:

```javascript
// Open browser dev tools and look for:
// - "Error creating post: [specific error message]"
// - Network tab for failed requests
// - Any authentication errors
```

### Common Error Codes

- **23503**: Foreign key constraint violation - Check if community_id or user_id exist
- **23505**: Unique constraint violation - Duplicate data
- **42501**: Permission denied - Check RLS policies
- **PGRST116**: No rows found - Missing profile or community

### Test with Minimal Data

Try creating a post with just the required fields:

```javascript
const minimalPost = {
  community_id: 'existing-community-id',
  user_id: user.id,
  content: 'Simple test'
};

const { data, error } = await supabase
  .from('community_posts')
  .insert([minimalPost]);
```

## 📋 Verification Checklist

After applying fixes, verify:

- [ ] User is authenticated (`user` object exists)
- [ ] User has a profile in the `profiles` table
- [ ] Community exists in the `communities` table
- [ ] User is a member of the community or is the creator
- [ ] `community_posts` table has all required columns
- [ ] Storage bucket `community-post-images` exists
- [ ] RLS policies allow the user to insert posts
- [ ] No console errors when attempting to create a post

## 🚀 Prevention

To prevent future issues:

1. **Run migrations properly** - Ensure all database migrations are applied
2. **Test with different user roles** - Test as community creator, member, and non-member
3. **Validate data before insert** - Check required fields exist
4. **Handle errors gracefully** - Show meaningful error messages to users
5. **Monitor logs** - Set up error tracking to catch issues early

## 📞 Still Having Issues?

If the problem persists:

1. Run the diagnostic script: `node diagnose_post_creation.js`
2. Check the specific error message in the browser console
3. Verify your Supabase environment variables are correct
4. Ensure your Supabase project has the latest schema
5. Check if there are any custom RLS policies conflicting

The most common cause is missing database schema or incorrect RLS policies. Running the SQL fix script resolves 90% of post creation issues.