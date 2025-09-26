import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield,
  DollarSign,
  CreditCard,
  Calendar,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  isSubscribed,
  onSubscribe
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSubscribe();
      toast({
        title: "Subscription successful!",
        description: `Welcome to ${community.name} premium membership`,
      });
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Premium Membership</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Unlock exclusive features and support the community
        </p>
      </div>

      {isSubscribed ? (
        <Card className="border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              You're a Premium Member!
            </CardTitle>
            <CardDescription>
              Thank you for supporting {community.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Next billing date</p>
                    <p className="text-sm text-gray-500">March 1, 2024</p>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              
              <Button variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pricing Card */}
          <Card className="border-2 border-yellow-400 dark:border-yellow-600 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-orange-400 text-black px-4 py-1 rounded-bl-lg">
              <span className="text-xs font-bold">BEST VALUE</span>
            </div>
            
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl">Premium Membership</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">
                  ${community.subscription_price || 9.99}
                </span>
                <span className="text-gray-500">/month</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-medium">{benefit.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button
                className="w-full h-12 text-lg bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                Cancel anytime. No hidden fees.
              </p>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-1">How does billing work?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You'll be charged monthly on the same date you subscribed. Cancel anytime from your settings.
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
                  We accept all major credit cards, debit cards, and PayPal.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};