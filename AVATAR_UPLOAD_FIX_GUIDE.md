# Community Avatar Upload Fix Guide

## 🚨 Issue Identified

**Error**: "Failed to upload community avatar"

**Root Cause**: The required Supabase storage buckets (`profile-pictures` and `community-avatars`) do not exist in your project.

**Verification**: API call to list buckets returns `[]` (empty array), confirming no storage buckets are configured.

## 🔧 SOLUTION 1: Manual Fix via Supabase Dashboard (RECOMMENDED)

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `tgmflbglhmnrliredlbn`
3. Navigate to **Storage** in the left sidebar

### Step 2: Create Profile Pictures Bucket
1. Click **"Create bucket"**
2. Configure as follows:
   - **Name**: `profile-pictures`
   - **Public**: ✅ **Yes** (Enable public access)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`
3. Click **"Create bucket"**

### Step 3: Create Community Avatars Bucket
1. Click **"Create bucket"** again
2. Configure as follows:
   - **Name**: `community-avatars`
   - **Public**: ✅ **Yes** (Enable public access)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`
3. Click **"Create bucket"**

### Step 4: Verify Setup
1. You should now see both buckets in the Storage section
2. Refresh your application
3. Try uploading a community avatar - it should work!

## 🔧 SOLUTION 2: Automated Fix via App Interface

### Option A: Use the StorageSetup Component
1. Start your app: `npm run dev`
2. Sign in to your account
3. Go to **Profile Settings**
4. Look for the **"Storage Setup"** section at the top
5. Click **"Set Up Storage Buckets"**
6. Follow the results (may show permission errors)

### Option B: Use the Storage Policy Test
1. In Profile Settings, find **"Storage Policy Test"**
2. Click **"Test Storage Policies"**
3. This will show you exactly what's missing

## 🔧 SOLUTION 3: Service Role Key Method (Advanced)

If you have access to the Supabase service role key:

1. Get your service role key from Supabase Dashboard → Settings → API
2. Replace the key in the script and run:

```bash
# Update the key in create-storage-buckets.sh
# Then run:
./create-storage-buckets.sh
```

## 🧪 Testing the Fix

After creating the buckets:

### Test 1: Basic Upload Test
1. Go to your app
2. Navigate to a community page
3. Try uploading a community avatar
4. ✅ Should work without errors

### Test 2: Verification via App
1. Go to Profile Settings
2. Use "Storage Policy Test"
3. All tests should pass with green checkmarks

### Test 3: API Verification
```bash
curl -s -X GET "https://tgmflbglhmnrliredlbn.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8"
```
Should return JSON with both buckets listed.

## 🔍 Why This Happened

1. **Missing Migration Application**: The migration files exist in `supabase/migrations/` but weren't applied to the live database
2. **Storage Bucket Dependency**: Avatar upload components expect these buckets to exist
3. **Permission Check**: The app checks for bucket existence and disables upload when missing

## 📋 Migration Files Available

The following migration files contain the proper setup:
- `20250121000000_setup_profile_pictures.sql`
- `20250108000000_add_community_avatars_storage.sql`
- `20250122000000_fix_profile_pictures_bucket.sql`

These could be applied via Supabase CLI if available, but manual bucket creation is simpler.

## ⚡ Quick Status Check

To verify if the fix worked:

```bash
# Check if buckets exist
curl -s "https://tgmflbglhmnrliredlbn.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8" | jq .
```

Expected result: Array with `profile-pictures` and `community-avatars` objects.

## 🚨 Troubleshooting

### If Manual Creation Fails:
1. Verify you have admin access to the Supabase project
2. Check if you're logged into the correct Supabase account
3. Try creating buckets with different names first

### If Upload Still Fails After Bucket Creation:
1. Check browser console for specific error messages
2. Verify file size is under 5MB
3. Ensure file type is supported (JPEG, PNG, WebP, GIF)
4. Try logging out and back in
5. Clear browser cache

### Permission Errors:
1. Verify the user is authenticated in the app
2. Check if the community exists and user has permission to edit it
3. Review the storage policies in Supabase Dashboard

## 📞 Support

If you continue to have issues after following this guide:
1. Share the exact error message from browser console
2. Confirm which solution you tried
3. Include the bucket verification results

---

**Status**: ✅ Issue diagnosed - Storage buckets missing  
**Solution**: Create buckets via Supabase Dashboard (Solution 1)  
**Expected Result**: Avatar uploads will work immediately after bucket creation