# 🔧 Live Stream Thumbnail Troubleshooting Guide

## Overview
This guide helps diagnose and fix issues with the live stream thumbnail system. The thumbnail system allows users to upload custom images that are displayed on stream discovery pages.

## Common Issues & Solutions

### 1. ❌ "Upload failed: The resource was not found"

**Cause**: The `stream-thumbnails` storage bucket doesn't exist.

**Solution**:
```bash
# Run the comprehensive fix
psql -h your-db-host -U postgres -d your-database -f fix-thumbnail-system.sql
```

Or manually create the bucket:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-thumbnails',
  'stream-thumbnails',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### 2. ❌ "You must be logged in to upload thumbnails"

**Cause**: User authentication is not working properly.

**Solutions**:
- Check if user is properly authenticated
- Verify Supabase client configuration
- Check browser console for auth errors

### 3. ❌ "You can only upload thumbnails to your own streams"

**Cause**: User doesn't own the stream they're trying to upload to.

**Solutions**:
- Verify the stream ID belongs to the current user
- Check the `live_streams` table for correct `creator_id`

### 4. ❌ "File size must be less than 2MB"

**Cause**: Image file is too large.

**Solutions**:
- Resize the image before upload
- Use image compression tools
- The system automatically processes images, but very large files may still fail

### 5. ❌ Storage policy errors

**Cause**: Row Level Security (RLS) policies are not configured correctly.

**Solution**:
```sql
-- Run the complete policy setup
\i fix-thumbnail-system.sql
```

### 6. ❌ Thumbnails not displaying

**Possible Causes & Solutions**:

1. **Wrong URL format**: Check if thumbnail URLs follow the pattern:
   ```
   https://your-project.supabase.co/storage/v1/object/public/stream-thumbnails/STREAM_ID/thumbnail-TIMESTAMP.ext
   ```

2. **CORS issues**: Ensure your Supabase project allows your domain
3. **Broken URLs**: Check if the stored URLs are accessible
4. **Cache issues**: Try hard refresh (Ctrl+F5)

## Debugging Tools

### 1. Use the Debug Script
```bash
# Set your environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Run the debug script
node debug-thumbnail-issues.js
```

### 2. Use the Browser Debugger Component
Add the `ThumbnailDebugger` component to your app temporarily:

```tsx
import { ThumbnailDebugger } from '@/components/ThumbnailDebugger';

// Add to your router or page
<Route path="/debug-thumbnails" element={<ThumbnailDebugger />} />
```

### 3. Manual SQL Checks

Check if buckets exist:
```sql
SELECT * FROM storage.buckets WHERE name = 'stream-thumbnails';
```

Check storage policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%thumbnail%';
```

Check thumbnail stats:
```sql
SELECT * FROM get_thumbnail_stats();
```

List thumbnail files:
```sql
SELECT name, created_at, metadata->>'size' as size 
FROM storage.objects 
WHERE bucket_id = 'stream-thumbnails' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Step-by-Step Fix Process

### Step 1: Run Database Fixes
```bash
psql -h your-db-host -U postgres -d your-database -f fix-thumbnail-system.sql
```

### Step 2: Verify Bucket Creation
```sql
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'stream-thumbnails';
```

Expected result:
```
id                | name              | public | file_size_limit
stream-thumbnails | stream-thumbnails | t      | 2097152
```

### Step 3: Test Upload
1. Log in to your application
2. Go to a stream you own
3. Try uploading a small image (< 1MB)
4. Check browser console for errors

### Step 4: Verify Display
1. Check that the thumbnail appears in the stream list
2. Verify the URL is accessible directly
3. Test on different browsers/devices

## Prevention

### Regular Maintenance
- Run cleanup functions periodically:
  ```sql
  SELECT cleanup_orphaned_stream_images();
  ```

### Monitoring
- Check thumbnail stats regularly:
  ```sql
  SELECT * FROM get_thumbnail_stats();
  ```

### Best Practices
1. Always validate file types and sizes client-side
2. Provide user feedback during upload
3. Handle errors gracefully
4. Test uploads after any database changes
5. Monitor storage usage and costs

## Environment-Specific Issues

### Development
- Ensure `.env` files have correct Supabase credentials
- Check if local Supabase is running (if using local setup)
- Verify CORS settings allow localhost

### Production
- Check production environment variables
- Verify domain is added to Supabase allowed origins
- Ensure SSL certificates are valid
- Monitor error logs

## Getting Help

If issues persist:

1. **Check logs**: Look in browser console and Supabase logs
2. **Test with debug tools**: Use the provided debugging tools
3. **Verify permissions**: Ensure user has correct permissions
4. **Check network**: Verify network connectivity and CORS
5. **Database state**: Confirm database schema is correct

## Files Created by This Fix

- `fix-thumbnail-system.sql` - Complete database fix
- `debug-thumbnail-issues.js` - Node.js debugging script  
- `ThumbnailDebugger.tsx` - React debugging component
- This troubleshooting guide

Run these tools in order to systematically identify and fix thumbnail issues.