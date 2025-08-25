# 🗄️ Storage Buckets Technical Specifications

## 📋 **BUCKET SPECIFICATIONS**

### 1. **product-files** Bucket

#### Basic Configuration
```json
{
  "id": "product-files",
  "name": "product-files",
  "public": false,
  "file_size_limit": 104857600,
  "allowed_mime_types": [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.rar",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "video/avi",
    "video/mov",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "text/plain",
    "text/csv",
    "application/json",
    "application/javascript",
    "text/css",
    "text/html",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ],
  "avif_autodetection": false
}
```

#### File Organization Structure
```
product-files/
├── {seller_id}/
│   ├── {product_id}/
│   │   ├── main_file.{ext}
│   │   ├── bonus_content/
│   │   │   ├── bonus1.pdf
│   │   │   └── bonus2.zip
│   │   └── versions/
│   │       ├── v1.0/
│   │       └── v2.0/
│   └── temp/
│       └── {upload_id}.{ext}
```

#### Size and Limits
- **Maximum file size**: 100 MB (104,857,600 bytes)
- **Storage per seller**: Unlimited
- **Concurrent uploads**: 10 per user
- **Download bandwidth**: 1 GB/day per user
- **Retention**: Permanent (until manually deleted)

### 2. **product-images** Bucket

#### Basic Configuration
```json
{
  "id": "product-images",
  "name": "product-images",
  "public": true,
  "file_size_limit": 10485760,
  "allowed_mime_types": [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/avif",
    "image/heic",
    "image/heif"
  ],
  "avif_autodetection": true
}
```

#### File Organization Structure
```
product-images/
├── thumbnails/
│   ├── {product_id}/
│   │   ├── main.webp
│   │   ├── main_thumb.webp (300x300)
│   │   └── main_large.webp (800x800)
├── previews/
│   ├── {product_id}/
│   │   ├── preview_1.webp
│   │   ├── preview_2.webp
│   │   └── preview_3.webp
├── seller_avatars/
│   └── {seller_id}.webp
└── categories/
    └── {category_id}.webp
```

#### Size and Limits
- **Maximum file size**: 10 MB (10,485,760 bytes)
- **Image dimensions**: Max 4096x4096 pixels
- **Formats supported**: JPEG, PNG, GIF, WebP, SVG, AVIF, HEIC
- **Auto-optimization**: Enabled (WebP conversion)
- **CDN caching**: 7 days
- **Concurrent uploads**: 20 per user

---

## 🔒 **SECURITY POLICIES**

### **product-files** Bucket Policies (Private Access)

#### 1. Upload Policy
```sql
CREATE POLICY "Authenticated users can upload product files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Specifications:**
- **Who**: Authenticated users only
- **What**: Can upload files to their own folder
- **Where**: Only to `product-files/{user_id}/` path
- **When**: During active session
- **Size limit**: Enforced at bucket level (100MB)

#### 2. Download Policy
```sql
CREATE POLICY "Users can download purchased products" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'product-files'
  AND (
    -- Seller can access their own files
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Buyers can access purchased products
    EXISTS (
      SELECT 1 FROM product_orders po
      JOIN digital_products dp ON po.product_id = dp.id
      WHERE po.buyer_id = auth.uid()
      AND po.status = 'completed'
      AND dp.file_url LIKE '%' || name || '%'
    )
    OR
    -- Admins can access all files
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);
```

**Specifications:**
- **Seller access**: Full access to own files
- **Buyer access**: Only purchased and completed orders
- **Admin access**: Full access to all files
- **Security check**: Validates purchase status before download
- **Audit trail**: All downloads logged

#### 3. Update Policy
```sql
CREATE POLICY "Users can update their own product files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 4. Delete Policy
```sql
CREATE POLICY "Users can delete their own product files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);
```

### **product-images** Bucket Policies (Public Access)

#### 1. View Policy (Public)
```sql
CREATE POLICY "Anyone can view product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');
```

**Specifications:**
- **Access**: Completely public
- **Caching**: CDN enabled
- **Bandwidth**: Unlimited viewing
- **SEO**: Images indexed by search engines

#### 2. Upload Policy
```sql
CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (
    -- Users can upload to their own folders
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Users can upload to product folders they own
    EXISTS (
      SELECT 1 FROM digital_products dp
      WHERE dp.seller_id = auth.uid()
      AND name LIKE 'thumbnails/' || dp.id::text || '%'
    )
    OR
    -- Users can upload to preview folders for their products
    EXISTS (
      SELECT 1 FROM digital_products dp
      WHERE dp.seller_id = auth.uid()
      AND name LIKE 'previews/' || dp.id::text || '%'
    )
  )
);
```

#### 3. Update Policy
```sql
CREATE POLICY "Users can update their own product images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM digital_products dp
      WHERE dp.seller_id = auth.uid()
      AND (
        name LIKE 'thumbnails/' || dp.id::text || '%'
        OR name LIKE 'previews/' || dp.id::text || '%'
      )
    )
  )
);
```

#### 4. Delete Policy
```sql
CREATE POLICY "Users can delete their own product images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM digital_products dp
      WHERE dp.seller_id = auth.uid()
      AND (
        name LIKE 'thumbnails/' || dp.id::text || '%'
        OR name LIKE 'previews/' || dp.id::text || '%'
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
);
```

---

## ⚙️ **TECHNICAL CONFIGURATION**

### Supabase Dashboard Settings

#### product-files Bucket
```yaml
Bucket Name: product-files
Public: false
File Size Limit: 100 MB
Allowed MIME Types: 
  - application/pdf
  - application/zip
  - application/x-zip-compressed
  - image/jpeg
  - image/png
  - video/mp4
  - audio/mpeg
  - text/plain
  - application/json
AVIF Auto-detection: false
```

#### product-images Bucket
```yaml
Bucket Name: product-images
Public: true
File Size Limit: 10 MB
Allowed MIME Types:
  - image/jpeg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml
AVIF Auto-detection: true
```

### Environment Variables Required
```bash
# .env configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
```

### API Integration Points

#### Upload Service Configuration
```typescript
// File upload options
const uploadOptions = {
  productFiles: {
    bucket: 'product-files',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/pdf', 'application/zip', /* ... */],
    folder: (userId: string, productId: string) => `${userId}/${productId}`
  },
  productImages: {
    bucket: 'product-images',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', /* ... */],
    folder: (type: string, id: string) => `${type}/${id}`
  }
};
```

---

## 📊 **MONITORING & ANALYTICS**

### Key Metrics to Track
- **Storage usage per bucket**
- **Upload success/failure rates**
- **Download frequency by product**
- **Bandwidth usage**
- **Policy violation attempts**

### Alerts Configuration
- **Storage quota warnings** (80% full)
- **Unusual download patterns**
- **Failed upload spikes**
- **Policy violation attempts**

---

## 🔧 **MAINTENANCE PROCEDURES**

### Regular Tasks
1. **Weekly**: Review storage usage and costs
2. **Monthly**: Audit access logs for security
3. **Quarterly**: Clean up orphaned files
4. **Annually**: Review and update policies

### Backup Strategy
- **product-files**: Daily incremental backups
- **product-images**: Weekly full backups
- **Retention**: 30 days for files, 90 days for images

This specification provides complete technical details for implementing the storage buckets with proper security, organization, and maintenance procedures.