import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Star,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Settings,
  BarChart3,
  Calendar,
  ShoppingCart,
  FileText,
  Image as ImageIcon,
  Tag,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SellerOnboardingWizard } from '@/components/SellerOnboardingWizard';
import { EnhancedProductForm } from '@/components/EnhancedProductForm';
import {
  getProducts,
  getProductCategories,
  getSellerProfile,
  createOrUpdateSellerProfile,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getSellerAnalytics
} from '@/services/storeService';
import type {
  DigitalProduct,
  ProductCategory,
  SellerProfile,
  ProductOrder,
  CreateProductForm,
  UpdateProductForm,
  SellerAnalytics
} from '@/types/store';

export const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewSeller, setIsNewSeller] = useState(false);

  // Form state for product creation/editing
  const [productForm, setProductForm] = useState<Partial<CreateProductForm>>({
    title: '',
    description: '',
    price: 0,
    tags: [],
    category_id: '',
  });
  const [productFiles, setProductFiles] = useState<{
    thumbnail?: File;
    previews: File[];
    product?: File;
  }>({ previews: [] });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Reset dialog scroll position when it opens
  useEffect(() => {
    if (showProductDialog) {
      const timer = setTimeout(() => {
        const dialogContent = document.querySelector('[data-radix-dialog-content]');
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [showProductDialog]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all dashboard data in parallel
      const [
        profileResult,
        productsResult,
        categoriesResult,
        ordersResult,
        analyticsResult
      ] = await Promise.all([
        getSellerProfile(),
        getProducts({ seller_id: user?.id }),
        getProductCategories(),
        getOrders(),
        getSellerAnalytics()
      ]);

      if (profileResult.success && profileResult.data) {
        setSellerProfile(profileResult.data);
      } else {
        // New seller - show onboarding
        setIsNewSeller(true);
        setShowOnboarding(true);
      }

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data.products);
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (ordersResult.success && ordersResult.data) {
        setOrders(ordersResult.data);
      }

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      price: 0,
      tags: [],
      category_id: '',
    });
    setProductFiles({ previews: [] });
    setIsCreatingProduct(true);
    setShowProductDialog(true);
  };

  const handleEditProduct = (product: DigitalProduct) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      price: product.price,
      tags: product.tags,
      category_id: product.category_id || '',
    });
    setProductFiles({ previews: [] });
    setIsCreatingProduct(false);
    setShowProductDialog(true);
  };

  const handleSaveProduct = async (data: CreateProductForm | UpdateProductForm) => {
    try {
      if (isCreatingProduct) {
        const result = await createProduct(data as CreateProductForm);
        if (result.success) {
          toast({
            title: "Success",
            description: "Product created successfully",
          });
          loadDashboardData();
          setShowProductDialog(false);
        } else {
          throw new Error(result.error?.message);
        }
      } else if (editingProduct) {
        const result = await updateProduct(editingProduct.id, data as UpdateProductForm);
        if (result.success) {
          toast({
            title: "Success",
            description: "Product updated successfully",
          });
          loadDashboardData();
          setShowProductDialog(false);
        } else {
          throw new Error(result.error?.message);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const result = await deleteProduct(productId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        loadDashboardData();
      } else {
        throw new Error(result.error?.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Show onboarding for new sellers
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-yellow-50/30 py-8">
        <div className="container mx-auto px-4">
          <SellerOnboardingWizard
            onComplete={() => {
              setShowOnboarding(false);
              setIsNewSeller(false);
              loadDashboardData();
            }}
            onSkip={() => {
              setShowOnboarding(false);
              setIsNewSeller(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your digital products and track your sales
          </p>
        </div>
        <div className="flex gap-2">
          {!sellerProfile && (
            <Button 
              variant="outline" 
              onClick={() => setShowOnboarding(true)}
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Complete Setup
            </Button>
          )}
          <Button onClick={handleCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(sellerProfile?.total_earnings || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellerProfile?.total_sales || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.average_rating?.toFixed(1) || '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{product.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.total_sales} sales • {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{order.product?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(order.total_amount)} • {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
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
                  
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold line-clamp-2">{product.title}</h3>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {product.total_sales} sales
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{order.product?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(order.total_amount)}</div>
                      <Badge variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'pending' ? 'secondary' :
                        order.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Detailed insights about your store performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and reporting features are being developed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={sellerProfile?.store_name || ''}
                  placeholder="Your store name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="store-description">Store Description</Label>
                <Textarea
                  id="store-description"
                  value={sellerProfile?.store_description || ''}
                  placeholder="Describe your store and products"
                  rows={4}
                />
              </div>
              
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Product Form Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-6">
          <EnhancedProductForm
            categories={categories}
            initialData={editingProduct ? {
              title: editingProduct.title,
              description: editingProduct.description,
              price: editingProduct.price,
              category_id: editingProduct.category_id || '',
              tags: editingProduct.tags || [],
              download_limit: editingProduct.download_limit,
            } : undefined}
            mode={isCreatingProduct ? 'create' : 'edit'}
            onSubmit={handleSaveProduct}
            onCancel={() => setShowProductDialog(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};