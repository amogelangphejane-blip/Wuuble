import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PatronService, MembershipTier } from '@/services/patronService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Crown,
  Star,
  Heart,
  Zap,
  Shield
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MembershipTierManagerProps {
  communityId: string;
  onTiersUpdated?: () => void;
}

export const MembershipTierManager: React.FC<MembershipTierManagerProps> = ({
  communityId,
  onTiersUpdated,
}) => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    benefits: [] as string[],
    color: '#8B5CF6',
    icon: 'heart',
    is_highlighted: false,
    max_members: undefined as number | undefined,
  });
  const [benefitInput, setBenefitInput] = useState('');
  const [saving, setSaving] = useState(false);

  const iconOptions = [
    { value: 'heart', label: 'Heart', icon: Heart },
    { value: 'crown', label: 'Crown', icon: Crown },
    { value: 'star', label: 'Star', icon: Star },
    { value: 'zap', label: 'Lightning', icon: Zap },
    { value: 'shield', label: 'Shield', icon: Shield },
  ];

  const colorOptions = [
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#14B8A6', label: 'Teal' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      benefits: [],
      color: '#8B5CF6',
      icon: 'heart',
      is_highlighted: false,
      max_members: undefined,
    });
    setBenefitInput('');
    setEditingTier(null);
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()],
      });
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formData.name || formData.price_monthly <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please provide a name and price',
          variant: 'destructive',
        });
        return;
      }

      const tierData = {
        community_id: communityId,
        name: formData.name,
        description: formData.description,
        price_monthly: formData.price_monthly,
        benefits: formData.benefits,
        color: formData.color,
        icon: formData.icon,
        is_highlighted: formData.is_highlighted,
        max_members: formData.max_members,
        is_active: true,
        position: 0,
      };

      if (editingTier) {
        await PatronService.updateMembershipTier(editingTier.id, tierData);
        toast({
          title: 'Tier Updated',
          description: 'Membership tier updated successfully',
        });
      } else {
        await PatronService.createMembershipTier(tierData);
        toast({
          title: 'Tier Created',
          description: 'New membership tier created successfully',
        });
      }

      setShowCreateDialog(false);
      resetForm();
      onTiersUpdated?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save tier',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tier: MembershipTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description || '',
      price_monthly: tier.price_monthly,
      benefits: tier.benefits,
      color: tier.color || '#8B5CF6',
      icon: tier.icon || 'heart',
      is_highlighted: tier.is_highlighted,
      max_members: tier.max_members,
    });
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Membership Tiers</h3>
          <p className="text-sm text-gray-500">
            Create Patreon-style membership tiers for your community
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Tier
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Edit Membership Tier' : 'Create Membership Tier'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tier Name */}
            <div>
              <Label htmlFor="name">Tier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bronze Supporter, Silver Patron, Gold Member"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this tier"
                rows={2}
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Monthly Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="1"
                value={formData.price_monthly || ''}
                onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                placeholder="9.99"
              />
              <p className="text-xs text-gray-500 mt-1">
                Creator receives 70% (${(formData.price_monthly * 0.7).toFixed(2)}) • Platform fee 30% (${(formData.price_monthly * 0.3).toFixed(2)})
              </p>
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: option.value }} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Max Members */}
            <div>
              <Label htmlFor="max_members">Max Members (Optional)</Label>
              <Input
                id="max_members"
                type="number"
                min="1"
                value={formData.max_members || ''}
                onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || undefined })}
                placeholder="Unlimited"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited members</p>
            </div>

            {/* Highlighted */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="highlighted">Mark as "Most Popular"</Label>
                <p className="text-xs text-gray-500">Highlight this tier with a special badge</p>
              </div>
              <Switch
                id="highlighted"
                checked={formData.is_highlighted}
                onCheckedChange={(checked) => setFormData({ ...formData, is_highlighted: checked })}
              />
            </div>

            {/* Benefits */}
            <div>
              <Label>Benefits</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                />
                <Button type="button" onClick={handleAddBenefit} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm">{benefit}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <Card className="mt-2" style={{ borderColor: formData.color }}>
                <CardHeader className="text-center pb-4">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: formData.color }}
                  >
                    {React.createElement(
                      iconOptions.find(o => o.value === formData.icon)?.icon || Heart,
                      { className: "w-8 h-8 text-white" }
                    )}
                  </div>
                  <CardTitle>{formData.name || 'Tier Name'}</CardTitle>
                  <div className="text-3xl font-bold mt-2">${formData.price_monthly.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">per month</div>
                </CardHeader>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingTier ? 'Update Tier' : 'Create Tier'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
