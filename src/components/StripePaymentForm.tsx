import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';
import { CouponInput } from './CouponInput';
import { StripeService } from '@/services/stripeService';
import { isStripeEnabled } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  plan: SubscriptionPlan;
  communityId: string;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (subscriptionId: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const PaymentFormContent: React.FC<StripePaymentFormProps> = ({
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

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || processing || disabled) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      if (isStripeEnabled()) {
        // Real Stripe payment processing
        await processStripePayment(cardElement);
      } else {
        // Mock payment processing for development
        await processMockPayment();
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

  const processStripePayment = async (cardElement: any) => {
    if (!stripe) throw new Error('Stripe not loaded');

    // Create payment method
    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (paymentMethodError) {
      throw new Error(paymentMethodError.message);
    }

    // Create customer if needed
    const customerResult = await StripeService.createCustomer({
      email: 'user@example.com', // This should come from auth context
      metadata: {
        community_id: communityId,
        plan_id: plan.id
      }
    });

    // Create subscription
    const subscriptionResult = await StripeService.createSubscription(
      customerResult.customerId,
      billingCycle === 'yearly' ? plan.stripe_price_yearly! : plan.stripe_price_monthly!,
      {
        subscription_id: `sub_${Date.now()}`, // This would be the actual subscription ID from your database
        community_id: communityId,
        plan_id: plan.id,
        coupon_id: appliedCoupon?.couponId || '',
        discount_amount: appliedCoupon?.discountAmount?.toString() || '0'
      }
    );

    if (!subscriptionResult.success) {
      throw new Error(subscriptionResult.error);
    }

    // Handle successful payment
    toast({
      title: "Payment successful!",
      description: `Welcome to ${plan.name}! Your subscription is now active.`
    });

    onSuccess(subscriptionResult.paymentId!);
  };

  const processMockPayment = async () => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      toast({
        title: "Payment successful!",
        description: `Welcome to ${plan.name}! Your subscription is now active.`
      });
      onSuccess(`mock_sub_${Date.now()}`);
    } else {
      throw new Error('Payment declined - insufficient funds');
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
    <Card className="w-full max-w-md mx-auto">
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

        {/* Payment Method */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Method
            </label>
            <div className="p-3 border rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

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
              disabled={!stripe || processing || disabled}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {plan.trial_days > 0 ? 'Start Free Trial' : `Pay $${finalAmount.toFixed(2)}`}
                </>
              )}
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
  );
};

export const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default StripePaymentForm;