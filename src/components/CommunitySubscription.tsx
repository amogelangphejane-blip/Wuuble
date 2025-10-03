import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield,
  DollarSign,
  CreditCard,
  Calendar,
  Gift,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionCheckout } from './SubscriptionCheckout';
import { SubscriptionPlan, MemberSubscription } from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CommunitySubscriptionProps {
  community: {
    id: string;
    name: string;
    subscription_price?: number;
  };
  isSubscribed: boolean;
  onSubscribe: () => void;
}

export const CommunitySubscription: React.FC<CommunitySubscriptionProps> = ({
  community,
  isSubscribed: initialSubscribed,
  onSubscribe
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<MemberSubscription | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [community.id]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      // Load subscription plans
      const plansData = await SubscriptionService.getSubscriptionPlans(community.id);
      setPlans(plansData);

      // Load user's subscription if any
      const subscriptionData = await SubscriptionService.getUserSubscription(community.id, user.id);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan, cycle: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setBillingCycle(cycle);
    setShowCheckout(true);
  };

  const handleSubscriptionSuccess = async (subscriptionId: string) => {
    setShowCheckout(false);
    await loadSubscriptionData();
    onSubscribe();
    toast({
      title: 'Success!',
      description: 'Your subscription is now active',
    });
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      await SubscriptionService.cancelSubscription(subscription.id);
      await loadSubscriptionData();
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled. You can continue using premium features until the end of your billing period.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  const benefits = [
    {
      icon: Crown,
      title: "Exclusive Content",
      description: "Access premium discussions and resources"
    },
    {
      icon: Star,
      title: "Priority Support",
      description: "Get faster responses from moderators"
    },
    {
      icon: Zap,
      title: "Early Access",
      description: "Be first to join exclusive events"
    },
    {
      icon: Shield,
      title: "Special Badge",
      description: "Display your premium member status"
    },
    {
      icon: Gift,
      title: "Monthly Perks",
      description: "Receive special rewards and bonuses"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Community Subscription</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {subscription ? 'Manage your subscription' : 'Choose a plan to support the community'}
        </p>
      </div>

      {subscription ? (
        <Card className="border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              {subscription.status === 'trial' ? "You're on a Free Trial!" : "You're a Premium Member!"}
            </CardTitle>
            <CardDescription>
              {subscription.plan?.name} - {subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {subscription.status === 'trial' ? 'Trial ends' : 'Next billing date'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(subscription.status === 'trial' && subscription.trial_end 
                          ? subscription.trial_end 
                          : subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    subscription.status === 'active' ? 'default' :
                    subscription.status === 'trial' ? 'secondary' :
                    subscription.status === 'cancelled' ? 'destructive' :
                    'outline'
                  }>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>

                {subscription.plan && (
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Plan cost</p>
                        <p className="text-sm text-gray-500">
                          ${subscription.billing_cycle === 'monthly' 
                            ? subscription.plan.price_monthly 
                            : subscription.plan.price_yearly}/{subscription.billing_cycle === 'monthly' ? 'month' : 'year'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {subscription.status !== 'cancelled' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCancelSubscription}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No subscription plans available for this community yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Billing Cycle Toggle */}
              <div className="flex justify-center">
                <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')} className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">
                      Yearly
                      {plans.some(p => p.price_yearly && p.price_monthly && p.price_yearly < p.price_monthly * 12) && (
                        <Badge variant="secondary" className="ml-2">Save up to 20%</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Pricing Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                  const savings = plan.price_monthly && plan.price_yearly 
                    ? Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)
                    : 0;

                  return (
                    <Card key={plan.id} className="border-2 hover:border-yellow-400 transition-colors">
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        {plan.description && (
                          <CardDescription>{plan.description}</CardDescription>
                        )}
                        <div className="mt-4">
                          <span className="text-4xl font-bold">${price || 0}</span>
                          <span className="text-gray-500">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                          {billingCycle === 'yearly' && savings > 0 && (
                            <Badge variant="secondary" className="ml-2">Save {savings}%</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {plan.trial_days > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm font-medium">
                            {plan.trial_days} days free trial
                          </div>
                        )}

                        <div className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => handleSelectPlan(plan, billingCycle)}
                        >
                          {plan.trial_days > 0 ? 'Start Free Trial' : 'Subscribe'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-1">How does billing work?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You'll be charged on the same date each billing cycle. Cancel anytime from your subscription settings.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Can I cancel anytime?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes! You can cancel your subscription at any time and continue to access premium features until the end of your billing period.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">What payment methods are accepted?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We accept all major credit cards via Stripe's secure payment processing.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <Elements stripe={getStripe()}>
              <SubscriptionCheckout
                plan={selectedPlan}
                communityId={community.id}
                billingCycle={billingCycle}
                onSuccess={handleSubscriptionSuccess}
                onCancel={() => setShowCheckout(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};