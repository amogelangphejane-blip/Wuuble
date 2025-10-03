import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';
import { SubscriptionService } from '@/services/subscriptionService';
import { StripeService } from '@/services/stripeService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionCheckoutProps {
  plan: SubscriptionPlan;
  communityId: string;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (subscriptionId: string) => void;
  onCancel: () => void;
  couponId?: string;
}

export const SubscriptionCheckout: React.FC<SubscriptionCheckoutProps> = ({
  plan,
  communityId,
  billingCycle,
  onSuccess,
  onCancel,
  couponId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  const amount = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

  useEffect(() => {
    // Get or create Stripe customer
    const setupCustomer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // Check if user already has a Stripe customer ID in user_subscriptions
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', user.id)
          .single();

        if (existingSubscription?.stripe_customer_id) {
          setStripeCustomerId(existingSubscription.stripe_customer_id);
        } else {
          // Create new Stripe customer
          const { customerId } = await StripeService.createCustomer({
            email: user.email!,
            name: user.user_metadata?.full_name || user.email,
            metadata: {
              user_id: user.id,
            },
          });
          setStripeCustomerId(customerId);
        }
      } catch (error) {
        console.error('Error setting up customer:', error);
      }
    };

    setupCustomer();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // For trial periods, we just verify the card and create the subscription
      if (plan.trial_days > 0) {
        // Create subscription with trial
        const subscription = await SubscriptionService.createMemberSubscription(
          {
            community_id: communityId,
            plan_id: plan.id,
            billing_cycle: billingCycle,
          },
          user.id,
          stripeCustomerId || undefined,
          couponId
        );

        setSucceeded(true);
        toast({
          title: 'Trial Started!',
          description: `Your ${plan.trial_days}-day trial has begun. You won't be charged until the trial ends.`,
        });

        setTimeout(() => {
          onSuccess(subscription.id);
        }, 1500);
        return;
      }

      // For immediate payment
      if (!amount) {
        throw new Error('Invalid plan amount');
      }

      // Create payment intent
      const paymentResult = await StripeService.createPaymentIntent({
        subscriptionId: 'temp_' + Date.now(), // Will be updated after subscription creation
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        customerId: stripeCustomerId || undefined,
        metadata: {
          community_id: communityId,
          plan_id: plan.id,
          user_id: user.id,
        },
      });

      if (!paymentResult.success || !paymentResult.clientSecret) {
        throw new Error(paymentResult.error || 'Payment intent creation failed');
      }

      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentResult.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user.email,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Create subscription in database
        const subscription = await SubscriptionService.createMemberSubscription(
          {
            community_id: communityId,
            plan_id: plan.id,
            billing_cycle: billingCycle,
          },
          user.id,
          stripeCustomerId || undefined,
          couponId
        );

        // Create payment record
        await SubscriptionService.createPaymentRecord({
          subscription_id: subscription.id,
          amount: amount,
          currency: 'usd',
          status: 'completed',
          payment_method: 'card',
          external_payment_id: paymentIntent.id,
          paid_at: new Date().toISOString(),
          due_date: subscription.current_period_end,
        });

        setSucceeded(true);
        toast({
          title: 'Subscription Activated!',
          description: `Welcome to ${plan.name}! Your subscription is now active.`,
        });

        setTimeout(() => {
          onSuccess(subscription.id);
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during payment processing';
      setError(errorMessage);
      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
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

  if (succeeded) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <div>
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                {plan.trial_days > 0 ? 'Trial Started!' : 'Payment Successful!'}
              </h3>
              <p className="text-green-700 dark:text-green-300 mt-2">
                {plan.trial_days > 0 
                  ? `Your ${plan.trial_days}-day trial has begun.`
                  : 'Your subscription is now active.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          {plan.trial_days > 0 
            ? `Start your ${plan.trial_days}-day free trial. No charge until ${new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000).toLocaleDateString()}.`
            : `You'll be charged $${amount} ${billingCycle === 'monthly' ? 'per month' : 'per year'}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{plan.name}</span>
              <span className="font-bold">${amount}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Billing cycle</span>
              <span className="capitalize">{billingCycle}</span>
            </div>
            {plan.trial_days > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Free trial</span>
                <span>{plan.trial_days} days</span>
              </div>
            )}
          </div>

          {/* Card Input */}
          <div className="space-y-2">
            <Label>Card Information</Label>
            <div className="border rounded-lg p-3 bg-white dark:bg-gray-900">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
              disabled={!stripe || processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {plan.trial_days > 0 ? 'Start Free Trial' : `Pay $${amount}`}
                </>
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <p className="text-xs text-center text-gray-500">
            Your payment information is secure and encrypted. We never store your card details.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
