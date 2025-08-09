# Fix Upload Permissions - Step by Step Guide

## Issue Summary
**Error**: "Cannot upload: new row violates row-level security policy"

This error occurs because the Row-Level Security (RLS) policies for storage uploads are either too restrictive or inconsistent between different operations (INSERT vs UPDATE/DELETE).

## Immediate Solution

### Step 1: Apply the Migration
You have two migration options created to fix this issue:

#### Option A: Strict Creator-Only Policy (Recommended for Security)
Apply migration: `supabase/migrations/20250123000000_fix_community_avatar_upload_permissions.sql`

#### Option B: Flexible Member Access Policy (Better UX)
Apply migration: `supabase/migrations/20250123000001_alternative_community_avatar_policy.sql`

### Step 2: Apply to Your Supabase Project
Since your project ID is `tgmflbglhmnrliredlbn`, run:

```bash
cd /workspace
npx supabase db push
```

Or manually execute the SQL in your Supabase dashboard at:
https://supabase.com/dashboard/project/tgmflbglhmnrliredlbn

### Step 3: Test the Fix
1. Use the `StoragePolicyTest` component in your app
2. Click "Test Storage Policies" 
3. Verify "Upload Permission" shows success
4. Test actual avatar uploads

## What Each Solution Does

### Solution A: Creator-Only Access
```sql
-- Only community creators can upload avatars
CREATE POLICY "Community creators can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);
```

### Solution B: Member Access  
```sql
-- Both creators and community members can upload avatars
CREATE POLICY "Community members can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND (
    EXISTS (SELECT 1 FROM public.communities WHERE id = (storage.foldername(name))[2]::uuid AND creator_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.community_members cm JOIN public.communities c ON c.id = cm.community_id WHERE c.id = (storage.foldername(name))[2]::uuid AND cm.user_id = auth.uid())
  )
);
```

## Quick Manual Fix (Alternative)

If you prefer to fix this directly in Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Execute this query:

```sql
-- Quick fix: Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;

CREATE POLICY "Community creators can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);
```

## Verification Steps

After applying the fix:

1. **Test with StoragePolicyTest Component**:
   - Open your app
   - Navigate to the storage policy test component
   - Run the test suite
   - Verify all tests pass

2. **Test Actual Uploads**:
   - Try uploading a profile picture
   - Try uploading a community avatar (as community creator)
   - Verify uploads succeed and images display correctly

3. **Check Console Logs**:
   - Open browser dev tools
   - Look for any remaining storage-related errors
   - Verify successful upload messages

## Expected Behavior After Fix

- ✅ Community creators can upload avatars for their communities
- ✅ Users can upload their own profile pictures  
- ✅ All uploaded images are publicly viewable
- ✅ Old avatars are properly cleaned up when new ones are uploaded
- ✅ No more "row-level security policy" errors

## Troubleshooting

If you still get errors after applying the fix:

1. **Check User Authentication**: Ensure the user is properly logged in
2. **Verify Community Ownership**: Make sure the user trying to upload is the community creator
3. **Check File Path**: Verify the upload path matches the expected structure
4. **Review Policies**: Use Supabase dashboard to inspect current policies on `storage.objects`

## Need Help?

If issues persist, check:
- Browser console for detailed error messages
- Supabase dashboard logs
- Network tab for failed requests
- Storage bucket configuration in Supabase dashboard