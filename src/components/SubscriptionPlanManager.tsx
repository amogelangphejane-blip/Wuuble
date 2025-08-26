import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users, 
  Calendar, 
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useSubscriptions, useSubscriptionMetrics } from '@/hooks/useSubscriptions';
import { CreateSubscriptionPlanRequest, UpdateSubscriptionPlanRequest, SubscriptionPlan } from '@/types/subscription';

const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  price_monthly: z.number().min(0).optional(),
  price_yearly: z.number().min(0).optional(),
  trial_days: z.number().min(0).max(365).optional(),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  max_members: z.number().min(1).optional()
}).refine((data) => {
  // Ensure at least one pricing option is provided
  return data.price_monthly || data.price_yearly;
}, {
  message: "At least one pricing option (monthly or yearly) is required",
  path: ["price_monthly"]
});

type PlanFormData = z.infer<typeof planSchema>;

interface SubscriptionPlanManagerProps {
  communityId: string;
  isCreator: boolean;
}

export const SubscriptionPlanManager: React.FC<SubscriptionPlanManagerProps> = ({
  communityId,
  isCreator
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [newFeature, setNewFeature] = useState('');

  const {
    subscriptionPlans,
    plansLoading,
    createPlan,
    updatePlan,
    isCreatingPlan,
    isUpdatingPlan
  } = useSubscriptions(communityId);

  const { metrics, isLoading: metricsLoading } = useSubscriptionMetrics(communityId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      features: [],
      trial_days: 0
    }
  });

  const watchedFeatures = watch('features') || [];

  const onSubmit = (data: PlanFormData) => {
    console.log('Form submission data:', data);
    
    if (editingPlan) {
      updatePlan({
        planId: editingPlan.id,
        updates: data as UpdateSubscriptionPlanRequest
      });
      setEditingPlan(null);
    } else {
      const createData = {
        ...data,
        community_id: communityId,
        trial_days: data.trial_days || 0 // Ensure trial_days has a default value
      } as CreateSubscriptionPlanRequest;
      
      console.log('Creating plan with data:', createData);
      createPlan(createData);
      setIsCreateDialogOpen(false);
    }
    reset();
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = getValues('features') || [];
      setValue('features', [...currentFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures = getValues('features') || [];
    setValue('features', currentFeatures.filter((_, i) => i !== index));
  };

  const startEditing = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setValue('name', plan.name);
    setValue('description', plan.description || '');
    setValue('price_monthly', plan.price_monthly || undefined);
    setValue('price_yearly', plan.price_yearly || undefined);
    setValue('trial_days', plan.trial_days);
    setValue('features', plan.features);
    setValue('max_members', plan.max_members || undefined);
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    reset();
    setEditingPlan(null);
    setIsCreateDialogOpen(false);
  };

  if (!isCreator) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only community creators can manage subscription plans.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Create and manage subscription plans for your community
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </DialogTitle>
              <DialogDescription>
                Set up pricing tiers and features for your community members.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Basic, Premium, VIP"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="trial_days">Free Trial (Days)</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    min="0"
                    max="365"
                    placeholder="0"
                    {...register('trial_days', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this plan includes..."
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('price_monthly', { valueAsNumber: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('price_yearly', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_members">Max Members (Optional)</Label>
                <Input
                  id="max_members"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  {...register('max_members', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-4">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} variant="outline">
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {watchedFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {errors.features && (
                  <p className="text-sm text-destructive">{errors.features.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingPlan || isUpdatingPlan}>
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="metrics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : subscriptionPlans && subscriptionPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {!plan.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.price_monthly && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">${plan.price_monthly}/month</span>
                        </div>
                      )}
                      
                      {plan.price_yearly && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">${plan.price_yearly}/year</span>
                          {plan.price_monthly && (
                            <Badge variant="outline" className="text-xs">
                              Save {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {plan.trial_days > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{plan.trial_days} day free trial</span>
                        </div>
                      )}
                      
                      {plan.max_members && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Max {plan.max_members} members</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Features:</h4>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No subscription plans yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first subscription plan to start monetizing your community.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {metricsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total_subscribers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.active_subscribers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.trial_subscribers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.monthly_revenue.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No metrics available yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};