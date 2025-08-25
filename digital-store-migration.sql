-- Digital Product Marketplace Schema
-- This migration creates all tables needed for the digital product store

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories for products
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Digital products table
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  tags TEXT[], -- Array of tags for better searchability
  thumbnail_url TEXT,
  preview_images TEXT[], -- Array of preview image URLs
  file_url TEXT NOT NULL, -- Main digital product file
  file_size BIGINT, -- File size in bytes
  file_type VARCHAR(100), -- MIME type
  download_limit INTEGER DEFAULT NULL, -- NULL means unlimited downloads
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product reviews and ratings
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, buyer_id) -- One review per buyer per product
);

-- Orders table
CREATE TABLE IF NOT EXISTS product_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_intent_id VARCHAR(255), -- For Stripe integration
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Download tracking for purchased products
CREATE TABLE IF NOT EXISTS product_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES product_orders(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE NOT NULL,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller profiles for additional store information
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  store_name VARCHAR(255),
  store_description TEXT,
  store_banner_url TEXT,
  commission_rate DECIMAL(5,4) DEFAULT 0.05, -- Platform commission (5% default)
  total_earnings DECIMAL(12,2) DEFAULT 0.0,
  total_sales INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  payment_details JSONB, -- Store payment information (encrypted)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist functionality
CREATE TABLE IF NOT EXISTS product_wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Notifications for store activities
CREATE TABLE IF NOT EXISTS store_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'sale', 'purchase', 'review', 'download'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional notification data
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default product categories
INSERT INTO product_categories (name, description, icon) VALUES
  ('E-books', 'Digital books and publications', 'book'),
  ('Templates', 'Design templates and layouts', 'layout-template'),
  ('Tutorials', 'Educational content and courses', 'graduation-cap'),
  ('Audio', 'Music, podcasts, and audio files', 'music'),
  ('Video', 'Video content and courses', 'video'),
  ('Software', 'Applications and tools', 'code'),
  ('Graphics', 'Images, icons, and graphics', 'image'),
  ('Documents', 'PDFs and document templates', 'file-text');

-- Create storage bucket for product files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('digital-products', 'digital-products', false),
  ('product-images', 'product-images', true);

-- RLS Policies

-- Digital Products policies
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON digital_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage their own products" ON digital_products
  FOR ALL USING (auth.uid() = seller_id);

-- Product Reviews policies
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews for purchased products" ON product_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id AND
    EXISTS (
      SELECT 1 FROM product_orders 
      WHERE buyer_id = auth.uid() 
      AND product_id = product_reviews.product_id 
      AND status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = buyer_id);

-- Orders policies
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON product_orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders" ON product_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update order status" ON product_orders
  FOR UPDATE USING (auth.uid() = seller_id);

-- Downloads policies
ALTER TABLE product_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own downloads" ON product_downloads
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "System can manage downloads" ON product_downloads
  FOR ALL USING (true); -- This will be restricted by application logic

-- Seller Profiles policies
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seller profiles" ON seller_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own seller profile" ON seller_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Wishlist policies
ALTER TABLE product_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist" ON product_wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
ALTER TABLE store_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON store_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON store_notifications
  FOR INSERT WITH CHECK (true); -- Application will handle this

CREATE POLICY "Users can update their own notifications" ON store_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies for product files
CREATE POLICY "Sellers can upload product files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'digital-products' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Sellers can view their own product files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'digital-products' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Buyers can download purchased products" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'digital-products' AND
    EXISTS (
      SELECT 1 FROM product_orders po
      JOIN digital_products dp ON dp.id = po.product_id
      WHERE po.buyer_id = auth.uid()
      AND po.status = 'completed'
      AND dp.file_url LIKE '%' || name || '%'
    )
  );

-- Product images policies
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

-- Functions and triggers

-- Function to update product rating when review is added/updated
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE digital_products 
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating product ratings
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Function to update seller stats when order is completed
CREATE OR REPLACE FUNCTION update_seller_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update seller profile stats
    UPDATE seller_profiles 
    SET 
      total_earnings = total_earnings + NEW.total_amount * (1 - commission_rate),
      total_sales = total_sales + 1
    WHERE user_id = NEW.seller_id;
    
    -- Update product sales count
    UPDATE digital_products 
    SET total_sales = total_sales + 1
    WHERE id = NEW.product_id;
    
    -- Create notification for seller
    INSERT INTO store_notifications (user_id, type, title, message, data)
    VALUES (
      NEW.seller_id,
      'sale',
      'New Sale!',
      'You have a new sale for your product.',
      jsonb_build_object('order_id', NEW.id, 'amount', NEW.total_amount)
    );
    
    -- Create notification for buyer
    INSERT INTO store_notifications (user_id, type, title, message, data)
    VALUES (
      NEW.buyer_id,
      'purchase',
      'Purchase Complete!',
      'Your purchase is ready for download.',
      jsonb_build_object('order_id', NEW.id, 'product_id', NEW.product_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating seller stats
CREATE TRIGGER update_seller_stats_trigger
  AFTER UPDATE ON product_orders
  FOR EACH ROW EXECUTE FUNCTION update_seller_stats();

-- Create indexes for better performance
CREATE INDEX idx_digital_products_seller_id ON digital_products(seller_id);
CREATE INDEX idx_digital_products_community_id ON digital_products(community_id);
CREATE INDEX idx_digital_products_category_id ON digital_products(category_id);
CREATE INDEX idx_digital_products_active ON digital_products(is_active);
CREATE INDEX idx_digital_products_featured ON digital_products(featured);
CREATE INDEX idx_digital_products_created_at ON digital_products(created_at DESC);
CREATE INDEX idx_product_orders_buyer_id ON product_orders(buyer_id);
CREATE INDEX idx_product_orders_seller_id ON product_orders(seller_id);
CREATE INDEX idx_product_orders_status ON product_orders(status);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_store_notifications_user_id ON store_notifications(user_id);
CREATE INDEX idx_store_notifications_is_read ON store_notifications(is_read);