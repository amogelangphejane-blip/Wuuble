import React, { useState } from 'react';
import { ModernHeader } from '@/components/ModernHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, 
  Package, 
  Star, 
  ShoppingCart, 
  Trash2,
  Filter,
  Calendar,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { ShoppingCartComponent, useShoppingCart } from '@/components/ShoppingCart';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import type { DigitalProduct } from '@/types/store';

const Favorites: React.FC = () => {
  const { 
    wishlistItems, 
    loading, 
    removeFromWishlist, 
    clearWishlist,
    sortWishlistByDate 
  } = useWishlist();
  const { addToCart } = useShoppingCart();
  
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleProductClick = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleBuyNow = (product: DigitalProduct) => {
    addToCart(product);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    switch (value) {
      case 'newest':
        sortWishlistByDate(false);
        break;
      case 'oldest':
        sortWishlistByDate(true);
        break;
      // Add more sorting options as needed
    }
  };

  const filteredItems = wishlistItems.filter(item => {
    if (filterCategory === 'all') return true;
    return item.product.category_id === filterCategory;
  });

  const categories = Array.from(new Set(wishlistItems.map(item => item.product.category_id)))
    .filter(Boolean);

  const renderProductCard = (item: any) => (
    <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden cursor-pointer">
      <div className="relative" onClick={() => handleProductClick(item.product)}>
        {item.product.thumbnail_url ? (
          <img
            src={item.product.thumbnail_url}
            alt={item.product.title}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 flex items-center justify-center">
            <Package className="h-20 w-20 text-orange-300" />
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-lg rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            removeFromWishlist(item.product.id);
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>

        <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 shadow-lg">
          <Heart className="h-3 w-3 mr-1 fill-current" />
          Favorite
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 mb-2" onClick={() => handleProductClick(item.product)}>
          {item.product.title}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-sm text-gray-600 font-medium">Creative Shop</span>
        </div>
        
        {item.product.rating > 0 && (
          <div className="flex items-center space-x-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < Math.floor(item.product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({item.product.rating_count})</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(item.product.price)}
          </span>
          <Button 
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
            onClick={(e) => {
              e.stopPropagation();
              handleBuyNow(item.product);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to cart
          </Button>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          Added {new Date(item.addedAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-pink-50/20 to-rose-50/30">
        <ModernHeader onCartClick={() => setShowCart(true)} />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-red-100 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-red-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-pink-50/20 to-rose-50/30">
      <ModernHeader onCartClick={() => setShowCart(true)} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Heart className="h-8 w-8 text-red-600 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Your Favorites</h1>
              <p className="text-gray-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} you love
              </p>
            </div>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl">
            <Heart className="h-24 w-24 mx-auto text-red-300 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No favorites yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Start exploring our marketplace and add items to your favorites by clicking the heart icon.
            </p>
            <Button 
              onClick={() => window.location.href = '/marketplace'}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            >
              Explore Marketplace
            </Button>
          </div>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 p-6 bg-white rounded-lg shadow-sm border mb-8">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter & Sort:</span>
              </div>
              
              {/* Category Filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((categoryId) => (
                    <SelectItem key={categoryId} value={categoryId}>
                      Category {categoryId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recently Added</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredItems.length} items</span>
                
                {wishlistItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearWishlist}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}

                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="bg-red-600 hover:bg-red-700"
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

            {/* Products Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredItems.map(renderProductCard)}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map(item => (
                  <Card key={item.id} className="mb-4">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        {/* Product image and details in list view */}
                        {/* Simplified for now */}
                        {renderProductCard(item)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={showProductDetail}
          onClose={() => {
            setSelectedProduct(null);
            setShowProductDetail(false);
          }}
          onBuyNow={(product) => {
            setShowProductDetail(false);
            handleBuyNow(product);
          }}
          onAddToWishlist={(productId) => {
            // Already in wishlist, this could remove it
            removeFromWishlist(productId);
          }}
        />
      )}

      {/* Shopping Cart */}
      <ShoppingCartComponent
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={(items) => {
          console.log('Checkout items:', items);
        }}
      />
    </div>
  );
};

export default Favorites;