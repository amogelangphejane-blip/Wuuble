# 🔧 UPLOAD PERMISSION FIX - IMMEDIATE SOLUTION

## ❌ Current Error
```
Cannot upload: new row violates row-level security policy
```

## ✅ Root Cause Identified
The community avatar upload policy is inconsistent with the file path structure and security requirements.

## 🚀 IMMEDIATE FIX - Manual Application

Since the Supabase CLI isn't linked, apply this fix manually:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/tgmflbglhmnrliredlbn
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Execute This SQL (Choose One Option)

#### Option A: Strict Security (Recommended)
```sql
-- Fix community avatar upload policy - Creator Only
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

-- Ensure public viewing is enabled
CREATE POLICY IF NOT EXISTS "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');
```

#### Option B: Flexible Access (Better UX)
```sql
-- Fix community avatar upload policy - Creator OR Member
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;

CREATE POLICY "Community members can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND (
    -- Either the user is the community creator
    EXISTS (
      SELECT 1 FROM public.communities 
      WHERE id = (storage.foldername(name))[2]::uuid 
      AND creator_id = auth.uid()
    )
    OR
    -- Or the user is a member of the community
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.communities c ON c.id = cm.community_id
      WHERE c.id = (storage.foldername(name))[2]::uuid 
      AND cm.user_id = auth.uid()
    )
  )
);

-- Ensure public viewing is enabled
CREATE POLICY IF NOT EXISTS "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');
```

### Step 3: Test the Fix

1. **Use the Built-in Test Component**:
   - Open your app
   - Find and use the `StoragePolicyTest` component
   - Click "Test Storage Policies"
   - Verify "Upload Permission" shows ✅ success

2. **Test Real Uploads**:
   - Try uploading a community avatar as a community creator
   - Try uploading a profile picture
   - Verify images display correctly

## 🔍 Why This Fixes the Issue

### The Problem
The original policy was either:
1. **Too permissive**: Allowed any authenticated user to upload anywhere in the bucket
2. **Inconsistent**: INSERT policy didn't match UPDATE/DELETE policies
3. **Missing validation**: Didn't check proper community ownership

### The Solution
The new policy:
- ✅ Validates bucket access (`community-avatars`)
- ✅ Ensures user is authenticated
- ✅ Validates file path structure (`communities/{id}/...`)
- ✅ Checks community ownership or membership
- ✅ Consistent with existing UPDATE/DELETE policies

## 📊 Expected Results

After applying the fix:

| Test | Before | After |
|------|--------|-------|
| Profile Picture Upload | ✅ Works | ✅ Works |
| Community Avatar Upload (Creator) | ❌ RLS Error | ✅ Works |
| Community Avatar Upload (Member)* | ❌ RLS Error | ✅/❌ Depends on option |
| Unauthorized Upload | ❌ RLS Error | ❌ RLS Error (Good!) |

*Only works with Option B (flexible access)

## 🚨 If Issues Persist

1. Check browser console for detailed error messages
2. Verify the user is logged in and has proper community access
3. Check Supabase dashboard for policy status
4. Ensure the `communities` and `community_members` tables have proper data

## 📝 Files Modified

- ✅ Created: `supabase/migrations/20250123000000_fix_community_avatar_upload_permissions.sql`
- ✅ Created: `supabase/migrations/20250123000001_alternative_community_avatar_policy.sql`  
- ✅ Created: `UPLOAD_PERMISSION_FIX.md` (detailed technical documentation)
- ✅ Created: This solution guide

The upload permission issue should be resolved after applying either migration option!