# Seller Product Listing Issue - Diagnosis & Fix

## 🔍 Issue Identified

**Problem**: Sellers cannot list products in the digital marketplace.

**Root Cause**: Missing storage buckets in Supabase that are required for uploading product files and images.

## 📊 Diagnosis Results

✅ **Database Tables**: All required tables exist
- `product_categories` ✅ (8 categories available)
- `digital_products` ✅ 
- `product_reviews` ✅
- `product_orders` ✅
- `seller_profiles` ✅
- `product_wishlists` ✅
- `store_notifications` ✅

❌ **Storage Buckets**: Missing required buckets
- `digital-products` ❌ (for storing digital product files)
- `product-images` ❌ (for storing product thumbnails/previews)

## 🛠️ Solutions

### Option 1: Manual Bucket Creation (Recommended)

1. **Log into Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: `tgmflbglhmnrliredlbn`

2. **Create Storage Buckets**
   - Go to "Storage" → "Buckets"
   - Create bucket: `digital-products`
     - Set as **Private** (not public)
     - This stores the actual digital product files
   - Create bucket: `product-images` 
     - Set as **Public** (publicly accessible)
     - This stores product thumbnails and preview images

3. **Set Storage Policies** (if not auto-created)
   - For `digital-products` bucket:
     - Allow authenticated users to upload to their own folder
     - Allow buyers to download purchased products
   - For `product-images` bucket:
     - Allow authenticated users to upload
     - Allow public read access

### Option 2: Using Service Role Key

If you have the `SUPABASE_SERVICE_ROLE_KEY`:

1. **Add to .env file**:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Run the setup script**:
   ```bash
   node setup-digital-store.cjs
   ```

### Option 3: SQL Approach

Run this SQL in the Supabase SQL Editor:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('digital-products', 'digital-products', false),
  ('product-images', 'product-images', true);

-- Storage policies (adjust as needed)
CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Sellers can upload digital products" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'digital-products' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🧪 Testing the Fix

After creating the storage buckets, test the functionality:

1. **Run the diagnostic script**:
   ```bash
   node test-store-connection.cjs
   ```
   Should show: ✅ All required storage buckets exist

2. **Test in the application**:
   - Log in as a user
   - Navigate to `/seller-dashboard`
   - Try to create a new product
   - Upload should now work

## 🔧 Additional Requirements

### For Sellers to List Products:

1. **User Authentication**: Users must be logged in
2. **Seller Profile**: Users may need to create a seller profile first
3. **Product Categories**: Available (already set up)
4. **File Upload**: Requires the storage buckets (main issue)

### File Upload Requirements:

- **Product Files**: Up to 100MB, any file type
- **Thumbnail Images**: Up to 5MB, JPEG/PNG/WebP
- **Preview Images**: Up to 5MB each, JPEG/PNG/WebP

## 📋 Verification Steps

1. **Check buckets exist**:
   ```bash
   node test-store-connection.cjs
   ```

2. **Test seller dashboard**:
   - Navigate to `/seller-dashboard`
   - Click "Add Product"
   - Try uploading files

3. **Check error messages**:
   - Look for upload errors
   - Check browser console for detailed errors

## 🚨 Common Issues After Fix

1. **Storage Policies**: May need manual adjustment
2. **File Size Limits**: Check if uploads fail due to size
3. **MIME Type Restrictions**: Ensure allowed file types are correct
4. **Authentication**: Users must be logged in to upload

## 🎯 Expected Behavior After Fix

- ✅ Sellers can access the seller dashboard
- ✅ "Add Product" button works
- ✅ File uploads succeed (thumbnails, previews, product files)
- ✅ Products appear in the marketplace
- ✅ Product images display correctly

## 📞 Support

If issues persist after creating storage buckets:

1. Check browser console for JavaScript errors
2. Verify storage policies are correct
3. Ensure user authentication is working
4. Test with different file types/sizes

---

**Status**: Issue identified and solution provided. Manual bucket creation required.