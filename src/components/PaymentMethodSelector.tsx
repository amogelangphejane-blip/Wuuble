import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Building2, 
  Wallet,
  Plus,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { PaymentMethodInfo } from '@/types/subscription';
import { usePaymentMethods, usePaymentInstructions } from '@/hooks/usePaymentMethods';
import { AddPaymentMethodDialog } from './AddPaymentMethodDialog';
import { PaymentInstructionsDialog } from './PaymentInstructionsDialog';

interface PaymentMethodSelectorProps {
  communityId: string;
  selectedPaymentMethodId?: string;
  onPaymentMethodSelect: (paymentMethodId: string | null) => void;
  amount: number;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  communityId,
  selectedPaymentMethodId,
  onPaymentMethodSelect,
  amount,
  disabled = false
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const [selectedInstructionType, setSelectedInstructionType] = useState<'bank_transfer' | 'crypto' | null>(null);
  
  const { 
    paymentMethods, 
    loading, 
    error,
    validatePaymentMethod
  } = usePaymentMethods();
  
  const { instructions } = usePaymentInstructions(communityId);

  const getPaymentMethodIcon = (type: PaymentMethodInfo['type']) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'paypal':
        return <Wallet className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'crypto':
        return <Wallet className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodDescription = (paymentMethod: PaymentMethodInfo) => {
    switch (paymentMethod.type) {
      case 'card':
        return `${paymentMethod.card_brand?.toUpperCase()} ending in ${paymentMethod.card_last4}`;
      case 'paypal':
        return paymentMethod.paypal_email || 'PayPal Account';
      case 'bank_transfer':
        return `${paymentMethod.bank_name} ending in ${paymentMethod.bank_account_last4}`;
      case 'crypto':
        return 'Cryptocurrency Wallet';
      default:
        return paymentMethod.display_name;
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    onPaymentMethodSelect(value === 'manual' ? null : value);
  };

  const handleShowInstructions = (type: 'bank_transfer' | 'crypto') => {
    setSelectedInstructionType(type);
    setShowInstructionsDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose how you'd like to pay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-md animate-pulse">
                <div className="h-4 w-4 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose how you'd like to pay for your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedPaymentMethodId || 'manual'}
            onValueChange={handlePaymentMethodChange}
            disabled={disabled}
          >
            {/* Saved Payment Methods */}
            {paymentMethods.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Saved Payment Methods</Label>
                {paymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={paymentMethod.id} 
                      id={paymentMethod.id}
                      disabled={disabled}
                    />
                    <Label 
                      htmlFor={paymentMethod.id} 
                      className="flex-1 flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(paymentMethod.type)}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {paymentMethod.display_name}
                            {paymentMethod.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getPaymentMethodDescription(paymentMethod)}
                          </div>
                        </div>
                      </div>
                      {selectedPaymentMethodId === paymentMethod.id && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Payment Method */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Add New Payment Method</Label>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                disabled={disabled}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Credit/Debit Card or PayPal
              </Button>
            </div>

            {/* Manual Payment Options */}
            {instructions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Alternative Payment Methods</Label>
                  
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="manual" id="manual" disabled={disabled} />
                    <Label htmlFor="manual" className="flex-1">
                      <div className="font-medium">Manual Payment</div>
                      <div className="text-sm text-muted-foreground">
                        Pay via bank transfer or other methods
                      </div>
                    </Label>
                  </div>
                  
                  {selectedPaymentMethodId === null && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        You'll receive payment instructions after selecting this option.
                        Your subscription will be activated once payment is confirmed.
                        <div className="mt-2 space-x-2">
                          {instructions.filter(i => i.payment_type === 'bank_transfer').length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowInstructions('bank_transfer')}
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              Bank Transfer
                            </Button>
                          )}
                          {instructions.filter(i => i.payment_type === 'crypto').length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowInstructions('crypto')}
                            >
                              <Wallet className="h-3 w-3 mr-1" />
                              Cryptocurrency
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </RadioGroup>

          {/* Payment Amount Summary */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">${amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          // The hook will automatically refresh the payment methods
        }}
      />

      {/* Payment Instructions Dialog */}
      <PaymentInstructionsDialog
        open={showInstructionsDialog}
        onOpenChange={setShowInstructionsDialog}
        communityId={communityId}
        paymentType={selectedInstructionType}
        amount={amount}
      />
    </>
  );
};

export default PaymentMethodSelector;