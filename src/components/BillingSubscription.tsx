import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Calendar, 
  DollarSign,
  Check,
  Crown,
  Star,
  Shield,
  Zap,
  Download,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface BillingSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_account';
  last_four: string;
  brand?: string;
  is_default: boolean;
}

export const BillingSubscription: React.FC<BillingSubscriptionProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchBillingData();
    }
  }, [isOpen, user]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // Fetch subscription data
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      if (subData) {
        setSubscription(subData);
      }

      // Fetch payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false });

      if (paymentError && paymentError.code !== 'PGRST116') {
        throw paymentError;
      }

      if (paymentData) {
        setPaymentMethods(paymentData);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription({ ...subscription, status: 'cancelled' });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully",
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const subscriptionPlans = [
    {
      name: 'Free',
      price: 0,
      interval: 'forever',
      features: [
        'Join up to 5 communities',
        'Basic discussion features',
        'Limited event access',
        'Community support'
      ],
      icon: Shield,
      current: !subscription || subscription.plan_name === 'free'
    },
    {
      name: 'Pro',
      price: 9.99,
      interval: 'month',
      features: [
        'Unlimited communities',
        'Advanced discussion features',
        'Full event access',
        'Priority support',
        'Custom profile themes'
      ],
      icon: Star,
      current: subscription?.plan_name === 'pro'
    },
    {
      name: 'Premium',
      price: 19.99,
      interval: 'month',
      features: [
        'Everything in Pro',
        'Create unlimited communities',
        'Advanced analytics',
        'White-label options',
        'Dedicated support'
      ],
      icon: Crown,
      current: subscription?.plan_name === 'premium'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Billing & Subscription</span>
          </DialogTitle>
          <DialogDescription>
            Manage your subscription, payment methods, and billing history
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>Current Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold capitalize">{subscription.plan_name} Plan</h3>
                        <p className="text-gray-600">
                          {formatAmount(subscription.amount, subscription.currency)}/{subscription.interval}
                        </p>
                      </div>
                      <Badge className={getStatusColor(subscription.status)}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Current Period</p>
                        <p className="font-medium">
                          {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Next Billing Date</p>
                        <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setShowUpgrade(true)}>
                        Change Plan
                      </Button>
                      {subscription.status === 'active' && (
                        <Button variant="outline" onClick={handleCancelSubscription}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Free Plan</h3>
                    <p className="text-gray-600 mb-4">You're currently on the free plan</p>
                    <Button onClick={() => setShowUpgrade(true)}>
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {method.brand ? `${method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ` : ''}
                              **** {method.last_four}
                            </p>
                            {method.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No payment methods added</p>
                    <Button variant="outline">
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Billing History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No billing history available</p>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Plans Modal */}
            {showUpgrade && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                    <Button variant="outline" onClick={() => setShowUpgrade(false)}>
                      Close
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subscriptionPlans.map((plan) => (
                      <Card key={plan.name} className={plan.current ? 'border-blue-500 bg-blue-50' : ''}>
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <plan.icon className="w-6 h-6" />
                            <CardTitle>{plan.name}</CardTitle>
                          </div>
                          <div>
                            <span className="text-3xl font-bold">
                              ${plan.price}
                            </span>
                            <span className="text-gray-600">/{plan.interval}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full" 
                            variant={plan.current ? "outline" : "default"}
                            disabled={plan.current}
                          >
                            {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};