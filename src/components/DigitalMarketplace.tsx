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
  Package,
  Sparkles,
  Gift,
  Palette,
  Home,
  Camera,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/useWishlist';
import { getProducts, getProductCategories, addToWishlist, removeFromWishlist } from '@/services/storeService';
import { ProductCheckout } from '@/components/ProductCheckout';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import type { 
  DigitalProduct, 
  ProductCategory, 
  ProductSearchFilters,
  MarketplaceProps 
} from '@/types/store';

// Etsy-style category data
const etsyCategories = [
  { id: 'handmade', name: 'Handmade', icon: Palette, color: 'bg-orange-100 text-orange-600' },
  { id: 'vintage', name: 'Vintage', icon: Calendar, color: 'bg-amber-100 text-amber-600' },
  { id: 'craft-supplies', name: 'Craft Supplies', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
  { id: 'gifts', name: 'Gifts', icon: Gift, color: 'bg-red-100 text-red-600' },
  { id: 'home-living', name: 'Home & Living', icon: Home, color: 'bg-green-100 text-green-600' },
  { id: 'art', name: 'Art & Collectibles', icon: Camera, color: 'bg-blue-100 text-blue-600' },
];

export const DigitalMarketplace: React.FC<MarketplaceProps> = ({ 
  initialFilters = {}, 
  communityId 
}) => {
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
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
  const [showProductDetail, setShowProductDetail] = useState(false);

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

  const handleWishlistToggle = (product: DigitalProduct) => {
    toggleWishlist(product);
  };

  const handleBuyNow = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handleProductClick = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleCheckoutClose = () => {
    setSelectedProduct(null);
    setShowCheckout(false);
  };

  const handleProductDetailClose = () => {
    setSelectedProduct(null);
    setShowProductDetail(false);
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

  // Etsy-style hero section
  const HeroSection = () => (
    <div className="relative bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 py-16 px-6 rounded-2xl mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="%23f97316" stroke-width="0.5" opacity="0.1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)" /%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Discover unique items, directly from 
          <span className="text-orange-600"> creative entrepreneurs</span>
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Find handmade, vintage, and creative goods made by talented sellers around the world
        </p>
        
        {/* Hero Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search for anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg border-2 border-orange-200 focus:border-orange-400 rounded-full shadow-lg"
            />
            <Button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-orange-600 hover:bg-orange-700"
              onClick={() => loadProducts(true)}
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Etsy-style category cards
  const CategorySection = () => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {etsyCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center mx-auto mb-3`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900">{category.name}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderProductCard = (product: DigitalProduct) => (
    <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden cursor-pointer">
      <div className="relative" onClick={() => handleProductClick(product)}>
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 flex items-center justify-center">
            <Package className="h-20 w-20 text-orange-300" />
          </div>
        )}
        
        {product.featured && (
          <Badge className="absolute top-3 left-3 bg-orange-600 text-white border-0 shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-lg rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle(product);
          }}
        >
          <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-red-500'}`} />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 mb-2" onClick={() => handleProductClick(product)}>
          {product.title}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 font-medium">Creative Shop</span>
        </div>
        
        {product.rating > 0 && (
          <div className="flex items-center space-x-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.rating_count})</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <Button 
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
            onClick={(e) => {
              e.stopPropagation();
              handleBuyNow(product);
            }}
          >
            Add to cart
          </Button>
        </div>
        
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200">
                {tag}
              </Badge>
            ))}
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
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>Digital Seller</span>
                  </div>
                  
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
      <div className="space-y-8">
        <HeroSection />
        <div className="animate-pulse">
          <div className="h-8 bg-orange-100 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-orange-50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Category Section */}
      <CategorySection />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
        </div>
        
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {etsyCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Most Recent</SelectItem>
            <SelectItem value="price">Price: Low to High</SelectItem>
            <SelectItem value="rating">Customer Review</SelectItem>
            <SelectItem value="total_sales">Bestselling</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Price Range */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            type="number"
            min="0"
            className="w-20"
          />
          <span className="text-gray-400">to</span>
          <Input
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            type="number"
            min="0"
            className="w-20"
          />
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <span className="text-sm text-gray-600">{totalCount} results</span>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="bg-orange-600 hover:bg-orange-700"
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

      {/* Products Section */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
          <Package className="h-24 w-24 mx-auto text-orange-300 mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Products Found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {searchQuery || selectedCategory !== 'all' 
              ? "We couldn't find any products matching your criteria. Try adjusting your search or filters." 
              : "Discover amazing handmade and vintage items. Be the first to explore our growing marketplace!"
            }
          </p>
          <Button 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setPriceRange({ min: '', max: '' });
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Browse All Products
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedCategory !== 'all' 
                ? `${etsyCategories.find(cat => cat.id === selectedCategory)?.name || 'Category'} Products`
                : 'All Products'
              }
            </h2>
            <p className="text-gray-600">
              {totalCount.toLocaleString()} unique items found
            </p>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {products.map(renderProductCard)}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map(renderProductList)}
            </div>
          )}
          
          {hasMore && (
            <div className="text-center mt-12">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 px-8 py-3"
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Show more products"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={showProductDetail}
          onClose={handleProductDetailClose}
          onBuyNow={(product) => {
            setShowProductDetail(false);
            handleBuyNow(product);
          }}
          onAddToWishlist={(productId) => {
            const product = products.find(p => p.id === productId);
            if (product) handleWishlistToggle(product);
          }}
        />
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