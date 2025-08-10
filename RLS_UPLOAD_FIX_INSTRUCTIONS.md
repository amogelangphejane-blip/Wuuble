# Fix for "Cannot upload: new row violates row-level security policy"

## Problem Summary

The error "new row violates row-level security policy" occurs when uploading files (profile pictures or community avatars) because the Row-Level Security (RLS) policies in Supabase are not being satisfied.

## Root Causes

1. **Authentication Issues**: The user session might not be properly established when the upload occurs
2. **Path Format Mismatch**: The file path doesn't match what the RLS policy expects
3. **Missing NULL Checks**: RLS policies don't handle NULL values from `auth.uid()` properly
4. **Timing Issues**: Authentication state might be inconsistent during upload

## Solutions Implemented

### 1. Enhanced Upload Helpers (`src/utils/uploadHelpers.ts`)

Created robust upload functions with:
- Authentication validation with retry logic
- Better error handling and debugging
- User-friendly error messages
- Comprehensive logging for troubleshooting

### 2. Authentication Helpers (`src/utils/authHelpers.ts`)

Added utilities to:
- Validate authentication state properly
- Retry authentication if transient issues occur
- Check session expiration
- Provide detailed debugging information

### 3. Updated Upload Components

Both `ProfilePictureUpload.tsx` and `CommunityAvatarUpload.tsx` now use the enhanced helpers for better reliability.

### 4. RLS Debug Tool (`src/components/RLSDebugTool.tsx`)

Added a diagnostic tool to help identify RLS issues in real-time.

## Database Migration Required

**IMPORTANT**: Apply this migration to fix the RLS policies:

```sql
-- Create a function to test auth.uid() for debugging
CREATE OR REPLACE FUNCTION public.test_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Create a function to debug storage path parsing
CREATE OR REPLACE FUNCTION public.debug_storage_path(file_path text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'original_path', file_path,
    'folder_parts', storage.foldername(file_path),
    'first_folder', (storage.foldername(file_path))[1],
    'second_folder', (storage.foldername(file_path))[2],
    'current_user', auth.uid()::text
  );
$$;

-- Drop existing policies for profile pictures to recreate them
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Recreate profile picture policies with better error handling
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Drop existing policies for community avatars to recreate them
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can update their community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can delete their community avatars" ON storage.objects;

-- Recreate community avatar policies with better error handling
CREATE POLICY "Authenticated users can upload community avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND (storage.foldername(name))[2] IS NOT NULL
);

CREATE POLICY "Community creators can update their community avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'community-avatars'
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Community creators can delete their community avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'community-avatars'
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);
```

## How to Apply the Fix

### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL above
4. Run the query

### Option 2: Via Supabase CLI (if you have access)

1. Ensure you're logged in: `supabase login`
2. Link your project: `supabase link --project-ref tgmflbglhmnrliredlbn`
3. Apply migration: `supabase db push`

### Option 3: Create New Migration File

1. The migration file `supabase/migrations/20250123000000_fix_rls_upload_policies.sql` has been created
2. Apply it when you can access the database

## Testing the Fix

1. **Use the RLS Debug Tool**: Go to Profile Settings and use the "RLS Policy Debug Tool" to test permissions
2. **Try Upload**: Attempt to upload a profile picture or community avatar
3. **Check Console**: Look for detailed debug information in browser console
4. **Verify Paths**: Ensure file paths follow the expected format:
   - Profile pictures: `{user_id}/avatar-{timestamp}.{ext}`
   - Community avatars: `communities/{community_id}/avatar-{timestamp}.{ext}`

## Immediate Workarounds

If you can't apply the migration immediately:

1. **Refresh Authentication**: Log out and log back in
2. **Clear Browser Cache**: Sometimes stale authentication tokens cause issues
3. **Use Smaller Files**: Try with a smaller image file (< 1MB)
4. **Check Network**: Ensure stable internet connection

## Error Messages Explained

- **"Permission denied: Please ensure you are logged in and try again"**: Authentication issue
- **"User ID mismatch - security violation"**: Session doesn't match expected user
- **"Permission denied: Only community creators can upload avatars"**: User is not the community creator
- **"Session has expired"**: Authentication token has expired

## Debugging Steps

1. Open browser console (F12)
2. Go to Profile Settings
3. Use the "RLS Policy Debug Tool"
4. Check the detailed results for specific issues
5. Look for authentication state and path construction details

## Prevention

- Always ensure users are fully authenticated before allowing uploads
- Implement proper session refresh logic
- Use the enhanced upload helpers provided
- Monitor authentication state in your application

---

**Note**: This fix addresses the most common causes of RLS policy violations. If issues persist after applying the migration, use the debug tools to identify specific problems.