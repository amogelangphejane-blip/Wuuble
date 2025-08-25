# Marketplace File Upload Fix Guide

## 🚨 Issue Identified

The product file upload functionality is failing because the required **storage buckets are missing** from your Supabase project.

## 📋 Required Storage Buckets

Your marketplace needs these two storage buckets:

1. **`product-images`** - For product thumbnails and preview images (public)
2. **`digital-products`** - For downloadable product files (private)

## 🛠️ Solution Options

### Option 1: Automatic Setup (Recommended)

1. **Get your Service Role Key:**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings → API
   - Copy the "service_role" key (starts with `eyJ...`)

2. **Update your .env file:**
   ```bash
   # Add this line to your .env file
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Run the setup script:**
   ```bash
   node setup-marketplace-buckets.cjs
   ```

### Option 2: Manual Setup (Alternative)

If you prefer to create buckets manually:

1. **Go to Supabase Dashboard:**
   - Navigate to Storage in your project
   - Click "Create bucket"

2. **Create product-images bucket:**
   - Name: `product-images`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`

3. **Create digital-products bucket:**
   - Name: `digital-products` 
   - Public: ❌ No (private)
   - File size limit: 100MB
   - Allowed MIME types: Leave empty (all types)

## 🔐 Storage Policies (Important!)

After creating buckets, you need proper access policies. The setup script handles this automatically, or you can add them manually in the SQL Editor:

### Product Images Policies:
```sql
-- Allow users to upload their own product images
CREATE POLICY "Users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public viewing of product images  
CREATE POLICY "Product images are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Digital Products Policies:
```sql
-- Allow sellers to upload products
CREATE POLICY "Sellers can upload digital products" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-products' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow buyers to download purchased products
CREATE POLICY "Buyers can download purchased products" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM digital_product_purchases dpp
      JOIN digital_products dp ON dpp.product_id = dp.id
      WHERE dp.file_url LIKE '%' || name || '%'
      AND dpp.buyer_id = auth.uid()
      AND dpp.status = 'completed'
    )
  )
);

-- Allow sellers to delete their products
CREATE POLICY "Sellers can delete their digital products" ON storage.objects
FOR DELETE USING (
  bucket_id = 'digital-products' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## ✅ Verification

After setup, verify everything works:

1. **Check buckets exist:**
   ```bash
   node check-buckets.cjs
   ```

2. **Test upload functionality:**
   - Go to `/seller-dashboard` in your app
   - Click "Add Product" 
   - Try uploading a product file

## 🔧 Troubleshooting

### Common Issues:

1. **"Upload failed: Invalid bucket"**
   - Solution: Buckets don't exist, follow setup steps above

2. **"Upload failed: new row violates row-level security policy"**
   - Solution: Storage policies are missing or incorrect

3. **"Permission denied"**
   - Solution: User not authenticated or wrong service role key

4. **"File too large"**
   - Solution: Check bucket file size limits (5MB for images, 100MB for products)

## 📞 Support

If you're still having issues:
1. Check browser console for detailed error messages
2. Verify your Supabase project is active and properly configured
3. Ensure all environment variables are set correctly
4. Try the manual bucket creation method as an alternative

The marketplace upload functionality should work perfectly once the storage buckets are properly configured! 🎉