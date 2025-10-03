import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionPlan, CreateSubscriptionPlanRequest } from '@/types/subscription';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface SubscriptionPlanManagerProps {
  communityId: string;
}

export const SubscriptionPlanManager: React.FC<SubscriptionPlanManagerProps> = ({
  communityId,
}) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSubscriptionPlanRequest>({
    community_id: communityId,
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    trial_days: 0,
    features: [],
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    loadPlans();
  }, [communityId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await SubscriptionService.getSubscriptionPlans(communityId);
      setPlans(plansData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await SubscriptionService.createSubscriptionPlan(formData);
      toast({
        title: 'Success',
        description: 'Subscription plan created successfully',
      });
      setShowCreateDialog(false);
      resetForm();
      loadPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create subscription plan',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlan = async (planId: string, updates: any) => {
    try {
      await SubscriptionService.updateSubscriptionPlan(planId, updates);
      toast({
        title: 'Success',
        description: 'Plan updated successfully',
      });
      loadPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update plan',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    await handleUpdatePlan(plan.id, { is_active: !plan.is_active });
  };

  const resetForm = () => {
    setFormData({
      community_id: communityId,
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 0,
      features: [],
    });
    setFeatureInput('');
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage subscription plans for your community
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium, VIP, Basic"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this plan includes..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                    <Input
                      id="price_monthly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_monthly || ''}
                      onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                      placeholder="9.99"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                    <Input
                      id="price_yearly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_yearly || ''}
                      onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                      placeholder="99.99"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trial_days">Trial Period (days)</Label>
                    <Input
                      id="trial_days"
                      type="number"
                      min="0"
                      max="365"
                      value={formData.trial_days || ''}
                      onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                      placeholder="7"
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_members">Max Members (optional)</Label>
                    <Input
                      id="max_members"
                      type="number"
                      min="1"
                      value={formData.max_members || ''}
                      onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || undefined })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div>
                  <Label>Features</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="Add a feature..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{feature}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Plan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No subscription plans created yet.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {plan.is_active ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    {plan.description && (
                      <CardDescription className="mt-2">{plan.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="space-y-2">
                  {plan.price_monthly && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly</span>
                      <span className="font-semibold">${plan.price_monthly}</span>
                    </div>
                  )}
                  {plan.price_yearly && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Yearly</span>
                      <span className="font-semibold">${plan.price_yearly}</span>
                    </div>
                  )}
                </div>

                {/* Trial Period */}
                {plan.trial_days > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Calendar className="w-4 h-4" />
                    <span>{plan.trial_days} day free trial</span>
                  </div>
                )}

                {/* Max Members */}
                {plan.max_members && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Max {plan.max_members} members</span>
                  </div>
                )}

                {/* Features */}
                {plan.features.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Features:</p>
                    <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-xs text-gray-500">+{plan.features.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`active-${plan.id}`} className="text-sm">Active</Label>
                    <Switch
                      id={`active-${plan.id}`}
                      checked={plan.is_active}
                      onCheckedChange={() => handleToggleActive(plan)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
