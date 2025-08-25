# 🗄️ Storage Buckets Setup Guide

## 📋 **CREATED FILES & SCRIPTS**

✅ **Files Created:**
- `create-storage-buckets.cjs` - Comprehensive bucket creation script
- `simple-bucket-creation.cjs` - Simplified approach
- `create-buckets-sql.sql` - Direct SQL commands for bucket creation

## 🎯 **REQUIRED BUCKETS**

### 1. **product-files** (Private Bucket)
- **Purpose**: Store digital products for download
- **Access**: Private (only buyers who purchased can download)
- **File Types**: PDF, ZIP, Images, Videos, Audio, Documents
- **Size Limit**: 100MB per file
- **Security**: Row-level security with user-based access

### 2. **product-images** (Public Bucket) 
- **Purpose**: Store product thumbnails and preview images
- **Access**: Public (anyone can view)
- **File Types**: JPEG, PNG, GIF, WebP, SVG
- **Size Limit**: 10MB per file
- **Security**: Public read access, authenticated write access

## 🚀 **SETUP METHODS**

### Method 1: Supabase Dashboard (Recommended)

**Step-by-Step Instructions:**

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   → Select your project
   → Navigate to "Storage" section
   ```

2. **Create product-files Bucket**
   ```
   → Click "Create Bucket"
   → Name: product-files
   → Public: ❌ (Keep private)
   → Click "Create Bucket"
   ```

3. **Create product-images Bucket**
   ```
   → Click "Create Bucket" 
   → Name: product-images
   → Public: ✅ (Make public)
   → Click "Create Bucket"
   ```

4. **Configure Policies (Optional)**
   - The system will create basic policies automatically
   - For advanced policies, use the SQL method below

### Method 2: SQL Editor (Advanced)

1. **Go to Supabase Dashboard → SQL Editor**

2. **Run the SQL script:**
   ```sql
   -- Copy and paste contents from create-buckets-sql.sql
   -- This will create both buckets and set up proper policies
   ```

3. **Execute the query**

### Method 3: Programmatic (If you have service role key)

1. **Add service role key to .env:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Run the creation script:**
   ```bash
   node create-storage-buckets.cjs
   ```

## ✅ **VERIFICATION**

### Check if Buckets Exist
```bash
# Run verification script
node simple-bucket-creation.cjs
```

**Expected Output:**
```
📁 product-files: ✅ Exists (private)
🖼️  product-images: ✅ Exists (public)
🎉 Storage buckets are ready!
```

### Test Upload Functionality
1. **Go to Seller Dashboard**: `http://localhost:5173/seller-dashboard`
2. **Try uploading a product image**
3. **Try uploading a digital product file**

## 🔧 **TROUBLESHOOTING**

### Issue: "new row violates row-level security policy"
**Solution**: Use Supabase Dashboard method instead of programmatic creation

### Issue: Buckets not visible in marketplace
**Solution**: 
1. Check bucket names are exactly: `product-files` and `product-images`
2. Verify public/private settings
3. Restart development server

### Issue: Upload failures
**Solution**:
1. Check file size limits (100MB for files, 10MB for images)
2. Verify file types are allowed
3. Ensure user is authenticated

## 📊 **CURRENT STATUS**

**Bucket Creation Status:**
- ✅ Scripts created and ready
- ✅ SQL commands prepared  
- ✅ Setup guide documented
- ⚠️  Manual creation required due to RLS policies

**Next Steps:**
1. **Manual Creation**: Use Supabase Dashboard to create buckets
2. **Verification**: Run test scripts to confirm setup
3. **Testing**: Upload test files through marketplace

## 🎯 **IMPACT ON MARKETPLACE**

**Before Bucket Setup:**
- ❌ File uploads fail
- ❌ Product images don't display
- ❌ Digital products can't be stored

**After Bucket Setup:**
- ✅ Sellers can upload product files
- ✅ Product thumbnails display correctly  
- ✅ Digital products are securely stored
- ✅ Buyers can download purchased items

## 🔗 **RELATED FILES**

- `/workspace/create-storage-buckets.cjs` - Main creation script
- `/workspace/simple-bucket-creation.cjs` - Simplified version
- `/workspace/create-buckets-sql.sql` - Direct SQL commands
- `/workspace/src/services/storeService.ts` - Upload service integration

---

## 🎉 **READY FOR MARKETPLACE**

Once buckets are created, the marketplace will have full functionality:
- ✅ Product file uploads
- ✅ Image thumbnail uploads  
- ✅ Secure digital product storage
- ✅ Download functionality for buyers

**Create the buckets using Method 1 (Supabase Dashboard) for immediate results!**