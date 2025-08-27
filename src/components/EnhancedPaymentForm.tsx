import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Lock, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  Wallet
} from 'lucide-react';
import { SubscriptionPlan, PaymentMethodInfo } from '@/types/subscription';
import { CouponInput } from './CouponInput';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentInstructionsDialog } from './PaymentInstructionsDialog';
import { StripeService } from '@/services/stripeService';
import { PayPalService } from '@/services/paypalService';
import { BankTransferService } from '@/services/bankTransferService';
import { isStripeEnabled } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface EnhancedPaymentFormProps {
  plan: SubscriptionPlan;
  communityId: string;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (subscriptionId: string, paymentMethod?: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const PaymentFormContent: React.FC<EnhancedPaymentFormProps> = ({
  plan,
  communityId,
  billingCycle,
  onSuccess,
  onCancel,
  disabled = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { paymentMethods } = usePaymentMethods();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    discountAmount: number;
    couponCode: string;
  } | null>(null);

  const baseAmount = billingCycle === 'yearly' ? (plan.price_yearly || 0) : (plan.price_monthly || 0);
  const finalAmount = baseAmount - (appliedCoupon?.discountAmount || 0);

  const handleCouponApplied = (couponId: string, discountAmount: number, couponCode: string) => {
    setAppliedCoupon({ couponId, discountAmount, couponCode });
    setError(null);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const getSelectedPaymentMethod = (): PaymentMethodInfo | null => {
    if (!selectedPaymentMethodId) return null;
    return paymentMethods.find(pm => pm.id === selectedPaymentMethodId) || null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (processing || disabled) {
      return;
    }

    const selectedMethod = getSelectedPaymentMethod();
    
    // If no payment method selected, show manual payment instructions
    if (!selectedMethod) {
      setShowInstructionsDialog(true);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      switch (selectedMethod.type) {
        case 'card':
          await processCardPayment(selectedMethod);
          break;
        case 'paypal':
          await processPayPalPayment(selectedMethod);
          break;
        case 'bank_transfer':
          await processBankTransferPayment(selectedMethod);
          break;
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      toast({
        title: "Payment failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const processCardPayment = async (paymentMethod: PaymentMethodInfo) => {
    if (isStripeEnabled() && stripe && elements) {
      // Real Stripe payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement && !paymentMethod.stripe_payment_method_id) {
        throw new Error('Card information required');
      }

      let stripePaymentMethodId = paymentMethod.stripe_payment_method_id;
      
      // If no saved payment method, create one from card element
      if (!stripePaymentMethodId && cardElement) {
        const { error: paymentMethodError, paymentMethod: newPaymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (paymentMethodError) {
          throw new Error(paymentMethodError.message);
        }

        stripePaymentMethodId = newPaymentMethod.id;
      }

      // Create customer if needed
      const customerResult = await StripeService.createCustomer({
        email: 'user@example.com', // This should come from auth context
        metadata: {
          community_id: communityId,
          plan_id: plan.id
        }
      });

      // Create subscription or payment intent
      const subscriptionResult = await StripeService.createSubscription(
        customerResult.customerId,
        billingCycle === 'yearly' ? plan.stripe_price_yearly! : plan.stripe_price_monthly!,
        {
          subscription_id: `sub_${Date.now()}`,
          community_id: communityId,
          plan_id: plan.id,
          coupon_id: appliedCoupon?.couponId || '',
          discount_amount: appliedCoupon?.discountAmount?.toString() || '0'
        }
      );

      if (!subscriptionResult.success) {
        throw new Error(subscriptionResult.error);
      }

      toast({
        title: "Payment successful!",
        description: `Welcome to ${plan.name}! Your subscription is now active.`
      });

      onSuccess(subscriptionResult.paymentId!, 'card');
    } else {
      // Mock payment for development
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (Math.random() > 0.1) {
        toast({
          title: "Payment successful!",
          description: `Welcome to ${plan.name}! Your subscription is now active.`
        });
        onSuccess(`mock_sub_${Date.now()}`, 'card');
      } else {
        throw new Error('Payment declined - insufficient funds');
      }
    }
  };

  const processPayPalPayment = async (paymentMethod: PaymentMethodInfo) => {
    const paypalResult = await PayPalService.createPayment({
      amount: finalAmount,
      currency: 'USD',
      description: `Subscription to ${plan.name}`,
      returnUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      metadata: {
        community_id: communityId,
        plan_id: plan.id,
        billing_cycle: billingCycle
      }
    });

    if (!paypalResult.success) {
      throw new Error(paypalResult.error);
    }

    // In a real implementation, you would redirect to PayPal
    // For now, we'll simulate the approval process
    if (paypalResult.approvalUrl) {
      // Simulate PayPal approval
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "PayPal payment successful!",
        description: `Welcome to ${plan.name}! Your subscription is now active.`
      });
      
      onSuccess(paypalResult.paymentId!, 'paypal');
    }
  };

  const processBankTransferPayment = async (paymentMethod: PaymentMethodInfo) => {
    // For bank transfers, we create a pending payment and show instructions
    const transferResult = await BankTransferService.submitBankTransferPayment({
      subscriptionId: `sub_${Date.now()}`,
      amount: finalAmount,
      currency: 'USD',
      bankTransferDetails: {
        senderName: 'User Name', // This should come from user profile
        senderAccount: paymentMethod.bank_account_last4 || 'Unknown',
        transferDate: new Date().toISOString(),
        bankName: paymentMethod.bank_name
      }
    });

    if (!transferResult.success) {
      throw new Error(transferResult.error);
    }

    toast({
      title: "Bank transfer submitted",
      description: "Your payment is pending verification. You'll receive confirmation once processed."
    });

    onSuccess(transferResult.paymentId!, 'bank_transfer');
  };

  const getPaymentButtonText = () => {
    if (processing) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      );
    }

    const selectedMethod = getSelectedPaymentMethod();
    
    if (!selectedMethod) {
      return 'View Payment Instructions';
    }

    switch (selectedMethod.type) {
      case 'card':
        return plan.trial_days > 0 ? 'Start Free Trial' : `Pay $${finalAmount.toFixed(2)}`;
      case 'paypal':
        return `Pay with PayPal - $${finalAmount.toFixed(2)}`;
      case 'bank_transfer':
        return 'Submit Bank Transfer';
      default:
        return `Pay $${finalAmount.toFixed(2)}`;
    }
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
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </CardTitle>
          <CardDescription>
            Subscribe to {plan.name} - {billingCycle} billing
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Plan Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{plan.name}</span>
              <Badge variant="secondary">{billingCycle}</Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              {plan.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{plan.features.length - 3} more features
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Coupon Input */}
          <CouponInput
            communityId={communityId}
            subscriptionAmount={baseAmount}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            disabled={processing}
          />

          <Separator />

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            communityId={communityId}
            selectedPaymentMethodId={selectedPaymentMethodId}
            onPaymentMethodSelect={setSelectedPaymentMethodId}
            amount={finalAmount}
            disabled={processing}
          />

          {/* Card Element for New Cards */}
          {getSelectedPaymentMethod()?.type === 'card' && !getSelectedPaymentMethod()?.stripe_payment_method_id && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Card Information
              </label>
              <div className="p-3 border rounded-md">
                <CardElement options={cardElementOptions} />
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Price Summary */}
          <div className="bg-muted/50 p-4 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${baseAmount.toFixed(2)}</span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({appliedCoupon.couponCode}):</span>
                <span>-${appliedCoupon.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${finalAmount.toFixed(2)}</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {billingCycle === 'yearly' ? 'Billed annually' : 'Billed monthly'}
              {plan.trial_days > 0 && (
                <span> • {plan.trial_days} day free trial</span>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Action Buttons */}
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={processing}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={processing || disabled}
                className="flex-1"
              >
                {getPaymentButtonText()}
              </Button>
            </div>
          </form>

          {/* Terms */}
          <div className="text-xs text-muted-foreground text-center">
            By completing this payment, you agree to our terms of service and privacy policy.
            {plan.trial_days > 0 && (
              <span> You can cancel anytime during your free trial.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions Dialog */}
      <PaymentInstructionsDialog
        open={showInstructionsDialog}
        onOpenChange={setShowInstructionsDialog}
        communityId={communityId}
        paymentType="bank_transfer"
        amount={finalAmount}
      />
    </>
  );
};

export const EnhancedPaymentForm: React.FC<EnhancedPaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default EnhancedPaymentForm;