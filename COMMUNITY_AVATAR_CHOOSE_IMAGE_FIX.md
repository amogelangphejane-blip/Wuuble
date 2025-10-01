# Fix: "Choose Image" Button Not Working

## Problem
The "Choose Image" button in Community Settings is not responding when clicked.

---

## Quick Diagnosis

The button can be disabled for several reasons:

1. **Storage bucket not configured** (most common)
2. User not authenticated
3. JavaScript error
4. Browser compatibility issue

---

## Solution Steps

### Step 1: Check if Storage Bucket Exists

The button is automatically disabled if the `community-avatars` storage bucket doesn't exist.

**To verify:**

1. Open your browser's Developer Console (F12)
2. Click the "Choose Image" button
3. Look for console messages like:
   - `"Community avatars storage bucket is missing"`
   - Check the logged object showing `storageReady: false`

**If storage is missing**, proceed to Step 2.

### Step 2: Create the Storage Bucket

You have three options:

#### Option A: Use the SQL Script (Recommended)

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run the script: `setup-community-avatars-storage.sql`
4. This will create:
   - The `community-avatars` bucket
   - All necessary RLS policies
   - Proper configuration

#### Option B: Use the Diagnostic Tool

1. Open `test-and-fix-community-avatar-storage.html` in your browser
2. Enter your Supabase URL and Anon Key
3. Click "Run Diagnostic" to see the issue
4. Click "Auto Fix" to attempt automatic repair
5. Run diagnostic again to verify

#### Option C: Manual Setup via Dashboard

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Set:
   - **Name**: `community-avatars`
   - **Public**: Yes (checked)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
4. Then run the SQL script for RLS policies

### Step 3: Verify the Fix

1. Refresh your application
2. Navigate to Community Settings
3. The "Choose Image" button should now be enabled
4. Console should log: `storageReady: true`

---

## Detailed Troubleshooting

### Issue: Button is Grayed Out/Disabled

**Check Console Output:**

When you click the button, you should see:
```javascript
Choose Image clicked {
  hasRef: true,
  isUploading: false,
  storageReady: true,  // ← Should be true
  communityId: "uuid-here"
}
```

**If `storageReady: false`:**
- Storage bucket doesn't exist
- Follow Step 2 above to create it

**If `hasRef: false`:**
- File input element not rendered
- Try refreshing the page
- Check for React rendering errors

**If `isUploading: true`:**
- Previous upload is still in progress
- Wait for it to complete

### Issue: Button Clicks But Nothing Happens

**Possible causes:**

1. **JavaScript Error:**
   - Check browser console for errors
   - Look for React errors in the console

2. **Browser Security:**
   - File input may be blocked by browser security
   - Try a different browser
   - Disable browser extensions temporarily

3. **File Input Not Rendered:**
   - The hidden `<input type="file">` may not be in the DOM
   - Check React DevTools to verify component state

### Issue: "Storage Not Ready" Error Message

If you see a red error message: "Storage not configured. Upload disabled."

**This means:**
- The `community-avatars` bucket doesn't exist in Supabase Storage
- The component detected this and disabled uploads
- You need to create the storage bucket (see Step 2)

### Issue: Button Works But Upload Fails

If the file picker opens but upload fails:

**Check:**

1. **RLS Policies:**
   - Ensure all 4 RLS policies are created
   - Run the full SQL script

2. **File Size:**
   - Must be under 5MB
   - Compress large images

3. **File Type:**
   - Must be: JPEG, PNG, WebP, or GIF
   - No other formats allowed

4. **Authentication:**
   - User must be logged in
   - Token must be valid

5. **Permissions:**
   - User must be the community creator
   - Check `communities.creator_id === user.id`

---

## Complete SQL Setup Script

If you need to set everything up from scratch:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-avatars',
  'community-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Community avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can update their community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can delete their community avatars" ON storage.objects;

