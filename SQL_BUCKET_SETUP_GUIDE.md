# SQL Storage Bucket Setup Guide

## Problem: "Some storage buckets could not be created"

If you're seeing this error, it means the JavaScript/API method couldn't create the buckets. This is usually due to:
- Permission restrictions on the API key
- Network connectivity issues
- Supabase project configuration

**Solution:** Use SQL scripts to create buckets directly in the database.

---

## Quick Fix (Choose One Method)

### Method 1: Full Setup (Recommended)

This creates buckets AND policies for complete functionality.

1. **Go to Supabase Dashboard**
   - Open your project at https://supabase.com/dashboard
   - Click on your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Run the Script**
   - Open the file: `create-storage-buckets.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see a success message
   - Check the results showing 3 buckets created

### Method 2: Simple Setup (If Method 1 Fails)

This creates buckets only, without policies.

1. **Go to Supabase Dashboard → SQL Editor**

2. **Run the Simple Script**
   - Open the file: `create-storage-buckets-simple.sql`
   - Copy ALL the contents
   - Paste into SQL Editor
   - Click "Run"

3. **Manually Set Bucket to Public** (Important!)
   - Go to Storage in Supabase Dashboard
   - Click on each bucket (profile-pictures, community-avatars, community-post-images)
   - Click "Settings" or gear icon
   - Enable "Public bucket" toggle
   - Click "Save"

### Method 3: Manual Creation (Last Resort)

If SQL scripts fail, create manually:

1. **Go to Supabase Dashboard → Storage**

2. **Click "New bucket"** and create these three buckets:

   **Bucket 1: profile-pictures**
   ```
   Name: profile-pictures
   Public: YES (toggle on)
   File size limit: 5242880 (5MB)
   Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
   ```

   **Bucket 2: community-avatars**
   ```
   Name: community-avatars
   Public: YES (toggle on)
   File size limit: 5242880 (5MB)
   Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
   ```

   **Bucket 3: community-post-images**
   ```
   Name: community-post-images
   Public: YES (toggle on)
   File size limit: 10485760 (10MB)
   Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
   ```

---

## Understanding the Scripts

### create-storage-buckets.sql (Full Script)

**What it does:**
- Creates 3 storage buckets
- Sets proper file size limits
- Configures allowed MIME types
- Creates RLS policies for access control
- Verifies successful creation

**Policies Created:**
- ✅ Public read access (anyone can view images)
- ✅ Authenticated upload (logged-in users can upload)
- ✅ User update access (users can update their images)
- ✅ User delete access (users can delete their images)

**When to use:**
- First choice for complete setup
- You have full SQL access to your database

### create-storage-buckets-simple.sql (Simple Script)

**What it does:**
- Creates 3 storage buckets only
- Sets file size limits
- Configures allowed MIME types
- No policy creation

**When to use:**
- Full script fails due to permissions
- You want to manually configure policies
- Quick bucket creation needed

---

## Verifying Your Setup

### Check 1: Buckets Exist

**SQL Query:**
```sql
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets
WHERE id IN ('profile-pictures', 'community-avatars', 'community-post-images');
```

**Expected Result:** 3 rows returned

### Check 2: Buckets are Public

**In Supabase Dashboard:**
1. Go to Storage
2. Each bucket should show "Public" badge
3. If not, click bucket → Settings → Enable "Public bucket"

### Check 3: Test Upload

**In your app:**
1. Go to Community Settings
2. Click "Choose Image"
3. Select an image
4. Click "Upload"
5. Should succeed without errors

---

## Troubleshooting

### Error: "permission denied for table buckets"

**Cause:** Your database user doesn't have permission to insert into storage.buckets

**Solution:**
1. Make sure you're running the script in Supabase SQL Editor (not external client)
2. Supabase SQL Editor has elevated permissions
3. OR use Method 3 (Manual Creation) via Dashboard UI

### Error: "duplicate key value violates unique constraint"

**Cause:** Buckets already exist

**Solution:**
1. This is actually good! Buckets are already created
2. Go to Storage in Dashboard to verify they're set to Public
3. If not public, toggle the "Public bucket" setting

### Error: "relation 'storage.buckets' does not exist"

**Cause:** Storage extension not enabled

**Solution:**
Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "storage-api";
```
Then run the bucket creation script again.

### Buckets Created but Upload Still Fails

**Possible causes:**
1. Buckets not set to public
2. Missing RLS policies
3. Authentication issues

**Solutions:**

**A. Make Buckets Public:**
```sql
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('profile-pictures', 'community-avatars', 'community-post-images');
```

**B. Check Policies:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

**C. Add Basic Insert Policy:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('profile-pictures', 'community-avatars', 'community-post-images')
);
```

---

## Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `create-storage-buckets.sql` | Full setup with policies | First choice - complete setup |
| `create-storage-buckets-simple.sql` | Buckets only | If full script fails |
| `create-storage-buckets.js` | JavaScript automation | Already tried, didn't work |
| `setup-buckets.js` | Legacy JS script | Already tried, didn't work |

---

## After Successful Setup

Once buckets are created successfully:

1. **Refresh your app** - Clear cache and reload
2. **Try uploading again** - Go to Community Settings → Choose Image
3. **Warning should disappear** - Yellow banner won't show anymore
4. **Check Admin Panel** - All buckets should show green checkmarks

---

## Need More Help?

### Check Logs
1. Supabase Dashboard → Logs
2. Filter by "storage"
3. Look for error messages

### Check Bucket Settings
1. Storage → Click bucket name
2. Verify these settings:
   - Public: ON
   - File size limit: Set correctly
   - Allowed MIME types: Includes images

### Verify Authentication
1. Make sure user is logged in
2. Check browser console for auth errors
3. Verify Supabase client is initialized

---

## Success Checklist

After running the SQL script, verify:

- [ ] Script ran without errors
- [ ] 3 buckets appear in Supabase Dashboard → Storage
- [ ] Each bucket shows "Public" badge
- [ ] File size limits are correct (5MB, 5MB, 10MB)
- [ ] Test upload succeeds
- [ ] Images display correctly after upload
- [ ] No warning banners in app

---

## Quick Command Summary

**Run Full Setup:**
```bash
# Copy create-storage-buckets.sql
# Paste in Supabase SQL Editor
# Click Run
```

**Run Simple Setup:**
```bash
# Copy create-storage-buckets-simple.sql
# Paste in Supabase SQL Editor
# Click Run
```

**Verify Creation:**
```sql
SELECT * FROM storage.buckets 
WHERE id IN ('profile-pictures', 'community-avatars', 'community-post-images');
```

---

## Next Steps

Once buckets are created:

1. ✅ Test image upload in Community Settings
2. ✅ Test profile picture upload
3. ✅ Verify images display correctly
4. ✅ Check storage usage in Dashboard
5. ✅ Configure CDN if needed (optional)
6. ✅ Set up automatic cleanup policies (optional)

---

## Support

If you're still having issues after following this guide:

1. **Check Supabase Status**: https://status.supabase.com
2. **Review Supabase Docs**: https://supabase.com/docs/guides/storage
3. **Check Project Quotas**: Ensure you haven't hit storage limits
4. **Contact Support**: With screenshots of error messages

---

## Summary

**Problem:** JavaScript method couldn't create buckets
**Solution:** Use SQL scripts directly in Supabase Dashboard
**Result:** Buckets created and app can upload images

The SQL method bypasses API limitations and creates buckets directly in the database with proper permissions.
