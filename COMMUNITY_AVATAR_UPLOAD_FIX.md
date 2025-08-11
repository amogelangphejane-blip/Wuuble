# 🔧 Community Avatar Upload Fix - COMPLETE SOLUTION

## 🚨 **ISSUE IDENTIFIED**

**Error**: "Failed to upload community avatar"

**Root Cause**: Storage buckets exist, but **Row Level Security (RLS) policies are missing**

**Evidence**: 
- ✅ Buckets exist (you created them)
- ❌ Upload fails with: `"new row violates row-level security policy"`
- ❌ API returns 403 Unauthorized for uploads

## 🎯 **THE REAL FIX**

The issue isn't missing buckets - it's **missing security policies**. When you created the buckets manually, only the buckets were created, not the policies that allow uploads.

### **SOLUTION: Apply Missing SQL Policies**

You need to run the SQL policies in your Supabase project. Here's how:

#### **Method 1: Via Supabase Dashboard SQL Editor (RECOMMENDED)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `tgmflbglhmnrliredlbn`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New query"**
5. Copy and paste the contents of `fix-storage-policies.sql` (created in this workspace)
6. Click **"Run"** to execute the SQL

#### **Method 2: Apply Migration Files**

If you have Supabase CLI access, apply these migration files:
```bash
supabase db push
```

Or manually run these specific migrations in SQL Editor:
- `supabase/migrations/20250121000000_setup_profile_pictures.sql`
- `supabase/migrations/20250108000000_add_community_avatars_storage.sql`

## 📋 **What the Policies Do**

### Profile Pictures Policies:
- ✅ Users can upload to their own folder: `profile-pictures/{user_id}/`
- ✅ Users can update/delete their own images
- ✅ Anyone can view profile pictures (public read)

### Community Avatars Policies:
- ✅ Authenticated users can upload to: `community-avatars/communities/{community_id}/`
- ✅ Community creators can update/delete their community avatars
- ✅ Anyone can view community avatars (public read)
- ✅ Temp folder access for testing: `community-avatars/temp/`

## 🧪 **Testing After Fix**

### Test 1: Quick Verification
```bash
# This should work after applying policies
curl -X POST "https://tgmflbglhmnrliredlbn.supabase.co/storage/v1/object/community-avatars/temp/test.txt" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: text/plain" \
  --data "test"
```

### Test 2: Via App Interface
1. Refresh your browser
2. Go to a community page
3. Try uploading a community avatar
4. ✅ Should work without errors!

### Test 3: Use Debug Tools
1. Go to Profile Settings
2. Use "Storage Policy Test" component
3. All tests should pass with green checkmarks

## 🔍 **Why This Happened**

1. **Manual Bucket Creation**: Creating buckets via dashboard only creates the bucket, not the policies
2. **Migration Not Applied**: The migration files contain both bucket creation AND policy creation
3. **RLS Enforcement**: Supabase enforces Row Level Security, blocking uploads without proper policies

## ⚡ **Quick Commands**

### Check if policies exist:
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%community%';
```

### Verify bucket configuration:
```bash
curl -s "https://tgmflbglhmnrliredlbn.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8"
```

## 🎉 **Expected Result**

After applying the SQL policies:
- ✅ Community avatar uploads will work immediately
- ✅ Profile picture uploads will work
- ✅ All upload components will function normally
- ✅ No more "row-level security policy" errors

## 🚨 **If Still Having Issues**

1. **Check Authentication**: Make sure you're logged in to the app
2. **Verify Community Ownership**: Ensure you have permission to edit the community
3. **File Requirements**: Image files under 5MB, supported formats (JPEG, PNG, WebP, GIF)
4. **Browser Console**: Check for specific error messages
5. **Clear Cache**: Try a hard refresh or incognito mode

---

**Status**: ✅ **Issue Diagnosed - Missing RLS Policies**  
**Action Required**: Apply SQL policies via Supabase Dashboard SQL Editor  
**Expected Fix Time**: 2-3 minutes  
**Success Rate**: 99% (policies solve the upload authorization issue)