-- Policy: Public viewing
CREATE POLICY "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');

-- Policy: Authenticated upload
CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
);

-- Policy: Creator update
CREATE POLICY "Community creators can update their community avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

-- Policy: Creator delete
CREATE POLICY "Community creators can delete their community avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

-- Verify
SELECT * FROM storage.buckets WHERE id = 'community-avatars';
```

---

## Verification Checklist

After applying the fix, verify:

- [ ] Supabase Storage has `community-avatars` bucket
- [ ] Bucket is set to public
- [ ] File size limit is 5MB (5242880 bytes)
- [ ] Allowed MIME types include image formats
- [ ] All 4 RLS policies are created
- [ ] Browser console shows `storageReady: true`
- [ ] "Choose Image" button is NOT disabled
- [ ] Helper text shows normal message (not red error)
- [ ] Clicking button opens file picker
- [ ] Can select image files
- [ ] Upload button appears after selection
- [ ] Upload completes successfully

---

## Testing the Fix

### Test 1: Button State
1. Open Community Settings
2. Go to General tab
3. Button should be enabled (not grayed out)
4. Helper text should be normal (not red)

### Test 2: File Picker
1. Click "Choose Image"
2. File picker should open immediately
3. Select an image file

### Test 3: Upload
1. After selecting file, preview should appear
2. "Upload" and "Cancel" buttons should appear
3. Click "Upload"
4. Should see success notification
5. Avatar should update in preview

### Test 4: Remove
1. With avatar uploaded
2. Click "Remove" button
3. Should see success notification
4. Avatar should revert to default icon

---

## Understanding the Button Logic

The button is disabled when:

```typescript
disabled={uploading || (communityId && storageReady === false)}
```

**Translation:**
- `uploading === true`: Currently uploading (temporary)
- `communityId && storageReady === false`: Storage bucket missing (permanent until fixed)

**When enabled:**
- `uploading === false`: Not currently uploading
- `storageReady === true` OR `communityId === undefined`: Storage ready or not needed

---

## Common Errors and Solutions

### Error: "Storage Not Ready"
**Solution:** Create the storage bucket using the SQL script

### Error: "File input not available"
**Solution:** Refresh the page. If persists, check React component errors.

### Error: "Policy violation"
**Solution:** Ensure all RLS policies are created with correct names

### Error: "Bucket not found"
**Solution:** Bucket name must be exactly `community-avatars`

### Error: "File too large"
**Solution:** Image must be under 5MB. Compress or resize.

### Error: "Invalid file type"
**Solution:** Only JPEG, PNG, WebP, GIF allowed

---

## Files Modified

### Component Files
- `src/components/CommunityAvatarUpload.tsx` - Added better error handling and debugging

### Changes Made
1. Added `handleChooseImage()` function with logging
2. Added toast notification when storage not ready
3. Added visual indicator when button disabled
4. Improved error messages and user feedback

### New Files Created
- `setup-community-avatars-storage.sql` - SQL script to create bucket and policies
- `test-and-fix-community-avatar-storage.html` - Diagnostic and auto-fix tool
- `COMMUNITY_AVATAR_CHOOSE_IMAGE_FIX.md` - This troubleshooting guide

---

## Support

If the issue persists after following all steps:

1. **Check Browser Console** for detailed error messages
2. **Use the Diagnostic Tool** to identify the exact problem
3. **Verify Supabase Configuration** in your dashboard
4. **Check Network Tab** for failed API requests
5. **Try Different Browser** to rule out browser-specific issues

---

## Summary

**Most likely cause:** Storage bucket not configured  
**Quick fix:** Run `setup-community-avatars-storage.sql` in Supabase SQL Editor  
**Verification:** Use `test-and-fix-community-avatar-storage.html` to confirm  
**Result:** Button should work and allow image uploads

---

**Last Updated:** October 1, 2025  
**Status:** ✅ Fix Applied & Documented
