import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Shield, 
  Truck, 
  RotateCcw, 
  MessageCircle,
  User,
  Package,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { DigitalProduct } from '@/types/store';

interface ProductDetailModalProps {
  product: DigitalProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNow: (product: DigitalProduct) => void;
  onAddToWishlist: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onBuyNow,
  onAddToWishlist,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Mock additional images for demonstration
  const productImages = [
    product.thumbnail_url,
    product.thumbnail_url, // In real app, these would be different images
    product.thumbnail_url,
  ].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image Gallery */}
          <div className="relative bg-gray-50 p-8">
            {product.featured && (
              <Badge className="absolute top-4 left-4 bg-orange-600 text-white border-0 shadow-lg z-10">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            
            <div className="relative aspect-square rounded-lg overflow-hidden bg-white shadow-lg">
              {productImages.length > 0 ? (
                <img
                  src={productImages[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 flex items-center justify-center">
                  <Package className="h-32 w-32 text-orange-300" />
                </div>
              )}
              
              {productImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg rounded-full"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {productImages.length > 1 && (
              <div className="flex space-x-2 mt-4 justify-center">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-bold text-gray-900 leading-tight">
                {product.title}
              </DialogTitle>
            </DialogHeader>

            {/* Price and Rating */}
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {formatPrice(product.price)}
              </div>
              
              {product.rating > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium">{product.rating.toFixed(1)}</span>
                  <span className="text-gray-600">({product.rating_count} reviews)</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">{product.total_sales} sales</span>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-orange-100 text-orange-600">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">Creative Shop</h3>
                <p className="text-sm text-gray-600">Seller since 2020</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact seller
              </Button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 mb-6">
              <Button 
                size="lg" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-4"
                onClick={() => onBuyNow(product)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to cart - {formatPrice(product.price)}
              </Button>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => onAddToWishlist(product.id)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Add to favorites
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product Guarantees */}
            <div className="space-y-3 mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Purchase protection included</span>
              </div>
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Fast digital delivery</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">30-day return policy</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Additional Information Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4">
                <div className="space-y-2 text-sm">
                  <p><strong>Category:</strong> Digital Product</p>
                  <p><strong>File Type:</strong> Digital Download</p>
                  <p><strong>Created:</strong> {new Date(product.created_at).toLocaleDateString()}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-4">
                <div className="text-center py-8 text-gray-500">
                  <p>Reviews feature coming soon!</p>
                </div>
              </TabsContent>
              
              <TabsContent value="shipping" className="mt-4">
                <div className="space-y-2 text-sm">
                  <p><strong>Delivery:</strong> Instant digital download</p>
                  <p><strong>Processing time:</strong> Immediate after purchase</p>
                  <p><strong>File access:</strong> Available in your account</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};