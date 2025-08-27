import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Building2, 
  Wallet,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { CreatePaymentMethodRequest } from '@/types/subscription';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { isStripeEnabled } from '@/lib/stripe';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddPaymentMethodDialog: React.FC<AddPaymentMethodDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentMethod, actionLoading } = usePaymentMethods();
  
  const [activeTab, setActiveTab] = useState<'card' | 'paypal' | 'bank'>('card');
  const [formData, setFormData] = useState<Partial<CreatePaymentMethodRequest>>({
    is_default: false
  });
  const [error, setError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreatePaymentMethodRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateCardForm = () => {
    if (!formData.display_name?.trim()) {
      setError('Please enter a name for this payment method');
      return false;
    }
    return true;
  };

  const validatePayPalForm = () => {
    if (!formData.display_name?.trim()) {
      setError('Please enter a name for this payment method');
      return false;
    }
    if (!formData.paypal_email?.trim()) {
      setError('Please enter your PayPal email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.paypal_email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateBankForm = () => {
    if (!formData.display_name?.trim()) {
      setError('Please enter a name for this payment method');
      return false;
    }
    if (!formData.bank_name?.trim()) {
      setError('Please enter your bank name');
      return false;
    }
    if (!formData.bank_account_holder_name?.trim()) {
      setError('Please enter the account holder name');
      return false;
    }
    if (!formData.bank_routing_number?.trim()) {
      setError('Please enter the routing number');
      return false;
    }
    if (!formData.bank_account_last4?.trim()) {
      setError('Please enter the last 4 digits of your account number');
      return false;
    }
    if (!formData.bank_account_type) {
      setError('Please select your account type');
      return false;
    }
    return true;
  };

  const handleCardSubmit = async () => {
    if (!validateCardForm()) return;

    if (isStripeEnabled() && stripe && elements) {
      // Real Stripe integration
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        return;
      }

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setCardError(stripeError.message || 'Card validation failed');
        return;
      }

      const paymentMethodData: CreatePaymentMethodRequest = {
        type: 'card',
        display_name: formData.display_name!,
        is_default: formData.is_default,
        card_last4: paymentMethod.card?.last4,
        card_brand: paymentMethod.card?.brand,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        stripe_payment_method_id: paymentMethod.id
      };

      const result = await createPaymentMethod(paymentMethodData);
      if (result.success) {
        onSuccess();
        resetForm();
      }
    } else {
      // Mock implementation for development
      const paymentMethodData: CreatePaymentMethodRequest = {
        type: 'card',
        display_name: formData.display_name!,
        is_default: formData.is_default,
        card_last4: '1234',
        card_brand: 'visa',
        card_exp_month: 12,
        card_exp_year: 2025
      };

      const result = await createPaymentMethod(paymentMethodData);
      if (result.success) {
        onSuccess();
        resetForm();
      }
    }
  };

  const handlePayPalSubmit = async () => {
    if (!validatePayPalForm()) return;

    const paymentMethodData: CreatePaymentMethodRequest = {
      type: 'paypal',
      display_name: formData.display_name!,
      is_default: formData.is_default,
      paypal_email: formData.paypal_email
    };

    const result = await createPaymentMethod(paymentMethodData);
    if (result.success) {
      onSuccess();
      resetForm();
    }
  };

  const handleBankSubmit = async () => {
    if (!validateBankForm()) return;

    const paymentMethodData: CreatePaymentMethodRequest = {
      type: 'bank_transfer',
      display_name: formData.display_name!,
      is_default: formData.is_default,
      bank_name: formData.bank_name,
      bank_account_holder_name: formData.bank_account_holder_name,
      bank_routing_number: formData.bank_routing_number,
      bank_account_last4: formData.bank_account_last4,
      bank_account_type: formData.bank_account_type
    };

    const result = await createPaymentMethod(paymentMethodData);
    if (result.success) {
      onSuccess();
      resetForm();
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setCardError(null);

    switch (activeTab) {
      case 'card':
        await handleCardSubmit();
        break;
      case 'paypal':
        await handlePayPalSubmit();
        break;
      case 'bank':
        await handleBankSubmit();
        break;
    }
  };

  const resetForm = () => {
    setFormData({ is_default: false });
    setError(null);
    setCardError(null);
    setActiveTab('card');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method for your subscriptions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="paypal" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              PayPal
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Payment Method Name</Label>
              <Input
                id="display_name"
                placeholder="e.g., My Visa Card, Work PayPal"
                value={formData.display_name || ''}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Card Information</Label>
                <div className="p-3 border rounded-md">
                  {isStripeEnabled() ? (
                    <CardElement 
                      options={cardElementOptions}
                      onChange={(event) => {
                        if (event.error) {
                          setCardError(event.error.message);
                        } else {
                          setCardError(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Card input (mock mode - any values accepted)
                    </div>
                  )}
                </div>
                {cardError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{cardError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="paypal" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="paypal_email">PayPal Email</Label>
                <Input
                  id="paypal_email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.paypal_email || ''}
                  onChange={(e) => handleInputChange('paypal_email', e.target.value)}
                  disabled={actionLoading}
                />
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You'll be redirected to PayPal to authorize payments when making a purchase.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    placeholder="Chase, Wells Fargo, etc."
                    value={formData.bank_name || ''}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select 
                    value={formData.bank_account_type || ''} 
                    onValueChange={(value) => handleInputChange('bank_account_type', value)}
                    disabled={actionLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_holder">Account Holder Name</Label>
                <Input
                  id="account_holder"
                  placeholder="Full name as it appears on account"
                  value={formData.bank_account_holder_name || ''}
                  onChange={(e) => handleInputChange('bank_account_holder_name', e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routing_number">Routing Number</Label>
                  <Input
                    id="routing_number"
                    placeholder="9 digits"
                    value={formData.bank_routing_number || ''}
                    onChange={(e) => handleInputChange('bank_routing_number', e.target.value)}
                    disabled={actionLoading}
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_last4">Last 4 Digits</Label>
                  <Input
                    id="account_last4"
                    placeholder="1234"
                    value={formData.bank_account_last4 || ''}
                    onChange={(e) => handleInputChange('bank_account_last4', e.target.value)}
                    disabled={actionLoading}
                    maxLength={4}
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Bank transfers require verification which can take 1-2 business days.
                  You'll need to verify small deposit amounts.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <Separator />

            {/* Default Payment Method Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default || false}
                onCheckedChange={(checked) => handleInputChange('is_default', checked)}
                disabled={actionLoading}
              />
              <Label htmlFor="is_default">Set as default payment method</Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={actionLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Payment Method'
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentMethodDialog;