# Livestream Storage Policies Implementation Guide

This guide provides comprehensive storage bucket policies for your livestreaming application, including security, performance optimization, and automated cleanup strategies.

## 🚀 Quick Start

1. **Apply the main policies:**
   ```bash
   # Run the comprehensive policies in your Supabase SQL editor
   psql -f comprehensive-livestream-storage-policies.sql
   ```

2. **Set up scheduled cleanup jobs in your application:**
   ```javascript
   // Example using node-cron
   const cron = require('node-cron');
   
   // Daily cleanup of expired segments
   cron.schedule('0 2 * * *', async () => {
     await supabase.rpc('cleanup_expired_stream_segments');
   });
   
   // Weekly cleanup of orphaned attachments  
   cron.schedule('0 3 * * 0', async () => {
     await supabase.rpc('cleanup_orphaned_chat_attachments');
   });
   ```

## 📦 Storage Buckets Overview

### 1. **stream-thumbnails** (Public)
- **Purpose**: Stream preview images and thumbnails
- **Size Limit**: 2MB per file
- **MIME Types**: JPEG, PNG, WebP
- **Access**: Public read, creators can upload/modify their own

### 2. **stream-segments** (Public)
- **Purpose**: HLS/DASH video segments for live streaming
- **Size Limit**: 50MB per file
- **MIME Types**: MP4, M3U8, MPD, TS
- **Access**: Public read for active streams only

### 3. **stream-recordings** (Private)
- **Purpose**: Full stream recordings (VOD)
- **Size Limit**: 1GB per file
- **MIME Types**: MP4, WebM, QuickTime
- **Access**: Based on stream access permissions

### 4. **stream-chat-attachments** (Public)
- **Purpose**: Images/videos shared in stream chat
- **Size Limit**: 10MB per file
- **MIME Types**: Images and short videos
- **Access**: Public read, users can upload to their own folders

## 🔒 Security Features

### Access Control
- **Folder-based permissions**: Files organized by stream ID and user ID
- **Community-based access**: Respects private/public community settings
- **Creator ownership**: Stream creators have full control over their content

### Rate Limiting
- **Stream segments**: 1000 uploads/hour (for live streaming)
- **Thumbnails**: 10 uploads/hour
- **Chat attachments**: 50 uploads/hour
- **Recordings**: 5 uploads/hour

### Data Protection
- **Automated cleanup**: Prevents storage bloat
- **Retention policies**: Different retention based on user subscription
- **Orphaned file cleanup**: Removes files for deleted streams

## 🧹 Automated Cleanup System

### Stream Segments Cleanup
- **Frequency**: Daily
- **Rules**: 
  - Delete segments older than 24 hours
  - Delete segments for ended streams after 1 hour

### Chat Attachments Cleanup
- **Frequency**: Weekly
- **Rules**:
  - Delete attachments for deleted streams
  - Delete attachments older than 30 days

### Recordings Cleanup
- **Frequency**: Monthly
- **Rules**:
  - Free users: 90-day retention
  - Premium users: 1-year retention

## 📊 Monitoring & Analytics

### Storage Usage Tracking
The system includes automatic logging of storage usage:

```sql
-- View current storage usage
SELECT * FROM storage_usage_logs 
WHERE logged_at > NOW() - INTERVAL '7 days'
ORDER BY logged_at DESC;
```

### Performance Monitoring
Monitor these metrics in your application:
- Upload success rates
- Download speeds
- Storage costs per bucket
- Rate limit violations

## 🛠 Implementation Steps

### Step 1: Deploy Base Policies
```bash
# Apply the comprehensive policies
psql -h your-db-host -d your-db -f comprehensive-livestream-storage-policies.sql
```

### Step 2: Set Up Cleanup Scheduling
Choose one of these approaches:

#### Option A: Application-level Cron Jobs
```javascript
// In your Node.js application
const cron = require('node-cron');

// Daily cleanup (2 AM)
cron.schedule('0 2 * * *', async () => {
  try {
    await supabase.rpc('cleanup_expired_stream_segments');
    console.log('✅ Stream segments cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
});

// Weekly cleanup (Sunday 3 AM)
cron.schedule('0 3 * * 0', async () => {
  await supabase.rpc('cleanup_orphaned_chat_attachments');
});

// Monthly cleanup (1st day, 4 AM)
cron.schedule('0 4 1 * *', async () => {
  await supabase.rpc('cleanup_old_recordings');
});
```

