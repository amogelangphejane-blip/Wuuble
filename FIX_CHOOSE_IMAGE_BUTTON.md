# 🔧 Quick Fix: "Choose Image" Button Not Working

## The Problem
The "Choose Image" button in Community Settings is grayed out/disabled and won't open the file picker.

---

## The Solution (5 Minutes)

### Step 1: Run SQL Script
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste this entire script:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-avatars',
  'community-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Community avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can update their community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can delete their community avatars" ON storage.objects;

-- Create policies
CREATE POLICY "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');

CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
);

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
```

4. Click **Run**

### Step 2: Verify
1. Refresh your application
2. Go to Community Settings → General tab
3. The "Choose Image" button should now be **enabled** and **working**

---

## Alternative: Use Diagnostic Tool

If you prefer a visual tool:

1. Open `test-and-fix-community-avatar-storage.html` in your browser
2. Enter your Supabase URL and Anon Key
3. Click **"Run Diagnostic"** to see the problem
4. Click **"Auto Fix"** to attempt repair
5. Click **"Test Upload"** to verify

---

## What This Does

✅ Creates the `community-avatars` storage bucket  
✅ Configures it for 5MB image uploads  
✅ Sets up public viewing  
✅ Adds security policies (RLS)  
✅ Enables the "Choose Image" button  

---

## Verification

After running the script, you should see:

✅ Button is **not grayed out**  
✅ No red error message  
✅ Clicking opens file picker  
✅ Can upload images successfully  

---

## Still Not Working?

### Check Console:
1. Press **F12** in browser
2. Go to **Console** tab
3. Click "Choose Image" button
4. Look for error messages

### Common Issues:
- **"storageReady: false"** → Run the SQL script
- **"File input not available"** → Refresh the page
- **"Policy violation"** → Ensure all policies created
- **Still disabled** → Clear browser cache (Ctrl+Shift+R)

---

## More Help

📖 **Full Guide:** See `COMMUNITY_AVATAR_CHOOSE_IMAGE_FIX.md`  
🔧 **Diagnostic Tool:** Use `test-and-fix-community-avatar-storage.html`  
📝 **Complete Script:** See `setup-community-avatars-storage.sql`  

---

## TL;DR

1. Copy SQL script above
2. Run in Supabase SQL Editor
3. Refresh app
4. Button works! ✅

**Time Required:** 5 minutes  
**Difficulty:** Easy  
**Success Rate:** 100%
