# Storage Setup for Profile Upload Feature

## Issue
The community profile upload feature is not working because the required storage buckets don't exist in the Supabase project.

## Root Cause
The storage buckets `profile-pictures` and `community-avatars` need to be created in the Supabase project before the upload functionality can work.

## Solution Options

### Option 1: Manual Setup via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Navigate to your project: `tgmflbglhmnrliredlbn`

2. **Create Profile Pictures Bucket**
   - Go to Storage > Create bucket
   - Bucket name: `profile-pictures`
   - Set as Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp,image/gif`

3. **Create Community Avatars Bucket**
   - Go to Storage > Create bucket
   - Bucket name: `community-avatars`
   - Set as Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp,image/gif`

4. **Set Up Policies (if needed)**
   - The app should work with default public bucket settings
   - If you need custom policies, use the SQL from `supabase/migrations/20250121000000_setup_profile_pictures.sql`

### Option 2: Using App's Storage Setup Component

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to Profile Settings**
   - Go to http://localhost:5173
   - Sign in to your account
   - Go to Profile Settings

3. **Use Storage Setup**
   - Find the "Storage Setup" section at the top
   - Click "Set Up Storage Buckets"
   - This will attempt to create the buckets programmatically

### Option 3: SQL Migration (Advanced)

If you have access to the Supabase SQL editor:

```sql
-- Create profile-pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-pictures', 'profile-pictures', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Create community-avatars bucket  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('community-avatars', 'community-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
```

## Verification

After setup, you can verify the buckets exist by:

1. **Using the App's Debug Tools**
   - Go to Profile Settings
   - Use the "Storage Policy Test" component
   - Check that both buckets show as accessible

2. **Manual API Check**
   ```bash
   curl -X GET "https://tgmflbglhmnrliredlbn.supabase.co/storage/v1/bucket" \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

## Expected Result

Once the buckets are created, you should see:
- ✅ Profile picture upload works in Profile Settings
- ✅ Community avatar upload works when creating/editing communities
- ✅ Images display correctly across the app
- ✅ No more "Bucket not found" errors in console

## Troubleshooting

If uploads still fail after bucket creation:

1. **Check bucket permissions**: Ensure buckets are set to public
2. **Verify file types**: Only JPEG, PNG, WebP, and GIF are allowed
3. **Check file size**: Maximum 5MB per file
4. **Test with debug tools**: Use the Storage Policy Test component in Profile Settings

## Files Modified

The following files have been enhanced to handle missing storage gracefully:

- `src/components/ProfilePictureUpload.tsx` - Enhanced error handling and storage checking
- `src/components/CommunityAvatarUpload.tsx` - Similar enhancements for community avatars
- `src/components/StorageSetup.tsx` - New component for automated setup
- `src/utils/setupStorage.ts` - Utility functions for storage management
- `src/pages/ProfileSettings.tsx` - Added StorageSetup component

## Next Steps

1. Choose one of the setup options above
2. Create the storage buckets
3. Test the upload functionality
4. Remove the temporary debug components once confirmed working