import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Download, 
  ShoppingCart, 
  Heart,
  Verified,
  DollarSign,
  Tag,
  User,
  Calendar,
  TrendingUp,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProducts, getProductCategories, addToWishlist, removeFromWishlist } from '@/services/storeService';
import { ProductCheckout } from '@/components/ProductCheckout';
import type { 
  DigitalProduct, 
  ProductCategory, 
  ProductSearchFilters,
  MarketplaceProps 
} from '@/types/store';

export const DigitalMarketplace: React.FC<MarketplaceProps> = ({ 
  initialFilters = {}, 
  communityId 
}) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialFilters.query || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category_id || 'all');
  const [sortBy, setSortBy] = useState(initialFilters.sort_by || 'created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState({
    min: initialFilters.min_price || '',
    max: initialFilters.max_price || ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load products when filters change
  useEffect(() => {
    loadProducts(true);
  }, [searchQuery, selectedCategory, sortBy, priceRange, communityId]);

  const loadCategories = async () => {
    const result = await getProductCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    }
  };

  const loadProducts = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }

    const filters: ProductSearchFilters = {
      query: searchQuery || undefined,
      category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
      sort_by: sortBy as any,
      sort_order: 'desc',
      page: reset ? 1 : currentPage,
      limit: 20,
      min_price: priceRange.min ? parseFloat(priceRange.min) : undefined,
      max_price: priceRange.max ? parseFloat(priceRange.max) : undefined,
      community_id: communityId,
    };

    try {
      const result = await getProducts(filters);
      
      if (result.success && result.data) {
        if (reset) {
          setProducts(result.data.products);
        } else {
          setProducts(prev => [...prev, ...result.data!.products]);
        }
        setHasMore(result.data.has_more);
        setTotalCount(result.data.total_count);
        setCurrentPage(result.data.page + 1);
      } else {
        // Handle database not set up or connection issues
        if (result.error?.message?.includes('relation') || result.error?.message?.includes('does not exist')) {
          toast({
            title: "Marketplace Setup Required",
            description: "The marketplace database needs to be set up. Please run the setup script or contact your administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: result.error?.message || "Failed to load products",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to the Marketplace. Please check your connection and try again.",
        variant: "destructive",
      });
      console.error('Marketplace error:', error);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadProducts(false);
    }
  };

  const handleWishlistToggle = async (productId: string, isInWishlist: boolean) => {
    try {
      if (isInWishlist) {
        const result = await removeFromWishlist(productId);
        if (result.success) {
          toast({
            title: "Removed from wishlist",
            description: "Product removed from your wishlist",
          });
        }
      } else {
        const result = await addToWishlist(productId);
        if (result.success) {
          toast({
            title: "Added to wishlist",
            description: "Product added to your wishlist",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handleCheckoutClose = () => {
    setSelectedProduct(null);
    setShowCheckout(false);
  };

  const handlePurchaseSuccess = () => {
    // Refresh products or show success message
    toast({
      title: "Purchase Successful!",
      description: "Your product is ready for download.",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const renderProductCard = (product: DigitalProduct) => (
    <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {product.featured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
            Featured
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleWishlistToggle(product.id, false)} // TODO: Track wishlist state
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{product.title}</h3>
          <span className="text-lg font-bold text-primary ml-2">
            {formatPrice(product.price)}
          </span>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {product.seller?.user && (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={product.seller.user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {product.seller.user.user_metadata?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {product.seller.store_name || product.seller.user.user_metadata?.full_name}
                </span>
                {product.seller.is_verified && (
                  <Verified className="h-4 w-4 text-blue-500" />
                )}
              </>
            )}
          </div>
          
          {product.rating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.rating_count})</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>{product.total_sales} sales</span>
          </div>
          
          <Button size="sm" className="ml-auto" onClick={() => handleBuyNow(product)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
        </div>
        
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{product.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderProductList = (product: DigitalProduct) => (
    <Card key={product.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {product.seller?.user && (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={product.seller.user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {product.seller.user.user_metadata?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{product.seller.store_name || product.seller.user.user_metadata?.full_name}</span>
                    </div>
                  )}
                  
                  {product.rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating.toFixed(1)} ({product.rating_count})</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{product.total_sales} sales</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary mb-2">
                  {formatPrice(product.price)}
                </div>
                <Button size="sm" onClick={() => handleBuyNow(product)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            {totalCount} products available {communityId ? 'in this community' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="total_sales">Best Selling</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Price Range */}
            <div className="flex space-x-2">
              <Input
                placeholder="Min $"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                type="number"
                min="0"
              />
              <Input
                placeholder="Max $"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                type="number"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' 
                ? "Try adjusting your search or filters" 
                : "Be the first to add products to this marketplace!"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(renderProductCard)}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map(renderProductList)}
            </div>
          )}
          
          {hasMore && (
            <div className="text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? "Loading..." : "Load More Products"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Checkout Dialog */}
      {selectedProduct && (
        <ProductCheckout
          product={selectedProduct}
          isOpen={showCheckout}
          onClose={handleCheckoutClose}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};