#### Option B: Supabase Edge Functions
```typescript
// Create an edge function for scheduled cleanup
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Run cleanup functions
  await supabase.rpc('cleanup_expired_stream_segments');
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Step 3: Configure Your Application

#### Frontend Upload Examples
```typescript
// Upload stream thumbnail
const uploadThumbnail = async (streamId: string, file: File) => {
  const fileName = `${streamId}/thumbnail-${Date.now()}.${file.name.split('.').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('stream-thumbnails')
    .upload(fileName, file);
    
  if (error) throw error;
  return data;
};

// Upload chat attachment
const uploadChatAttachment = async (streamId: string, userId: string, file: File) => {
  const fileName = `${streamId}/${userId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('stream-chat-attachments')
    .upload(fileName, file);
    
  return data;
};
```

#### Backend Stream Processing
```typescript
// Upload HLS segments during live streaming
const uploadStreamSegment = async (streamId: string, segmentData: Buffer, segmentIndex: number) => {
  const fileName = `${streamId}/segment-${segmentIndex}.ts`;
  
  const { data, error } = await supabase.storage
    .from('stream-segments')
    .upload(fileName, segmentData, {
      contentType: 'video/mp2t',
      cacheControl: '3600' // 1 hour cache
    });
    
  return data;
};
```

## ⚡ Performance Optimization

### CDN Configuration
For optimal performance, configure your CDN to:
- Cache thumbnails for 24 hours
- Cache stream segments for 1 hour
- Set appropriate headers for video content

### File Organization Best Practices
```
stream-thumbnails/
├── {stream-id}/
│   ├── thumbnail.jpg
│   └── preview.webp

stream-segments/
├── {stream-id}/
│   ├── playlist.m3u8
│   ├── segment-001.ts
│   └── segment-002.ts

stream-recordings/
├── {stream-id}/
│   └── recording-{timestamp}.mp4

stream-chat-attachments/
├── {stream-id}/
│   ├── {user-id}/
│   │   ├── image-{timestamp}.jpg
│   │   └── video-{timestamp}.mp4
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Upload Permission Denied
**Problem**: Users can't upload files
**Solution**: Check if the user is authenticated and the stream belongs to them:
```sql
-- Verify user permissions
SELECT * FROM live_streams WHERE id = 'stream-id' AND creator_id = 'user-id';
```

#### 2. Rate Limit Exceeded
**Problem**: Too many uploads in short time
**Solution**: Implement client-side rate limiting or increase limits:
```sql
-- Check current upload count
SELECT COUNT(*) FROM storage.objects 
WHERE owner = 'user-id' 
AND bucket_id = 'stream-segments'
AND created_at > NOW() - INTERVAL '1 hour';
```

#### 3. Storage Cleanup Not Working
**Problem**: Old files not being deleted
**Solution**: Check function permissions and run manually:
```sql
-- Test cleanup function
SELECT cleanup_expired_stream_segments();

-- Check function permissions
SELECT has_function_privilege('cleanup_expired_stream_segments()', 'execute');
```

### Monitoring Queries

```sql
-- Check storage usage by bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_bytes,
  SUM((metadata->>'size')::bigint) / 1024 / 1024 as total_mb
FROM storage.objects 
GROUP BY bucket_id
ORDER BY total_bytes DESC;

-- Find large files
SELECT 
  name,
  bucket_id,
  (metadata->>'size')::bigint / 1024 / 1024 as size_mb,
  created_at
FROM storage.objects 
WHERE (metadata->>'size')::bigint > 50 * 1024 * 1024 -- Files > 50MB
ORDER BY (metadata->>'size')::bigint DESC;

-- Check recent uploads
SELECT 
  bucket_id,
  COUNT(*) as uploads_today
FROM storage.objects 
WHERE created_at > CURRENT_DATE
GROUP BY bucket_id;
```

## 🚨 Security Checklist

- [ ] **Row Level Security enabled** on all storage buckets
- [ ] **Rate limiting implemented** to prevent abuse
- [ ] **File size limits configured** appropriately
- [ ] **MIME type restrictions** in place
- [ ] **Cleanup functions scheduled** and running
- [ ] **Access permissions tested** for different user types
- [ ] **Monitoring alerts configured** for storage usage
- [ ] **Backup strategy implemented** for critical recordings

## 💡 Best Practices

### 1. File Naming Conventions
- Use timestamp prefixes for chronological sorting
- Include stream ID in all file paths
- Use UUID for user-generated content to avoid conflicts

### 2. Error Handling
```typescript
const handleUploadError = (error: any) => {
  if (error.message.includes('rate limit')) {
    return 'Too many uploads. Please wait and try again.';
  }
  if (error.message.includes('file size')) {
    return 'File is too large. Please choose a smaller file.';
  }
  return 'Upload failed. Please try again.';
};
```

### 3. User Experience
- Show upload progress for large files
- Provide clear error messages
- Implement retry logic for failed uploads
- Use optimistic UI updates where appropriate

### 4. Cost Optimization
- Implement automatic compression for thumbnails
- Use progressive JPEG for better loading
- Clean up test/temporary files regularly
- Monitor storage costs and set up alerts

## 📈 Scaling Considerations

As your platform grows, consider:

1. **Separate buckets by region** for better performance
2. **Implement CDN** for global content delivery
3. **Use database partitioning** for storage logs
4. **Set up automated backups** for critical content
5. **Monitor and optimize** cleanup functions performance

## 🔄 Migration from Existing Setup

If you already have storage buckets, use this migration approach:

```sql
-- 1. Backup existing policies
CREATE TABLE policy_backup AS 
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- 2. Apply new policies (they will replace existing ones)
\i comprehensive-livestream-storage-policies.sql

-- 3. Verify new policies work
SELECT * FROM test_livestream_access();

-- 4. Clean up if everything works
DROP TABLE policy_backup;
```

This comprehensive setup provides a robust, secure, and scalable storage solution for your livestreaming platform. Remember to test thoroughly in a staging environment before applying to production!