// Digital Store Types
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface DigitalProduct {
  id: string;
  seller_id: string;
  community_id?: string;
  title: string;
  description: string;
  price: number;
  category_id?: string;
  tags: string[];
  thumbnail_url?: string;
  preview_images: string[];
  file_url: string;
  file_size?: number;
  file_type?: string;
  download_limit?: number;
  is_active: boolean;
  featured: boolean;
  total_sales: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  category?: ProductCategory;
  seller?: SellerProfile;
  reviews?: ProductReview[];
}

export interface ProductReview {
  id: string;
  product_id: string;
  buyer_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  buyer?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface ProductOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_intent_id?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  product?: DigitalProduct;
  buyer?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  seller?: SellerProfile;
}

export interface ProductDownload {
  id: string;
  order_id: string;
  buyer_id: string;
  product_id: string;
  download_count: number;
  last_downloaded_at?: string;
  created_at: string;
  
  // Relations
  order?: ProductOrder;
  product?: DigitalProduct;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  store_name?: string;
  store_description?: string;
  store_banner_url?: string;
  commission_rate: number;
  total_earnings: number;
  total_sales: number;
  is_verified: boolean;
  payment_details?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  products?: DigitalProduct[];
}

export interface ProductWishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  
  // Relations
  product?: DigitalProduct;
}

export interface StoreNotification {
  id: string;
  user_id: string;
  type: 'sale' | 'purchase' | 'review' | 'download';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// Form types for creating/updating products
export interface CreateProductForm {
  title: string;
  description: string;
  price: number;
  category_id?: string;
  tags: string[];
  thumbnail_file?: File;
  preview_files?: File[];
  product_file: File;
  download_limit?: number;
  community_id?: string;
}

export interface UpdateProductForm {
  title?: string;
  description?: string;
  price?: number;
  category_id?: string;
  tags?: string[];
  thumbnail_file?: File;
  preview_files?: File[];
  product_file?: File;
  download_limit?: number;
  is_active?: boolean;
  featured?: boolean;
}

// Seller profile form
export interface UpdateSellerProfileForm {
  store_name?: string;
  store_description?: string;
  store_banner_file?: File;
  payment_details?: Record<string, any>;
}

// Search and filter types
export interface ProductSearchFilters {
  query?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  seller_id?: string;
  community_id?: string;
  featured_only?: boolean;
  sort_by?: 'created_at' | 'price' | 'rating' | 'total_sales';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: DigitalProduct[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Analytics types
export interface SellerAnalytics {
  total_earnings: number;
  total_sales: number;
  total_products: number;
  average_rating: number;
  monthly_earnings: Array<{
    month: string;
    earnings: number;
    sales: number;
  }>;
  top_products: Array<{
    product: DigitalProduct;
    sales: number;
    earnings: number;
  }>;
  recent_orders: ProductOrder[];
}

export interface MarketplaceStats {
  total_products: number;
  total_sellers: number;
  total_sales: number;
  featured_products: DigitalProduct[];
  top_categories: Array<{
    category: ProductCategory;
    product_count: number;
  }>;
  recent_products: DigitalProduct[];
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
}

export interface CheckoutSession {
  product_id: string;
  quantity: number;
  total_amount: number;
  payment_intent?: PaymentIntent;
}

// Error types
export interface StoreError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: StoreError;
  success: boolean;
}

// Hook types
export interface UseProductsOptions {
  filters?: ProductSearchFilters;
  enabled?: boolean;
}

export interface UseSellerProductsOptions {
  seller_id?: string;
  enabled?: boolean;
}

export interface UseOrdersOptions {
  user_id?: string;
  status?: ProductOrder['status'];
  enabled?: boolean;
}

// Component props types
export interface ProductCardProps {
  product: DigitalProduct;
  onAddToWishlist?: (productId: string) => void;
  onRemoveFromWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
  showSellerInfo?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface ProductListProps {
  products: DigitalProduct[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
}

export interface SellerDashboardProps {
  seller: SellerProfile;
  analytics: SellerAnalytics;
}

export interface MarketplaceProps {
  initialFilters?: ProductSearchFilters;
  communityId?: string;
}

// File upload types
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export interface FileUploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
  onProgress?: (progress: FileUploadProgress) => void;
}

// Store configuration
export interface StoreConfig {
  commission_rate: number;
  max_file_size: number;
  allowed_file_types: string[];
  payment_methods: string[];
  currency: string;
  min_price: number;
  max_price: number;
}