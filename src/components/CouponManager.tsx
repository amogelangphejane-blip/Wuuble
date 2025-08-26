import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Percent, 
  DollarSign, 
  Calendar, 
  Users,
  Copy,
  Eye,
  EyeOff,
  Tag,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useCoupons } from '@/hooks/useCoupons';
import { CreateCouponRequest, UpdateCouponRequest, SubscriptionCoupon } from '@/types/subscription';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code must be at most 20 characters').regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed_amount']),
  discount_value: z.number().min(0.01, 'Discount value must be positive'),
  max_uses: z.number().min(1).optional(),
  valid_until: z.string().optional(),
  applies_to: z.enum(['all', 'first_payment', 'recurring']).optional(),
  minimum_amount: z.number().min(0).optional()
}).refine((data) => {
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    return false;
  }
  return true;
}, {
  message: "Percentage discount cannot exceed 100%",
  path: ["discount_value"]
});

type CouponFormData = z.infer<typeof couponSchema>;

interface CouponManagerProps {
  communityId: string;
  isCreator: boolean;
}

export const CouponManager: React.FC<CouponManagerProps> = ({
  communityId,
  isCreator
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<SubscriptionCoupon | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const {
    coupons,
    couponStats,
    couponUsage,
    couponsLoading,
    statsLoading,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    isCreatingCoupon,
    isUpdatingCoupon,
    isDeletingCoupon
  } = useCoupons(communityId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      discount_type: 'percentage',
      applies_to: 'all'
    }
  });

  const discountType = watch('discount_type');

  const handleCreateCoupon = (data: CouponFormData) => {
    const couponData: CreateCouponRequest = {
      community_id: communityId,
      ...data,
      currency: 'USD'
    };

    createCoupon(couponData);
    setIsCreateDialogOpen(false);
    reset();
  };

  const handleEditCoupon = (coupon: SubscriptionCoupon) => {
    setEditingCoupon(coupon);
    setValue('name', coupon.name);
    setValue('description', coupon.description || '');
    setValue('discount_type', coupon.discount_type);
    setValue('discount_value', coupon.discount_value);
    setValue('max_uses', coupon.max_uses || undefined);
    setValue('valid_until', coupon.valid_until ? format(new Date(coupon.valid_until), 'yyyy-MM-dd') : '');
    setValue('applies_to', coupon.applies_to);
    setValue('minimum_amount', coupon.minimum_amount || undefined);
  };

  const handleUpdateCoupon = (data: CouponFormData) => {
    if (!editingCoupon) return;

    const updates: UpdateCouponRequest = {
      name: data.name,
      description: data.description,
      discount_value: data.discount_value,
      max_uses: data.max_uses,
      valid_until: data.valid_until ? new Date(data.valid_until).toISOString() : undefined,
      applies_to: data.applies_to,
      minimum_amount: data.minimum_amount
    };

    updateCoupon({ id: editingCoupon.id, updates });
    setEditingCoupon(null);
    reset();
  };

  const handleDeleteCoupon = (couponId: string) => {
    if (confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      deleteCoupon(couponId);
    }
  };

  const handleToggleCouponStatus = (coupon: SubscriptionCoupon) => {
    updateCoupon({ 
      id: coupon.id, 
      updates: { is_active: !coupon.is_active } 
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getDiscountDisplay = (coupon: SubscriptionCoupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% off`;
    } else {
      return `$${coupon.discount_value} off`;
    }
  };

  const getStatusBadge = (coupon: SubscriptionCoupon) => {
    const now = new Date();
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
    const isExpired = validUntil && validUntil < now;
    const isLimitReached = coupon.max_uses && coupon.current_uses >= coupon.max_uses;

    if (!coupon.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    } else if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (isLimitReached) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  const filteredCoupons = coupons?.filter(coupon => 
    showInactive || (coupon.is_active && (!coupon.valid_until || new Date(coupon.valid_until) > new Date()))
  ) || [];

  if (!isCreator) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only community creators can manage coupons.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {couponStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{couponStats.total_coupons}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{couponStats.active_coupons}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{couponStats.total_uses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${couponStats.total_discount_given.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Coupon Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage discount coupons for your community</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">Show inactive</Label>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
                <DialogDescription>
                  Create a discount coupon for your community members
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(handleCreateCoupon)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Coupon Code *</Label>
                    <Input
                      id="code"
                      placeholder="SAVE20"
                      {...register('code')}
                      className="uppercase"
                      onChange={(e) => setValue('code', e.target.value.toUpperCase())}
                    />
                    {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      placeholder="20% Off Welcome Discount"
                      {...register('name')}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Welcome discount for new subscribers"
                    {...register('description')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type *</Label>
                    <Select value={discountType} onValueChange={(value) => setValue('discount_type', value as 'percentage' | 'fixed_amount')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discount_value">
                      {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={discountType === 'percentage' ? 100 : undefined}
                      {...register('discount_value', { valueAsNumber: true })}
                    />
                    {errors.discount_value && <p className="text-sm text-red-500">{errors.discount_value.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_uses">Maximum Uses</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      {...register('max_uses', { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="valid_until">Valid Until</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      {...register('valid_until')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Applies To</Label>
                    <Select defaultValue="all" onValueChange={(value) => setValue('applies_to', value as 'all' | 'first_payment' | 'recurring')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="first_payment">First Payment Only</SelectItem>
                        <SelectItem value="recurring">Recurring Payments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="minimum_amount">Minimum Amount ($)</Label>
                    <Input
                      id="minimum_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="No minimum"
                      {...register('minimum_amount', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingCoupon}>
                    {isCreatingCoupon ? 'Creating...' : 'Create Coupon'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Coupons List */}
      <div className="grid gap-4">
        {couponsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCoupons.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first coupon to offer discounts to your community members.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Coupon
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCoupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {getStatusBadge(coupon)}
                    </div>
                    
                    <h4 className="font-semibold">{coupon.name}</h4>
                    {coupon.description && (
                      <p className="text-sm text-muted-foreground mb-2">{coupon.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {coupon.discount_type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {getDiscountDisplay(coupon)}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ''} uses
                      </span>
                      
                      {coupon.valid_until && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Until {format(new Date(coupon.valid_until), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleCouponStatus(coupon)}
                      disabled={isUpdatingCoupon}
                    >
                      {coupon.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCoupon(coupon)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      disabled={isDeletingCoupon}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update coupon details
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(handleUpdateCoupon)} className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <Input value={editingCoupon?.code || ''} disabled className="bg-muted" />
            </div>

            <div>
              <Label htmlFor="edit-name">Display Name *</Label>
              <Input
                id="edit-name"
                {...register('name')}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Input value={editingCoupon?.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'} disabled className="bg-muted" />
              </div>

              <div>
                <Label htmlFor="edit-discount_value">
                  {editingCoupon?.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                </Label>
                <Input
                  id="edit-discount_value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={editingCoupon?.discount_type === 'percentage' ? 100 : undefined}
                  {...register('discount_value', { valueAsNumber: true })}
                />
                {errors.discount_value && <p className="text-sm text-red-500">{errors.discount_value.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-max_uses">Maximum Uses</Label>
                <Input
                  id="edit-max_uses"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  {...register('max_uses', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="edit-valid_until">Valid Until</Label>
                <Input
                  id="edit-valid_until"
                  type="date"
                  {...register('valid_until')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Applies To</Label>
                <Select defaultValue={editingCoupon?.applies_to} onValueChange={(value) => setValue('applies_to', value as 'all' | 'first_payment' | 'recurring')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="first_payment">First Payment Only</SelectItem>
                    <SelectItem value="recurring">Recurring Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-minimum_amount">Minimum Amount ($)</Label>
                <Input
                  id="edit-minimum_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No minimum"
                  {...register('minimum_amount', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingCoupon(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingCoupon}>
                {isUpdatingCoupon ? 'Updating...' : 'Update Coupon'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponManager;