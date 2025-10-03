import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { PatronService, MembershipTier } from '@/services/patronService';
import { SubscriptionService } from '@/services/subscriptionService';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  ShieldCheck 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface CardPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: MembershipTier;
  communityId: string;
  onSuccess: () => void;
}

const CardPaymentForm: React.FC<Omit<CardPaymentDialogProps, 'open' | 'onOpenChange'>> = ({
  tier,
  communityId,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(true);

  // Calculate revenue split
  const split = PatronService.calculateRevenueSplit(tier.price_monthly);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) throw new Error(pmError.message);

      // Save card if requested
      if (saveCard && paymentMethod) {
        await PatronService.savePaymentMethod(user.id, {
          card_brand: paymentMethod.card?.brand || 'unknown',
          card_last4: paymentMethod.card?.last4 || '0000',
          card_exp_month: paymentMethod.card?.exp_month || 12,
          card_exp_year: paymentMethod.card?.exp_year || 2025,
          stripe_payment_method_id: paymentMethod.id,
          is_default: true,
          is_verified: true,
        });
      }

      // Create subscription
      const subscription = await SubscriptionService.createMemberSubscription(
        {
          community_id: communityId,
          plan_id: tier.id,
          billing_cycle: 'monthly',
        },
        user.id
      );

      // Process payment with revenue split
      await PatronService.processMembershipPayment(
        subscription.id,
        tier.price_monthly,
        'card',
        paymentMethod?.card?.brand,
        paymentMethod?.card?.last4,
        paymentMethod?.id
      );

      setSucceeded(true);
      
      toast({
        title: 'Payment Successful!',
        description: `Welcome to ${tier.name}! You're now a patron.`,
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
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

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">You're All Set!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for becoming a patron! 💜
          </p>
        </div>
      </div>
    );
  }

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
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tier Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Membership Tier</p>
              <p className="text-xl font-bold">{tier.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">${tier.price_monthly}</p>
              <p className="text-sm text-gray-500">/month</p>
            </div>
          </div>

          {/* Revenue Split Display */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
              <div className="text-lg font-bold text-purple-600">
                ${split.creatorAmount}
              </div>
              <div className="text-xs text-gray-500">To Creator (70%)</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
              <div className="text-lg font-bold text-blue-600">
                ${split.platformFee}
              </div>
              <div className="text-xs text-gray-500">Platform Fee (30%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Input */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4" />
            Card Information
          </Label>
          <div className="border-2 rounded-lg p-4 bg-white dark:bg-gray-900 hover:border-purple-300 transition-colors">
            <CardElement options={cardElementOptions} />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Secured by Stripe • PCI compliant</span>
          </div>
        </div>

        {/* Accepted Cards */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">We accept:</span>
          <div className="flex gap-2">
            {['Visa', 'Mastercard', 'Amex', 'Discover'].map((card) => (
              <Badge key={card} variant="outline" className="text-xs">
                {card}
              </Badge>
            ))}
          </div>
        </div>

        {/* Save Card Option */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="save-card"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="save-card" className="text-sm cursor-pointer">
            Save card for future payments
          </Label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Your payment is secure and encrypted. You can cancel your membership anytime.
          By continuing, you agree to be charged ${tier.price_monthly} monthly.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Pay ${tier.price_monthly}/month
          </>
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        Recurring billing. Cancel anytime.
      </p>
    </form>
  );
};

export const CardPaymentDialog: React.FC<CardPaymentDialogProps> = (props) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Your Membership</DialogTitle>
        </DialogHeader>
        <Elements stripe={getStripe()}>
          <CardPaymentForm
            tier={props.tier}
            communityId={props.communityId}
            onSuccess={props.onSuccess}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};
