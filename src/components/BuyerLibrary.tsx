import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Star, 
  Package,
  Calendar,
  FileText,
  Heart,
  MessageSquare,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  getOrders, 
  getWishlist, 
  createReview, 
  removeFromWishlist 
} from '@/services/storeService';
import type { 
  ProductOrder, 
  ProductWishlist, 
  ProductReview 
} from '@/types/store';

export const BuyerLibrary: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState<ProductOrder[]>([]);
  const [wishlist, setWishlist] = useState<ProductWishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review_text: ''
  });

  useEffect(() => {
    if (user) {
      loadLibraryData();
    }
  }, [user]);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const [ordersResult, wishlistResult] = await Promise.all([
        getOrders(),
        getWishlist()
      ]);

      if (ordersResult.success && ordersResult.data) {
        setPurchases(ordersResult.data);
      }

      if (wishlistResult.success && wishlistResult.data) {
        setWishlist(wishlistResult.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load library data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (order: ProductOrder) => {
    if (!order.product?.file_url) {
      toast({
        title: "Error",
        description: "Download link not available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = order.product.file_url;
      link.download = order.product.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading ${order.product.title}...`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the file",
        variant: "destructive",
      });
    }
  };

  const handleWriteReview = (order: ProductOrder) => {
    setSelectedOrder(order);
    setReviewForm({ rating: 5, review_text: '' });
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedOrder?.product) return;

    try {
      const result = await createReview(
        selectedOrder.product.id,
        reviewForm.rating,
        reviewForm.review_text
      );

      if (result.success) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!",
        });
        setShowReviewDialog(false);
        loadLibraryData(); // Refresh to show updated review status
      } else {
        throw new Error(result.error?.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const result = await removeFromWishlist(productId);
      if (result.success) {
        toast({
          title: "Removed from Wishlist",
          description: "Product removed from your wishlist",
        });
        loadLibraryData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPurchases = purchases.filter(order => {
    const matchesSearch = !searchQuery || 
      order.product?.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWishlist = wishlist.filter(item => 
    !searchQuery || 
    item.product?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
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
          <h1 className="text-3xl font-bold">My Library</h1>
          <p className="text-muted-foreground">
            Your purchased products and wishlist
          </p>
        </div>
        <Button onClick={loadLibraryData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="purchases">
            My Purchases ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            Wishlist ({wishlist.length})
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {activeTab === 'purchases' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Orders</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          )}
        </div>

        <TabsContent value="purchases" className="space-y-6">
          {filteredPurchases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Purchases Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "No purchases match your search" : "You haven't purchased any products yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPurchases.map((order) => (
                <Card key={order.id} className="relative">
                  <div className="absolute top-2 right-2">
                    <Badge variant={
                      order.status === 'completed' ? 'default' :
                      order.status === 'pending' ? 'secondary' :
                      order.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="relative">
                    {order.product?.thumbnail_url ? (
                      <img
                        src={order.product.thumbnail_url}
                        alt={order.product.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">
                      {order.product?.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                      <span>Purchased {formatDate(order.created_at)}</span>
                      <span className="font-semibold text-primary">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                    
                    {order.status === 'completed' && (
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleDownload(order)} 
                          className="w-full"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        
                        <Button 
                          onClick={() => handleWriteReview(order)}
                          variant="outline" 
                          className="w-full"
                          size="sm"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Write Review
                        </Button>
                      </div>
                    )}
                    
                    {order.status === 'pending' && (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          Payment processing...
                        </p>
                      </div>
                    )}
                    
                    {order.status === 'failed' && (
                      <div className="text-center py-2">
                        <p className="text-sm text-destructive">
                          Payment failed
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-6">
          {filteredWishlist.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Items in Wishlist</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "No wishlist items match your search" : "Start adding products to your wishlist"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWishlist.map((item) => (
                <Card key={item.id}>
                  <div className="relative">
                    {item.product?.thumbnail_url ? (
                      <img
                        src={item.product.thumbnail_url}
                        alt={item.product.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">
                      {item.product?.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {item.product?.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(item.product?.price || 0)}
                      </span>
                      <div className="text-sm text-muted-foreground">
                        Added {formatDate(item.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button className="flex-1" size="sm">
                        Buy Now
                      </Button>
                      <Button 
                        onClick={() => item.product && handleRemoveFromWishlist(item.product.id)}
                        variant="outline" 
                        size="sm"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {selectedOrder?.product?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-6 w-6 ${
                        rating <= reviewForm.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="review-text">Review (Optional)</Label>
              <Textarea
                id="review-text"
                value={reviewForm.review_text}
                onChange={(e) => setReviewForm(prev => ({ ...prev, review_text: e.target.value }))}
                placeholder="Share your thoughts about this product..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};