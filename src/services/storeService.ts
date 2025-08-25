import { supabase } from '@/integrations/supabase/client';
import type {
  DigitalProduct,
  ProductCategory,
  ProductOrder,
  ProductReview,
  SellerProfile,
  ProductWishlist,
  StoreNotification,
  CreateProductForm,
  UpdateProductForm,
  UpdateSellerProfileForm,
  ProductSearchFilters,
  ProductSearchResult,
  SellerAnalytics,
  MarketplaceStats,
  ApiResponse,
  FileUploadOptions,
  FileUploadProgress
} from '@/types/store';

// File Upload Service
export const uploadFile = async (
  file: File,
  options: FileUploadOptions
): Promise<string> => {
  const { bucket, folder = '', maxSize = 50 * 1024 * 1024, allowedTypes = [] } = options;

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }

  // Validate file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

// Product Categories Service
export const getProductCategories = async (): Promise<ApiResponse<ProductCategory[]>> => {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return { data: data || [], success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_CATEGORIES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch categories',
      },
    };
  }
};

// Products Service
export const getProducts = async (
  filters: ProductSearchFilters = {}
): Promise<ApiResponse<ProductSearchResult>> => {
  try {
    let query = supabase
      .from('digital_products')
      .select(`
        *,
        category:product_categories(*)
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }
    
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    
    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }
    
    if (filters.seller_id) {
      query = query.eq('seller_id', filters.seller_id);
    }
    
    if (filters.community_id) {
      query = query.eq('community_id', filters.community_id);
    }
    
    if (filters.featured_only) {
      query = query.eq('featured', true);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: {
        products: data || [],
        total_count: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit,
      },
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_PRODUCTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch products',
      },
    };
  }
};

export const getProduct = async (id: string): Promise<ApiResponse<DigitalProduct>> => {
  try {
    const { data, error } = await supabase
      .from('digital_products')
      .select(`
        *,
        category:product_categories(*),
        seller:seller_profiles(
          *,
          user:auth.users(
            id,
            email,
            user_metadata
          )
        ),
        reviews:product_reviews(
          *,
          buyer:auth.users(
            id,
            email,
            user_metadata
          )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product',
      },
    };
  }
};

export const createProduct = async (
  productData: CreateProductForm
): Promise<ApiResponse<DigitalProduct>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Upload files
    let thumbnailUrl = '';
    let previewUrls: string[] = [];
    let productFileUrl = '';

    if (productData.thumbnail_file) {
      thumbnailUrl = await uploadFile(productData.thumbnail_file, {
        bucket: 'product-images',
        folder: `thumbnails/${user.id}`,
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
    }

    if (productData.preview_files) {
      previewUrls = await Promise.all(
        productData.preview_files.map((file) =>
          uploadFile(file, {
            bucket: 'product-images',
            folder: `previews/${user.id}`,
            maxSize: 5 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          })
        )
      );
    }

    productFileUrl = await uploadFile(productData.product_file, {
      bucket: 'digital-products',
      folder: user.id,
      maxSize: 100 * 1024 * 1024, // 100MB for product files
    });

    const { data, error } = await supabase
      .from('digital_products')
      .insert({
        seller_id: user.id,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        category_id: productData.category_id,
        tags: productData.tags,
        thumbnail_url: thumbnailUrl,
        preview_images: previewUrls,
        file_url: productFileUrl,
        file_size: productData.product_file.size,
        file_type: productData.product_file.type,
        download_limit: productData.download_limit,
        community_id: productData.community_id,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create product',
      },
    };
  }
};

export const updateProduct = async (
  id: string,
  productData: UpdateProductForm
): Promise<ApiResponse<DigitalProduct>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: Partial<DigitalProduct> = {};

    // Handle basic updates
    if (productData.title !== undefined) updateData.title = productData.title;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price !== undefined) updateData.price = productData.price;
    if (productData.category_id !== undefined) updateData.category_id = productData.category_id;
    if (productData.tags !== undefined) updateData.tags = productData.tags;
    if (productData.download_limit !== undefined) updateData.download_limit = productData.download_limit;
    if (productData.is_active !== undefined) updateData.is_active = productData.is_active;
    if (productData.featured !== undefined) updateData.featured = productData.featured;

    // Handle file uploads
    if (productData.thumbnail_file) {
      updateData.thumbnail_url = await uploadFile(productData.thumbnail_file, {
        bucket: 'product-images',
        folder: `thumbnails/${user.id}`,
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
    }

    if (productData.preview_files) {
      updateData.preview_images = await Promise.all(
        productData.preview_files.map((file) =>
          uploadFile(file, {
            bucket: 'product-images',
            folder: `previews/${user.id}`,
            maxSize: 5 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          })
        )
      );
    }

    if (productData.product_file) {
      updateData.file_url = await uploadFile(productData.product_file, {
        bucket: 'digital-products',
        folder: user.id,
        maxSize: 100 * 1024 * 1024,
      });
      updateData.file_size = productData.product_file.size;
      updateData.file_type = productData.product_file.type;
    }

    const { data, error } = await supabase
      .from('digital_products')
      .update(updateData)
      .eq('id', id)
      .eq('seller_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update product',
      },
    };
  }
};

export const deleteProduct = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('digital_products')
      .delete()
      .eq('id', id)
      .eq('seller_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'DELETE_PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete product',
      },
    };
  }
};

// Orders Service
export const createOrder = async (
  productId: string,
  quantity: number = 1
): Promise<ApiResponse<ProductOrder>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) throw new Error('Product not found');

    const totalAmount = product.price * quantity;

    const { data, error } = await supabase
      .from('product_orders')
      .insert({
        buyer_id: user.id,
        seller_id: product.seller_id,
        product_id: productId,
        quantity,
        unit_price: product.price,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_ORDER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create order',
      },
    };
  }
};

