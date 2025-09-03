# Storage Setup Guide - Permission Error Fix

## ❌ The Error You Got
```
ERROR: 42501: must be owner of relation objects
```

This means you don't have sufficient permissions to create storage policies via SQL. This is common with the anon key.

## 🚀 **Solution: Two-Step Process**

### Step 1: Create Buckets Only

Run this simpler SQL script in **Supabase Dashboard → SQL Editor**:

```sql
-- Buckets Only Setup (No Policies)
-- This script only creates storage buckets without policies

-- Create stream-images bucket for display images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-images',
  'stream-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-thumbnails',
  'stream-thumbnails',
  true,
  2097152, -- 2MB limit for thumbnails
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-segments bucket (for HLS/DASH streaming)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-segments',
  'stream-segments',
  true,
  52428800, -- 50MB for video segments
  ARRAY['video/mp4', 'application/vnd.apple.mpegurl', 'application/dash+xml', 'video/mp2t']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-recordings bucket (for VOD)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-recordings',
  'stream-recordings',
  false, -- Private by default
  1073741824, -- 1GB for full recordings
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-chat-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-chat-attachments',
  'stream-chat-attachments',
  true,
  10485760, -- 10MB for chat attachments
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create profile-pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create community-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-avatars',
  'community-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

### Step 2: Add Policies via Dashboard

After the buckets are created, go to **Supabase Dashboard → Storage** and add these policies manually:

#### For `stream-images` bucket:

**Policy 1: "Anyone can view stream images"**
- Operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'stream-images'
```

**Policy 2: "Authenticated users can upload stream images"**
- Operation: `INSERT`
- Policy definition:
```sql
bucket_id = 'stream-images' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
)
```

**Policy 3: "Users can update their own stream images"**
- Operation: `UPDATE`
- Policy definition:
```sql
bucket_id = 'stream-images' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
)
```

**Policy 4: "Users can delete their own stream images"**
- Operation: `DELETE`
- Policy definition:
```sql
bucket_id = 'stream-images' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
)
```

#### For `profile-pictures` bucket:

**Policy 1: "Anyone can view profile pictures"**
- Operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'profile-pictures'
```

**Policy 2: "Users can manage their own profile picture"**
- Operation: `ALL`
- Policy definition:
```sql
bucket_id = 'profile-pictures' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

## 🔧 **Alternative: Manual Bucket Creation**

If the SQL still fails, create buckets manually:

1. Go to **Supabase Dashboard → Storage**
2. Click **"New bucket"**
3. Create each bucket with these settings:

| Bucket Name | Public | File Size Limit | Allowed MIME Types |
|-------------|--------|-----------------|-------------------|
| `stream-images` | ✅ Public | 5MB | image/jpeg, image/png, image/webp, image/gif |
| `stream-thumbnails` | ✅ Public | 2MB | image/jpeg, image/png, image/webp |
| `profile-pictures` | ✅ Public | 5MB | image/jpeg, image/png, image/webp, image/gif |
| `community-avatars` | ✅ Public | 5MB | image/jpeg, image/png, image/webp, image/gif |
| `stream-segments` | ✅ Public | 50MB | video/mp4, application/vnd.apple.mpegurl |
| `stream-recordings` | ❌ Private | 1GB | video/mp4, video/webm, video/quicktime |
| `stream-chat-attachments` | ✅ Public | 10MB | image/jpeg, image/png, image/webp, image/gif, video/mp4 |

## ✅ **Verify It Worked**

After setup, run this to verify:
```bash
node test-storage-setup.js
```

You should see:
```
✅ stream-images bucket exists
✅ stream-thumbnails bucket exists
✅ profile-pictures bucket exists
✅ community-avatars bucket exists
```

## 🎯 **Priority Order**

For your livestream images feature to work, you **MUST** have these buckets with policies:

1. **`stream-images`** ← **Critical for display images**
2. **`profile-pictures`** ← **Critical for user avatars** 
3. `stream-thumbnails` ← Optional but recommended
4. `community-avatars` ← Optional

The other buckets are for future features (video segments, recordings, chat attachments).

## 🚨 **Test After Setup**

Once buckets are created:
1. Login to your app with a user account
2. Try creating a stream with a display image
3. Check if the image appears in the discover page
4. Upload should work without permission errors!