import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Building, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { CreatorWallet, PayoutMethod } from '@/types/wallet';

interface PayoutMethodSettingsProps {
  wallet: CreatorWallet;
  onUpdate: (payoutMethod: PayoutMethod) => Promise<boolean>;
  onClose?: () => void;
}

export function PayoutMethodSettings({ wallet, onUpdate, onClose }: PayoutMethodSettingsProps) {
  const [currentMethod, setCurrentMethod] = useState<PayoutMethod>(
    wallet.payout_method || { type: 'bank_account', details: {} }
  );
  const [isEditing, setIsEditing] = useState(!wallet.payout_method || Object.keys(wallet.payout_method).length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    // Validate the payout method
    if (currentMethod.type === 'bank_account') {
      const bankDetails = currentMethod.details as any;
      if (!bankDetails.account_holder_name || !bankDetails.account_number || 
          !bankDetails.routing_number || !bankDetails.bank_name) {
        setError('Please fill in all bank account details');
        return;
      }
    } else if (currentMethod.type === 'paypal') {
      const paypalDetails = currentMethod.details as any;
      if (!paypalDetails.email || !paypalDetails.email.includes('@')) {
        setError('Please enter a valid PayPal email address');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onUpdate(currentMethod);
      if (success) {
        setSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update payout method');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodTypeChange = (type: 'bank_account' | 'paypal') => {
    setCurrentMethod({
      type,
      details: type === 'bank_account' 
        ? {
            account_holder_name: '',
            account_number: '',
            routing_number: '',
            bank_name: '',
            account_type: 'checking'
          }
        : { email: '' }
    });
  };

  const updateBankDetails = (field: string, value: string) => {
    setCurrentMethod(prev => ({
      ...prev,
      details: { ...prev.details, [field]: value }
    }));
  };

  const updatePaypalDetails = (email: string) => {
    setCurrentMethod(prev => ({
      ...prev,
      details: { email }
    }));
  };

  const renderCurrentMethod = () => {
    if (!wallet.payout_method || Object.keys(wallet.payout_method).length === 0) {
      return (
        <div className="text-center py-6">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payout method set</h3>
          <p className="text-gray-500 mb-4">Add a payout method to receive your earnings</p>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payout Method
          </Button>
        </div>
      );
    }

    const method = wallet.payout_method;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {method.type === 'bank_account' ? (
              <Building className="h-5 w-5 text-blue-600" />
            ) : (
              <CreditCard className="h-5 w-5 text-blue-600" />
            )}
            <div>
              <p className="font-medium">
                {method.type === 'bank_account' ? 'Bank Account' : 'PayPal'}
              </p>
              <p className="text-sm text-gray-500">
                {method.type === 'bank_account' 
                  ? `${(method.details as any).bank_name} - ****${(method.details as any).account_number?.slice(-4)}`
                  : (method.details as any).email
                }
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge variant="secondary">
              <CheckCircle className="mr-1 h-3 w-3" />
              Active
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditForm = () => (
    <div className="space-y-6">
      {/* Method Type Selection */}
      <div className="space-y-2">
        <Label>Payout Method Type</Label>
        <Select 
          value={currentMethod.type} 
          onValueChange={handleMethodTypeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_account">
              <div className="flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Bank Account
              </div>
            </SelectItem>
            <SelectItem value="paypal">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                PayPal
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bank Account Form */}
      {currentMethod.type === 'bank_account' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bank Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_account_holder_name">Account Holder Name</Label>
                <Input
                  id="edit_account_holder_name"
                  value={(currentMethod.details as any).account_holder_name || ''}
                  onChange={(e) => updateBankDetails('account_holder_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_bank_name">Bank Name</Label>
                <Input
                  id="edit_bank_name"
                  value={(currentMethod.details as any).bank_name || ''}
                  onChange={(e) => updateBankDetails('bank_name', e.target.value)}
                  placeholder="Chase Bank"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_account_number">Account Number</Label>
                <Input
                  id="edit_account_number"
                  value={(currentMethod.details as any).account_number || ''}
                  onChange={(e) => updateBankDetails('account_number', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_routing_number">Routing Number</Label>
                <Input
                  id="edit_routing_number"
                  value={(currentMethod.details as any).routing_number || ''}
                  onChange={(e) => updateBankDetails('routing_number', e.target.value)}
                  placeholder="021000021"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select 
                value={(currentMethod.details as any).account_type || 'checking'}
                onValueChange={(value) => updateBankDetails('account_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PayPal Form */}
      {currentMethod.type === 'paypal' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PayPal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="edit_paypal_email">PayPal Email</Label>
              <Input
                id="edit_paypal_email"
                type="email"
                value={(currentMethod.details as any).email || ''}
                onChange={(e) => updatePaypalDetails(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payout method updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setIsEditing(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );

  const content = (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Payout Method Settings</h2>
      </div>

      {isEditing ? renderEditForm() : renderCurrentMethod()}

      {/* Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your payout information is encrypted and securely stored. We never store your full account details.
        </AlertDescription>
      </Alert>
    </div>
  );

  if (onClose) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout Method Settings</DialogTitle>
            <DialogDescription>
              Configure how you'd like to receive your earnings
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="max-w-2xl">{content}</div>;
}