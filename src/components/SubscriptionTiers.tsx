import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  Crown, 
  Star, 
  Clock, 
  CreditCard, 
  Shield,
  Zap,
  Gift,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/hooks/useAuth';
import { PricingTier, SubscriptionPlan } from '@/types/subscription';
import { formatDistanceToNow, addDays, format } from 'date-fns';
import { StripePaymentForm } from './StripePaymentForm';

interface SubscriptionTiersProps {
  communityId: string;
  communityName: string;
}

export const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({
  communityId,
  communityName
}) => {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const {
    subscriptionPlans,
    userSubscription,
    subscriptionStatus,
    plansLoading,
    subscribe,
    isSubscribing,
    hasActiveSubscription,
    isOnTrial,
    cancelSubscription,
    isCancelling
  } = useSubscriptions(communityId);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!user) {
      // Redirect to auth or show login modal
      return;
    }

    setSelectedPlan(plan);
    setBillingCycle(isYearly ? 'yearly' : 'monthly');
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = (subscriptionId: string) => {
    if (!selectedPlan) return;

    subscribe({
      community_id: communityId,
      plan_id: selectedPlan.id,
      billing_cycle: billingCycle
    });

    setShowPaymentDialog(false);
    setSelectedPlan(null);
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
    setSelectedPlan(null);
  };

  const handleCancelSubscription = () => {
    if (userSubscription?.id) {
      cancelSubscription(userSubscription.id);
    }
  };

  const getPricingTiers = (): PricingTier[] => {
    if (!subscriptionPlans) return [];

    return subscriptionPlans.map((plan, index) => ({
      plan,
      isPopular: index === 1, // Middle plan is popular
      isCurrentPlan: userSubscription?.plan_id === plan.id,
      savings: plan.price_monthly && plan.price_yearly 
        ? Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)
        : undefined
    }));
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (isYearly && plan.price_yearly) {
      return { amount: plan.price_yearly, period: 'year' };
    }
    if (plan.price_monthly) {
      return { amount: plan.price_monthly, period: 'month' };
    }
    return { amount: 0, period: 'free' };
  };

  const getTrialEndDate = () => {
    if (subscriptionStatus?.trial_end) {
      return new Date(subscriptionStatus.trial_end);
    }
    return null;
  };

  const getTrialDaysRemaining = () => {
    const trialEnd = getTrialEndDate();
    if (!trialEnd) return 0;
    
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pricingTiers = getPricingTiers();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground text-lg">
          Join {communityName} and unlock exclusive features
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : ''}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : ''}>
            Yearly
          </Label>
          {pricingTiers.some(tier => tier.savings) && (
            <Badge variant="secondary" className="ml-2">
              Save up to {Math.max(...pricingTiers.map(tier => tier.savings || 0))}%
            </Badge>
          )}
        </div>
      </div>

      {/* Current Subscription Status */}
      {hasActiveSubscription && (
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                {isOnTrial ? (
                  <span>
                    You're on a free trial of the {subscriptionStatus?.plan_name} plan. 
                    {getTrialDaysRemaining() > 0 && (
                      <span className="font-semibold">
                        {' '}{getTrialDaysRemaining()} days remaining.
                      </span>
                    )}
                  </span>
                ) : (
                  <span>
                    You have an active {subscriptionStatus?.plan_name} subscription.
                    {subscriptionStatus?.current_period_end && (
                      <span>
                        {' '}Next billing: {format(new Date(subscriptionStatus.current_period_end), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {userSubscription?.status === 'active' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Trial Progress */}
      {isOnTrial && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Free Trial Progress</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Days remaining</span>
                <span className="font-semibold">{getTrialDaysRemaining()} days</span>
              </div>
              <Progress 
                value={(getTrialDaysRemaining() / (selectedPlan?.trial_days || 1)) * 100} 
                className="h-2"
              />
              <p className="text-xs text-orange-700">
                Your trial ends on {getTrialEndDate() && format(getTrialEndDate()!, 'MMMM dd, yyyy')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pricingTiers.map((tier) => {
          const price = getPrice(tier.plan);
          const isFree = price.amount === 0;
          
          return (
            <Card 
              key={tier.plan.id} 
              className={`relative ${tier.isPopular ? 'border-primary shadow-lg' : ''} ${tier.isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {tier.isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{tier.plan.name}</CardTitle>
                <CardDescription>{tier.plan.description}</CardDescription>
                
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    {isFree ? (
                      'Free'
                    ) : (
                      <>
                        ${price.amount}
                        <span className="text-base font-normal text-muted-foreground">
                          /{price.period}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {tier.savings && isYearly && (
                    <Badge variant="outline" className="text-green-600">
                      Save {tier.savings}%
                    </Badge>
                  )}

                  {tier.plan.trial_days > 0 && !tier.isCurrentPlan && (
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Gift className="h-4 w-4" />
                      {tier.plan.trial_days} day free trial
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {tier.plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {tier.plan.max_members && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Up to {tier.plan.max_members} members</span>
                    </div>
                  )}
                </div>

                <Separator />

                <Button 
                  className="w-full" 
                  variant={tier.isPopular ? 'default' : 'outline'}
                  disabled={tier.isCurrentPlan || isSubscribing}
                  onClick={() => handleSubscribe(tier.plan)}
                >
                  {tier.isCurrentPlan ? (
                    'Current Plan'
                  ) : tier.plan.trial_days > 0 ? (
                    `Start ${tier.plan.trial_days} Day Trial`
                  ) : isFree ? (
                    'Get Started'
                  ) : (
                    `Subscribe ${isYearly ? 'Yearly' : 'Monthly'}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              Subscribe to {selectedPlan?.name} and start enjoying premium features
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 pt-0">
            {selectedPlan && (
              <StripePaymentForm
                plan={selectedPlan}
                communityId={communityId}
                billingCycle={billingCycle}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                disabled={isSubscribing}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Features Comparison */}
      {pricingTiers.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Compare Features</CardTitle>
            <CardDescription>
              See what's included with each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Feature</th>
                    {pricingTiers.map((tier) => (
                      <th key={tier.plan.id} className="text-center py-2 px-4">
                        {tier.plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Get all unique features */}
                  {Array.from(new Set(pricingTiers.flatMap(tier => tier.plan.features))).map((feature) => (
                    <tr key={feature} className="border-t">
                      <td className="py-2 text-sm">{feature}</td>
                      {pricingTiers.map((tier) => (
                        <td key={tier.plan.id} className="text-center py-2 px-4">
                          {tier.plan.features.includes(feature) ? (
                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};