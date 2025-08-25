# Marketplace Storage Solution 🛠️

## 🚨 Current Issue Identified

Your marketplace file uploads are failing because:

1. **No storage buckets exist** in your Supabase project
2. **Service Role Key is not configured** (needed for bucket management)
3. **Anon key has no access** to existing buckets (if any exist but are private)

## 🎯 Immediate Solutions

### Option 1: Manual Bucket Creation (Quickest Fix)

1. **Go to your Supabase Dashboard:**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `tgmflbglhmnrliredlbn`

2. **Create the required buckets:**
   
   **Bucket 1: `product-images`**
   - Click "Storage" → "Create bucket"
   - Name: `product-images`
   - Public: ✅ **Yes** (for public thumbnails)
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp,image/gif`

   **Bucket 2: `digital-products`**
   - Click "Create bucket" again
   - Name: `digital-products`
   - Public: ❌ **No** (for private downloads)
   - File size limit: `104857600` (100MB)
   - Allowed MIME types: Leave empty (all types)

3. **Set up storage policies** (in SQL Editor):
   ```sql
   -- Allow users to upload their product images
   CREATE POLICY "Users can upload product images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'product-images' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow public viewing of product images
   CREATE POLICY "Product images are publicly viewable" ON storage.objects
   FOR SELECT USING (bucket_id = 'product-images');

   -- Allow users to delete their product images
   CREATE POLICY "Users can delete their product images" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'product-images' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow sellers to upload digital products
   CREATE POLICY "Sellers can upload digital products" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'digital-products' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow sellers to delete their digital products
   CREATE POLICY "Sellers can delete their digital products" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'digital-products' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### Option 2: Automatic Setup (Requires Service Key)

1. **Get your Service Role Key:**
   - In Supabase Dashboard → Settings → API
   - Copy the "service_role" key (starts with `eyJ...`)
   - **⚠️ Keep this secret!**

2. **Add to your .env file:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Run the setup:**
   ```bash
   node setup-marketplace-buckets.cjs
   ```

## 🔍 Why This Happened

- **Storage buckets** must be explicitly created - they don't exist by default
- **Anon keys** can't create buckets or see private buckets
- **Service Role Keys** are needed for administrative operations
- **RLS policies** control who can upload/download files

## ✅ After Setup

Once buckets are created, your marketplace uploads will work:

1. Navigate to `/seller-dashboard`
2. Click "Add Product"
3. Upload files - should work perfectly! 🎉

## 🧪 Verification

Run this to verify setup:
```bash
node list-all-buckets.cjs
```

You should see:
```
📋 Found 2 buckets:
   - product-images (public)
   - digital-products (private)
```

## 🆘 Still Having Issues?

If you're still seeing "buckets already exist" but uploads fail:

1. **Check bucket names** - they must be exactly `product-images` and `digital-products`
2. **Verify policies** - run the SQL policies above in your Supabase SQL Editor
3. **Test authentication** - make sure users are logged in when uploading
4. **Check file types** - ensure uploaded files match allowed MIME types

The enhanced error handling in your app will now show helpful messages to guide users through any remaining issues! 🚀