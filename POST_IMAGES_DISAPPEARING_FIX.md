# Post Images Disappearing Issue - Fix Guide

## Problem Description

Users report that images in discussion posts disappear after a few hours, leaving only the alt text "Post image" visible. This is a common issue in community platforms using Supabase storage.

## Root Cause Analysis

The issue occurs due to **missing storage policies** for the `community-post-images` bucket. When storage policies are not properly configured:

1. **Images upload successfully** initially (due to authenticated upload permissions)
2. **Public access fails** after some time when the session context changes
3. **Browser shows alt text** ("Post image") instead of the broken image
4. **No error feedback** is provided to users about the access issue

### Key Findings

- ✅ Image upload works (policies exist for INSERT operations)
- ❌ Image viewing fails (missing or incorrect SELECT policies)  
- ❌ Storage policies for `community-post-images` were missing from `fix-storage-policies.sql`
- ❌ No error handling for failed image loads in the UI

## Solution Implementation

### 1. Storage Policy Fixes

**Updated `fix-storage-policies.sql`** to include complete policies for community post images:

```sql
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- Policy to allow authenticated users to upload post images
CREATE POLICY "Users can upload post images"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'community-post-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow public viewing of all post images
CREATE POLICY "Users can view all post images"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'community-post-images');

-- Policy to allow users to update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'community-post-images'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'community-post-images'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 2. Enhanced Image Upload Validation

**Updated `PostImageUpload.tsx`** to include URL validation and accessibility testing:

- ✅ Validates generated public URLs are not empty
- ✅ Tests image accessibility before confirming upload
- ✅ Provides clear error messages for policy issues
- ✅ Prevents broken uploads from being saved

### 3. Improved Error Handling

**Updated `CommunityPosts.tsx`** to handle image load failures gracefully:

- ✅ Detects when images fail to load
- ✅ Shows informative fallback message instead of broken image
- ✅ Logs errors for debugging purposes
- ✅ Maintains clean UI even with broken images

## Quick Fix Instructions

### Option 1: Run the Automated Fix Script

```bash
node fix-post-images-issue.js
```

This script will:
- ✅ Check/create the `community-post-images` bucket
- ✅ Apply all necessary storage policies
- ✅ Test upload permissions
- ✅ Verify the fix worked

### Option 2: Manual Database Fix

If you prefer to apply the fix manually:

1. **Apply storage policies:**
   ```bash
   psql -h your-db-host -U postgres -d postgres -f fix-storage-policies.sql
   ```

2. **Verify policies were created:**
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage'
   AND policyname LIKE '%post%';
   ```

3. **Test image upload in your application**

## Prevention Measures

### 1. Complete Policy Coverage
Ensure all storage buckets have comprehensive policies in `fix-storage-policies.sql`:
- `profile-pictures` ✅
- `community-avatars` ✅  
- `community-post-images` ✅ (now fixed)

### 2. Automated Testing
The fix script includes automated testing to verify:
- Bucket existence
- Policy application
- Upload permissions
- Public access

### 3. Error Monitoring
Enhanced error handling provides:
- Console logging for debugging
- User-friendly error messages
- Graceful fallbacks for broken images

## Verification Steps

After applying the fix:

1. **Test new image upload:**
   - Create a new discussion post with an image
   - Verify the image appears immediately
   - Check browser console for any errors

2. **Test image persistence:**
   - Wait a few hours or refresh the page
   - Verify the image still loads correctly
   - Check that no "Post image" text appears

3. **Test with different users:**
   - Upload images from different authenticated accounts
   - Verify all users can view all post images
   - Test image deletion by original uploader

## Technical Details

### Storage Bucket Configuration
```javascript
{
  id: 'community-post-images',
  public: true,
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}
```

### File Path Structure
```
community-post-images/
  {user_id}/
    {timestamp}.{extension}
```

### Policy Logic
- **Upload**: Only authenticated users can upload to their own folder
- **View**: Public read access for all images (no authentication required)
- **Update/Delete**: Only the original uploader can modify their images

## Troubleshooting

### Images Still Not Appearing?

1. **Check browser console** for error messages
2. **Verify authentication** - user must be logged in to upload
3. **Test with a fresh image** upload (don't rely on old broken ones)
4. **Check Supabase dashboard** for storage policies and bucket settings

### Common Error Messages

- `"Failed to generate public URL"` → Storage policies not applied
- `"Upload failed: new row violates row-level security"` → INSERT policy missing
- `"Image could not be loaded"` → SELECT policy missing or incorrect

### Still Having Issues?

If the problem persists:
1. Check your Supabase project settings
2. Verify the database connection
3. Run the automated fix script again
4. Contact support with console error messages

## Files Modified

- ✅ `fix-storage-policies.sql` - Added community post images policies
- ✅ `PostImageUpload.tsx` - Enhanced validation and error handling  
- ✅ `CommunityPosts.tsx` - Added image load error handling
- ✅ `fix-post-images-issue.js` - Automated fix script
- ✅ `POST_IMAGES_DISAPPEARING_FIX.md` - This documentation

The fix is comprehensive and addresses both the root cause (missing storage policies) and the symptoms (poor error handling) to ensure a robust image posting experience.