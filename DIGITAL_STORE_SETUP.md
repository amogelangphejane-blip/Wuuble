# Digital Store Setup Guide

This guide will help you set up the digital marketplace feature in your community-based app, allowing creators to sell their digital products directly through the platform.

## 🎯 Overview

The Digital Store feature includes:

- **Product Management**: Sellers can create, edit, and manage digital products
- **Marketplace**: Browse and search products with advanced filtering
- **Secure Checkout**: Complete payment processing with order management
- **File Storage**: Secure upload and delivery of digital products
- **Reviews & Ratings**: Customer feedback system
- **Seller Dashboard**: Analytics and product management tools
- **Buyer Library**: Downloaded products and purchase history
- **Wishlist**: Save products for later purchase
- **Notifications**: Real-time updates for sales and purchases

## 🚀 Quick Setup

### 1. Prerequisites

Make sure you have:
- Node.js (v16 or higher)
- A Supabase project set up
- Environment variables configured

### 2. Install Dependencies

The required dependencies are already included in your `package.json`. If you need to install them separately:

```bash
npm install @supabase/supabase-js
```

### 3. Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Setup Script

Execute the setup script to create all necessary database tables and storage buckets:

```bash
node setup-digital-store.js
```

This will:
- Create all required database tables
- Set up Row Level Security (RLS) policies
- Create storage buckets for product files and images
- Insert default product categories
- Verify the installation

### 5. Start Development Server

```bash
npm run dev
```

## 📊 Database Schema

The setup creates the following tables:

### Core Tables

- **`product_categories`**: Product categorization (E-books, Templates, etc.)
- **`digital_products`**: Main product information and metadata
- **`seller_profiles`**: Extended seller information and store settings
- **`product_orders`**: Purchase orders and transaction records
- **`product_downloads`**: Download tracking and limits
- **`product_reviews`**: Customer reviews and ratings
- **`product_wishlists`**: Saved products for later purchase
- **`store_notifications`**: Activity notifications for users

### Storage Buckets

- **`digital-products`**: Private bucket for product files
- **`product-images`**: Public bucket for thumbnails and previews

## 🛠️ Features & Usage

### For Sellers

#### Accessing the Seller Dashboard

1. Log into your account
2. Click your profile avatar in the header
3. Select "Seller Dashboard" from the dropdown menu
4. Or navigate to `/seller-dashboard`

#### Creating Products

1. In the Seller Dashboard, click "Add Product"
2. Fill in product details:
   - Title and description
   - Price and category
   - Tags for searchability
   - Upload product file (required)
   - Upload thumbnail image (optional)
   - Set download limits (optional)

#### Managing Products

- View all your products in the dashboard
- Edit product information and files
- Toggle product active/inactive status
- View sales analytics and earnings
- Manage orders and customer communications

### For Buyers

#### Browsing the Marketplace

1. Navigate to any community
2. Click the "Store" tab
3. Browse products or use search/filters:
   - Search by title/description
   - Filter by category
   - Filter by price range
   - Sort by newest, price, rating, or sales

#### Making Purchases

1. Click "Buy Now" on any product
2. Review purchase details
3. Enter payment information (simulated)
4. Complete the purchase

#### Accessing Purchased Products

1. Click your profile avatar
2. Select "My Library"
3. View all purchases and download files
4. Leave reviews for purchased products

### For Community Administrators

Products can be:
- Community-specific (only visible in that community's store)
- Global (visible across all communities)
- Set when creating/editing products

## 🔧 Configuration Options

### Product Categories

Default categories are created automatically:
- E-books
- Templates  
- Tutorials
- Audio
- Video
- Software
- Graphics
- Documents

You can add more categories directly in the database or through the admin interface.

### File Upload Limits

Current limits (configurable in `storeService.ts`):
- Product files: 100MB max
- Images: 5MB max
- Supported image types: JPEG, PNG, WebP

### Payment Processing

The current implementation includes:
- Simulated payment processing (90% success rate)
- Order status tracking
- Basic payment form validation

**For Production**: Integrate with real payment providers like:
- Stripe
- PayPal
- Square
- Other payment gateways

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only manage their own products and orders
- Buyers can only access their purchased products
- Sellers can only view their own sales data
- Public data (product listings) is appropriately accessible

### File Access Control

- Product files are stored in private buckets
- Only buyers who completed purchases can download files
- Images are stored in public buckets for performance
- Download tracking prevents unauthorized access

## 🎨 UI Components

### Main Components

- **`DigitalMarketplace`**: Product browsing and search interface
- **`SellerDashboard`**: Seller management and analytics
- **`ProductCheckout`**: Purchase flow and payment processing
- **`BuyerLibrary`**: Purchase history and downloads
- **`StoreNotifications`**: Activity notifications

### Integration Points

- Community detail pages include a "Store" tab
- User profile menu includes store-related links
- Header navigation includes marketplace access

## 🚨 Troubleshooting

### Common Issues

#### Setup Script Fails
- Verify environment variables are correct
- Check Supabase project permissions
- Ensure service role key has sufficient privileges

#### File Upload Errors
- Check storage bucket permissions
- Verify file size limits
- Confirm file type restrictions

#### RLS Policy Issues
- Review user authentication status
- Check policy definitions in migration file
- Verify user roles and permissions

### Database Issues

If tables aren't created properly:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%product%';

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE '%product%';
```

### Storage Issues

If file uploads fail:

```javascript
// Check bucket existence
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Available buckets:', buckets);

// Test upload permissions
const { data, error } = await supabase.storage
  .from('digital-products')
  .upload('test.txt', new Blob(['test']));
```

## 🔄 Updates and Maintenance

### Adding New Features

The modular architecture makes it easy to extend:

1. **New Product Types**: Add categories and validation rules
2. **Payment Methods**: Integrate additional payment providers  
3. **Analytics**: Extend seller dashboard with more metrics
4. **Social Features**: Add product sharing and recommendations

### Database Migrations

For schema changes, create new migration files following the naming convention:
```
YYYYMMDD000000_description.sql
```

### Monitoring

Key metrics to monitor:
- Product upload success rates
- Payment completion rates
- File download performance
- User engagement with store features

## 📈 Performance Optimization

### Recommendations

1. **Image Optimization**: Use WebP format and appropriate sizing
2. **Caching**: Implement CDN for product images
3. **Pagination**: Products are paginated by default (20 per page)
4. **Indexing**: Database indexes are created for common queries
5. **File Compression**: Compress large product files when possible

### Scaling Considerations

- Consider moving file storage to dedicated CDN
- Implement Redis caching for frequently accessed data
- Use read replicas for analytics queries
- Monitor and optimize database query performance

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the database schema and RLS policies
3. Test with the setup script in a clean environment
4. Check Supabase logs for detailed error messages

## 🎉 Success!

Once setup is complete, you'll have a fully functional digital marketplace integrated into your community app. Users can:

- ✅ Sell digital products with full management tools
- ✅ Browse and purchase products securely  
- ✅ Download and manage their digital library
- ✅ Leave reviews and build seller reputation
- ✅ Receive notifications for all store activities

The marketplace is now ready for your creators to start selling their digital products!