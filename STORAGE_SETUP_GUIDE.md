# Storage Bucket Setup Guide

This guide explains how to set up Supabase storage buckets for image uploads in the community platform.

## Overview

The platform requires three storage buckets for image uploads:

1. **profile-pictures** - User profile avatars (5MB limit)
2. **community-avatars** - Community avatars (5MB limit)  
3. **community-post-images** - Images in community posts (10MB limit)

## Automatic Setup

### Method 1: Using the UI (Recommended)

The system now includes automatic bucket creation:

1. **For Community Settings:**
   - Navigate to a community's settings page
   - Click on the "General" tab
   - If buckets are missing, you'll see a yellow warning banner
   - Click "Setup Storage Now" to automatically create all buckets
   - The system will notify you once setup is complete

2. **For Admin Panel:**
   - Navigate to Admin Platform Settings
   - Look for the "Storage Bucket Setup" card at the top
   - Click "Check Status" to see which buckets exist
   - Click "Setup Buckets" to create missing buckets
   - View detailed results of the setup process

### Method 2: Using the Script

Run the standalone Node.js script:

```bash
node create-storage-buckets.js
```

Make sure your environment variables are set:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

The script will:
- Check which buckets already exist
- Create any missing buckets
- Display a summary of the setup process
- Exit with appropriate status codes

## Manual Setup (Supabase Dashboard)

If automatic setup fails, you can create buckets manually:

1. Go to your Supabase project dashboard
2. Navigate to Storage section
3. Create three new buckets:

### Bucket: profile-pictures
- **Public:** Yes
- **File size limit:** 5 MB (5,242,880 bytes)
- **Allowed MIME types:** image/jpeg, image/png, image/webp, image/gif

### Bucket: community-avatars
- **Public:** Yes
- **File size limit:** 5 MB (5,242,880 bytes)
- **Allowed MIME types:** image/jpeg, image/png, image/webp, image/gif

### Bucket: community-post-images
- **Public:** Yes
- **File size limit:** 10 MB (10,485,760 bytes)
- **Allowed MIME types:** image/jpeg, image/png, image/webp, image/gif

## Storage Policies

The buckets should be configured with public read access. Upload permissions should be restricted to authenticated users through Row Level Security (RLS) policies.

Default policies that should be set:

```sql
-- Allow authenticated users to upload to profile-pictures
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to upload to community-avatars
CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-avatars');

-- Allow authenticated users to upload to community-post-images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-post-images');

-- Allow public read access to all buckets
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (true);
```

## Verifying Setup

### Using the Admin Panel

1. Navigate to Admin Platform Settings
2. Click "Check Status" in the Storage Bucket Setup card
3. Verify all three buckets show as "Configured" with green checkmarks

### Using the Script

Run:
```bash
node create-storage-buckets.js
```

Look for "🎉 Storage setup complete! All buckets are ready." message.

### Manual Verification

1. Go to Supabase Dashboard → Storage
2. Verify all three buckets exist:
   - profile-pictures
   - community-avatars
   - community-post-images
3. Check each bucket's settings match the specifications above

## Troubleshooting

### Bucket Creation Fails

**Error:** "Failed to create bucket"

**Possible causes:**
- Insufficient permissions on the Supabase API key
- Network connectivity issues
- Bucket with same name already exists

**Solutions:**
1. Verify your Supabase credentials are correct
2. Check that you're using the correct project URL
3. Try creating buckets manually through Supabase Dashboard

### Upload Fails After Bucket Creation

**Error:** "Upload failed" or "Permission denied"

**Possible causes:**
- Missing storage policies
- Incorrect bucket permissions

**Solutions:**
1. Verify buckets are set to "Public"
2. Check storage policies in Supabase Dashboard
3. Ensure user is authenticated before uploading

### Images Not Displaying

**Error:** Images uploaded but not showing

**Possible causes:**
- Bucket not set to public
- Incorrect public URL generation

**Solutions:**
1. Verify bucket is set to "Public" in settings
2. Check browser console for image loading errors
3. Verify the generated public URL is correct

## Features

### Auto-Detection
The system automatically detects when storage buckets are missing and offers to create them.

### Visual Feedback
- Green checkmarks indicate configured buckets
- Red X marks indicate missing buckets
- Yellow warning banners appear when buckets need setup
- Detailed setup results are displayed after creation

### Error Handling
- Graceful fallback when buckets are missing
- Clear error messages with actionable solutions
- Retry mechanisms for failed operations

## Integration with Components

### CommunityAvatarUpload Component

The `CommunityAvatarUpload` component now includes:
- Automatic bucket detection on mount
- Visual warnings when buckets are missing
- One-click bucket creation from the UI
- Better loading states and feedback
- Enhanced "Choose Image" button with icon

### StorageSetup Component

A dedicated component for admin panels that provides:
- Bucket status checking
- One-click bucket creation
- Detailed setup results
- Visual status indicators

## Next Steps

After setting up storage buckets:

1. Test profile picture uploads
2. Test community avatar uploads
3. Test post image uploads
4. Monitor storage usage in Supabase Dashboard
5. Set up storage policies if needed
6. Configure CDN or custom domain (optional)

## Support

If you continue to have issues with storage setup:

1. Check Supabase service status
2. Verify project quotas and limits
3. Review Supabase logs for detailed error messages
4. Contact Supabase support if issues persist

## Related Files

- `/src/components/CommunityAvatarUpload.tsx` - Avatar upload component
- `/src/components/StorageSetup.tsx` - Admin storage setup UI
- `/src/utils/setupStorage.ts` - Storage utility functions
- `/create-storage-buckets.js` - Standalone setup script
- `/setup-buckets.js` - Legacy setup script