export const getOrders = async (
  userId?: string,
  status?: ProductOrder['status']
): Promise<ApiResponse<ProductOrder[]>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('product_orders')
      .select(`
        *,
        product:digital_products(*),
        buyer:auth.users(id, email, user_metadata),
        seller:seller_profiles(
          *,
          user:auth.users(id, email, user_metadata)
        )
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (userId) {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_ORDERS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch orders',
      },
    };
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: ProductOrder['status']
): Promise<ApiResponse<ProductOrder>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('product_orders')
      .update({ status })
      .eq('id', orderId)
      .eq('seller_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_ORDER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update order',
      },
    };
  }
};

// Reviews Service
export const createReview = async (
  productId: string,
  rating: number,
  reviewText?: string
): Promise<ApiResponse<ProductReview>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        buyer_id: user.id,
        rating,
        review_text: reviewText,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_REVIEW_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create review',
      },
    };
  }
};

// Seller Profile Service
export const getSellerProfile = async (userId?: string): Promise<ApiResponse<SellerProfile>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) throw new Error('User ID required');

    const { data, error } = await supabase
      .from('seller_profiles')
      .select(`
        *,
        user:auth.users(id, email, user_metadata),
        products:digital_products(*)
      `)
      .eq('user_id', targetUserId)
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_SELLER_PROFILE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch seller profile',
      },
    };
  }
};

export const createOrUpdateSellerProfile = async (
  profileData: UpdateSellerProfileForm
): Promise<ApiResponse<SellerProfile>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: Partial<SellerProfile> = {};

    if (profileData.store_name !== undefined) updateData.store_name = profileData.store_name;
    if (profileData.store_description !== undefined) updateData.store_description = profileData.store_description;
    if (profileData.payment_details !== undefined) updateData.payment_details = profileData.payment_details;

    if (profileData.store_banner_file) {
      updateData.store_banner_url = await uploadFile(profileData.store_banner_file, {
        bucket: 'product-images',
        folder: `banners/${user.id}`,
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
    }

    const { data, error } = await supabase
      .from('seller_profiles')
      .upsert({
        user_id: user.id,
        ...updateData,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_SELLER_PROFILE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update seller profile',
      },
    };
  }
};

// Wishlist Service
export const addToWishlist = async (productId: string): Promise<ApiResponse<ProductWishlist>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('product_wishlists')
      .insert({
        user_id: user.id,
        product_id: productId,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ADD_TO_WISHLIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add to wishlist',
      },
    };
  }
};

export const removeFromWishlist = async (productId: string): Promise<ApiResponse<void>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('product_wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'REMOVE_FROM_WISHLIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove from wishlist',
      },
    };
  }
};

export const getWishlist = async (): Promise<ApiResponse<ProductWishlist[]>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('product_wishlists')
      .select(`
        *,
        product:digital_products(
          *,
          category:product_categories(*),
          seller:seller_profiles(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_WISHLIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch wishlist',
      },
    };
  }
};

// Analytics Service
export const getSellerAnalytics = async (): Promise<ApiResponse<SellerAnalytics>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get seller profile for basic stats
    const { data: sellerProfile } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get total products count
    const { count: totalProducts } = await supabase
      .from('digital_products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id);

    // Get average rating across all products
    const { data: ratingData } = await supabase
      .from('digital_products')
      .select('rating, rating_count')
      .eq('seller_id', user.id)
      .gt('rating_count', 0);

    const averageRating = ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, product) => sum + (product.rating * product.rating_count), 0) /
        ratingData.reduce((sum, product) => sum + product.rating_count, 0)
      : 0;

    // Get monthly earnings for the last 12 months
    const { data: monthlyData } = await supabase
      .from('product_orders')
      .select('total_amount, created_at')
      .eq('seller_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString())
      .order('created_at', { ascending: false });

    // Process monthly earnings
    const monthlyEarnings = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthData = monthlyData?.filter(order => 
        order.created_at.slice(0, 7) === monthKey
      ) || [];
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        earnings: monthData.reduce((sum, order) => sum + Number(order.total_amount), 0),
        sales: monthData.length
      };
    }).reverse();

    // Get top products by sales
    const { data: topProductsData } = await supabase
      .from('digital_products')
      .select(`
        *,
        orders:product_orders!inner(total_amount)
      `)
      .eq('seller_id', user.id)
      .eq('orders.status', 'completed')
      .order('total_sales', { ascending: false })
      .limit(5);

    const topProducts = topProductsData?.map(product => ({
      product,
      sales: product.total_sales,
      earnings: product.orders?.reduce((sum: number, order: any) => sum + Number(order.total_amount), 0) || 0
    })) || [];

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('product_orders')
      .select(`
        *,
        product:digital_products(*),
        buyer:auth.users(id, email, user_metadata)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const analytics: SellerAnalytics = {
      total_earnings: sellerProfile?.total_earnings || 0,
      total_sales: sellerProfile?.total_sales || 0,
      total_products: totalProducts || 0,
      average_rating: Number(averageRating.toFixed(2)) || 0,
      monthly_earnings: monthlyEarnings,
      top_products: topProducts,
      recent_orders: recentOrders || [],
    };

    return { data: analytics, success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
    };
  }
};

// Notifications Service
export const getStoreNotifications = async (): Promise<ApiResponse<StoreNotification[]>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('store_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { data: data || [], success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_NOTIFICATIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch notifications',
      },
    };
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<ApiResponse<void>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('store_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'MARK_NOTIFICATION_READ_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark notification as read',
      },
    };
  }
};