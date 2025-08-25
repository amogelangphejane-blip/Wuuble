# 🔧 Livestream Thumbnail Troubleshooting Guide

## 🚨 Problem: Livestream thumbnails are not appearing

This guide provides a complete solution for fixing thumbnail display issues in your livestream application.

## 📋 Quick Diagnosis

### Step 1: Use the Diagnostic Tool
1. Open `http://localhost:8080/diagnose-thumbnail-issue.html` in your browser
2. Enter your Supabase URL and Anon Key
3. Run all diagnostic tests
4. Note any errors or warnings

### Step 2: Check Common Issues

**✅ Checklist:**
- [ ] `stream-thumbnails` storage bucket exists
- [ ] Bucket is set to **public** 
- [ ] Storage policies allow public read access
- [ ] Thumbnail URLs are properly formatted
- [ ] Images are actually uploaded to the bucket
- [ ] CORS is configured correctly

## 🛠️ Complete Fix Process

### Option A: Automated Fix (Recommended)

1. **Run the setup script:**
   ```bash
   ./setup-thumbnails.sh
   ```

2. **Apply SQL fixes manually:**
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste contents of `fix-thumbnail-system.sql`
   - Execute the script

3. **Verify the fix:**
   ```bash
   node test-and-fix-thumbnails.js
   ```

### Option B: Manual Fix

#### 1. Create Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-thumbnails',
  'stream-thumbnails',
  true, -- IMPORTANT: Must be public
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

#### 2. Set Up Storage Policies
```sql
-- Public read access (crucial for thumbnails to display)
CREATE POLICY "Public read access for stream thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-thumbnails');

-- Authenticated upload access
CREATE POLICY "Authenticated users can upload stream thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );
```

#### 3. Verify Database Schema
```sql
-- Ensure thumbnail columns exist
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS display_image_url TEXT;
```

## 🔍 Debugging Steps

### Check Storage Bucket Status
1. Go to Supabase Dashboard → Storage
2. Look for `stream-thumbnails` bucket
3. Ensure it's marked as **Public**
4. Check if files are actually uploaded

### Test Storage Policies
```javascript
// Test in browser console
const { data, error } = await supabase.storage
  .from('stream-thumbnails')
  .list('', { limit: 1 });

console.log('Storage test:', { data, error });
```

### Verify Thumbnail URLs
```javascript
// Check if URLs are properly formatted
const { data: streams } = await supabase
  .from('live_streams')
  .select('id, title, thumbnail_url')
  .not('thumbnail_url', 'is', null);

streams.forEach(stream => {
  console.log(`${stream.title}: ${stream.thumbnail_url}`);
});
```

## 🎯 Common Issues & Solutions

### Issue 1: "Bucket not found"
**Solution:** Create the bucket using the SQL script or Supabase dashboard

### Issue 2: "Permission denied" 
**Solution:** Make sure the bucket is public and policies allow read access

### Issue 3: "Images not uploading"
**Solution:** Check authentication and upload policies

### Issue 4: "URLs are broken"
**Solution:** Run the URL fix function in the SQL script

### Issue 5: "CORS errors"
**Solution:** Ensure bucket is public and CORS is configured in Supabase

## 📱 Testing the Fix

### 1. Test Thumbnail Upload
1. Create a new livestream
2. Go to Stream Management → Thumbnail section  
3. Upload an image
4. Verify it appears in Storage bucket
5. Check if thumbnail displays in discovery page

### 2. Test Thumbnail Display
1. Go to Livestream Discovery page
2. Look for streams with thumbnails
3. Verify images load properly
4. Check browser developer tools for errors

### 3. Test Different Scenarios
- [ ] Upload new thumbnail
- [ ] Replace existing thumbnail  
- [ ] Delete thumbnail
- [ ] View thumbnails while logged out
- [ ] View thumbnails in different browsers

## 🔧 Manual Verification Commands

```bash
# Check if bucket exists
curl -X GET "https://your-project.supabase.co/storage/v1/bucket/stream-thumbnails" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test public access to a thumbnail
curl -I "https://your-project.supabase.co/storage/v1/object/public/stream-thumbnails/STREAM_ID/thumbnail.jpg"
```

## 📞 Still Having Issues?

If thumbnails still aren't appearing after following this guide:

1. **Check browser console** for JavaScript errors
2. **Verify network requests** in browser dev tools
3. **Test with different image formats** (JPG, PNG, WebP)
4. **Check Supabase logs** for storage errors
5. **Verify authentication** is working properly

### Debug Information to Collect:
- Browser console errors
- Network request failures
- Supabase storage bucket configuration
- Example thumbnail URLs that aren't working
- Authentication status

## 🎉 Success Indicators

You'll know the fix worked when:
- ✅ Thumbnails appear on the discovery page
- ✅ Thumbnail upload works in stream management
- ✅ No console errors related to images
- ✅ Images load when accessed directly via URL
- ✅ Diagnostic tool shows all green checkmarks

---

**💡 Pro Tip:** Always test with both authenticated and unauthenticated users to ensure public access works correctly!