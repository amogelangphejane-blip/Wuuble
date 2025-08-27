import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2,
  Wallet,
  Plus,
  Edit,
  Trash2,
  Save,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { PaymentInstructions } from '@/types/subscription';
import { usePaymentInstructions } from '@/hooks/usePaymentMethods';
import { PaymentMethodService } from '@/services/paymentMethodService';
import { useToast } from '@/hooks/use-toast';

interface PaymentInstructionsManagerProps {
  communityId: string;
  isAdmin?: boolean;
}

export const PaymentInstructionsManager: React.FC<PaymentInstructionsManagerProps> = ({
  communityId,
  isAdmin = false
}) => {
  const { toast } = useToast();
  const { instructions, loading, error, refreshInstructions } = usePaymentInstructions(communityId);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<PaymentInstructions | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentInstructions>>({
    payment_type: 'bank_transfer',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof PaymentInstructions, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      payment_type: 'bank_transfer',
      is_active: true
    });
    setEditingInstruction(null);
  };

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.instructions?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const instructionData = {
        ...formData,
        community_id: communityId
      } as Omit<PaymentInstructions, 'id' | 'created_at' | 'updated_at'>;

      const result = await PaymentMethodService.createPaymentInstructions(instructionData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Payment instructions saved successfully"
        });
        
        setShowAddDialog(false);
        resetForm();
        refreshInstructions();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save instructions",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save instructions",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'crypto':
        return <Wallet className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPaymentTypeName = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'crypto':
        return 'Cryptocurrency';
      default:
        return 'Other';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Available payment methods for this community</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : instructions.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No alternative payment methods are currently configured for this community.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {instructions.map((instruction) => (
                <div key={instruction.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getPaymentTypeIcon(instruction.payment_type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{instruction.title}</h4>
                      <Badge variant={instruction.is_active ? "default" : "secondary"}>
                        {instruction.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getPaymentTypeName(instruction.payment_type)} available
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Instructions</CardTitle>
              <CardDescription>
                Manage payment methods and instructions for your community
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Instructions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : instructions.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No payment instructions</h3>
              <p className="text-muted-foreground mb-4">
                Add payment instructions to offer alternative payment methods to your members
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Instructions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {instructions.map((instruction) => (
                <Card key={instruction.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPaymentTypeIcon(instruction.payment_type)}
                        <CardTitle className="text-lg">{instruction.title}</CardTitle>
                        <Badge variant={instruction.is_active ? "default" : "secondary"}>
                          {instruction.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingInstruction(instruction);
                            setFormData(instruction);
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {getPaymentTypeName(instruction.payment_type)} Instructions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Bank Transfer Details */}
                      {instruction.payment_type === 'bank_transfer' && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {instruction.bank_name && (
                            <div>
                              <span className="font-medium">Bank:</span> {instruction.bank_name}
                            </div>
                          )}
                          {instruction.account_name && (
                            <div>
                              <span className="font-medium">Account:</span> {instruction.account_name}
                            </div>
                          )}
                          {instruction.account_number && (
                            <div>
                              <span className="font-medium">Account #:</span> ****{instruction.account_number.slice(-4)}
                            </div>
                          )}
                          {instruction.routing_number && (
                            <div>
                              <span className="font-medium">Routing:</span> {instruction.routing_number}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Crypto Details */}
                      {instruction.payment_type === 'crypto' && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {instruction.crypto_type && (
                            <div>
                              <span className="font-medium">Currency:</span> {instruction.crypto_type}
                            </div>
                          )}
                          {instruction.network && (
                            <div>
                              <span className="font-medium">Network:</span> {instruction.network}
                            </div>
                          )}
                          {instruction.wallet_address && (
                            <div className="col-span-2">
                              <span className="font-medium">Wallet:</span> 
                              <span className="font-mono text-xs"> {instruction.wallet_address.slice(0, 20)}...</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div>
                        <span className="font-medium text-sm">Instructions:</span>
                        <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                          {instruction.instructions.substring(0, 200)}
                          {instruction.instructions.length > 200 && '...'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInstruction ? 'Edit' : 'Add'} Payment Instructions
            </DialogTitle>
            <DialogDescription>
              Configure payment instructions for your community members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value) => handleInputChange('payment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Bank Wire Transfer"
                  />
                </div>
              </div>

              {/* Bank Transfer Specific Fields */}
              {formData.payment_type === 'bank_transfer' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Bank Name"
                      value={formData.bank_name || ''}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    />
                    <Input
                      placeholder="Account Holder Name"
                      value={formData.account_name || ''}
                      onChange={(e) => handleInputChange('account_name', e.target.value)}
                    />
                    <Input
                      placeholder="Account Number"
                      value={formData.account_number || ''}
                      onChange={(e) => handleInputChange('account_number', e.target.value)}
                    />
                    <Input
                      placeholder="Routing Number"
                      value={formData.routing_number || ''}
                      onChange={(e) => handleInputChange('routing_number', e.target.value)}
                    />
                    <Input
                      placeholder="SWIFT Code (optional)"
                      value={formData.swift_code || ''}
                      onChange={(e) => handleInputChange('swift_code', e.target.value)}
                    />
                    <Input
                      placeholder="IBAN (optional)"
                      value={formData.iban || ''}
                      onChange={(e) => handleInputChange('iban', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Crypto Specific Fields */}
              {formData.payment_type === 'crypto' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Cryptocurrency Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Cryptocurrency (e.g., BTC, ETH)"
                      value={formData.crypto_type || ''}
                      onChange={(e) => handleInputChange('crypto_type', e.target.value)}
                    />
                    <Input
                      placeholder="Network (e.g., Bitcoin, Ethereum)"
                      value={formData.network || ''}
                      onChange={(e) => handleInputChange('network', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Wallet Address"
                      value={formData.wallet_address || ''}
                      onChange={(e) => handleInputChange('wallet_address', e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions || ''}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Provide detailed instructions for members on how to complete the payment..."
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active || false}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active (visible to members)</Label>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Instructions
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentInstructionsManager;