import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CreditCard, 
  Download, 
  Settings,
  Users,
  TrendingUp,
  AlertCircle,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionPlanManager } from '@/components/SubscriptionPlanManager';
import { SubscriptionTiers } from '@/components/SubscriptionTiers';
import { SubscriptionStatusIndicator } from '@/components/SubscriptionStatusBadge';
import { ModernHeader } from '@/components/ModernHeader';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function CommunitySubscriptions() {
  const { id: communityId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [community, setCommunity] = React.useState<any>(null);
  const [isCreator, setIsCreator] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const {
    subscriptionPlans,
    userSubscription,
    subscriptionStatus,
    billingHistory,
    hasActiveSubscription,
    isOnTrial
  } = useSubscriptions(communityId);

  // Fetch community data
  React.useEffect(() => {
    const fetchCommunity = async () => {
      if (!communityId) return;
      
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .eq('id', communityId)
          .single();

        if (error) throw error;
        
        setCommunity(data);
        setIsCreator(data.creator_id === user?.id);
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ModernHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background">
        <ModernHeader />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Community not found or you don't have access to it.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/communities/${communityId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">
              {community.name} • {isCreator ? 'Admin View' : 'Member View'}
            </p>
          </div>
        </div>

        {/* Current Subscription Status */}
        {hasActiveSubscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Your Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionStatusIndicator 
                subscription={userSubscription}
                status={subscriptionStatus}
              />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={isCreator ? "manage" : "plans"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Available Plans</TabsTrigger>
            {isCreator && <TabsTrigger value="manage">Manage Plans</TabsTrigger>}
            <TabsTrigger value="billing">Billing & History</TabsTrigger>
          </TabsList>

          {/* Available Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            {subscriptionPlans && subscriptionPlans.length > 0 ? (
              <SubscriptionTiers 
                communityId={communityId!}
                communityName={community.name}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No subscription plans available</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {isCreator 
                      ? "Create subscription plans to start monetizing your community."
                      : "The community owner hasn't set up subscription plans yet."
                    }
                  </p>
                  {isCreator && (
                    <Button onClick={() => document.querySelector('[value="manage"]')?.click()}>
                      <Settings className="h-4 w-4 mr-2" />
                      Set Up Plans
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Plans Tab (Admin Only) */}
          {isCreator && (
            <TabsContent value="manage" className="space-y-6">
              <SubscriptionPlanManager 
                communityId={communityId!}
                isCreator={isCreator}
              />
            </TabsContent>
          )}

          {/* Billing & History Tab */}
          <TabsContent value="billing" className="space-y-6">
            {hasActiveSubscription ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Subscription Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Subscription</CardTitle>
                    <CardDescription>
                      Your active subscription details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userSubscription && (
                      <>
                        <div className="flex justify-between">
                          <span>Plan:</span>
                          <span className="font-semibold">{userSubscription.plan?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <SubscriptionStatusIndicator 
                            subscription={userSubscription}
                            status={subscriptionStatus}
                            compact
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Billing Cycle:</span>
                          <span className="font-semibold capitalize">{userSubscription.billing_cycle}</span>
                        </div>
                        {userSubscription.current_period_end && (
                          <div className="flex justify-between">
                            <span>
                              {isOnTrial ? 'Trial Ends:' : 'Next Billing:'}
                            </span>
                            <span className="font-semibold">
                              {format(new Date(userSubscription.current_period_end), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Amount:</span>
                          <span>
                            ${userSubscription.billing_cycle === 'yearly' 
                              ? userSubscription.plan?.price_yearly 
                              : userSubscription.plan?.price_monthly
                            }/{userSubscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Payment History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Payment History
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Your recent payments and invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billingHistory && billingHistory.payments.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Total paid: <span className="font-semibold">${billingHistory.total_paid.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {billingHistory.payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">${payment.amount.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                                </div>
                              </div>
                              <Badge 
                                variant={payment.status === 'completed' ? 'default' : 
                                        payment.status === 'failed' ? 'destructive' : 'secondary'}
                              >
                                {payment.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No payment history available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You don't have an active subscription to view billing information.
                  </p>
                  <Button onClick={() => document.querySelector('[value="plans"]')?.click()}>
                    <Crown className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}