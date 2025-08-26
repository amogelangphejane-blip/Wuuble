import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  Gift, 
  X,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PaymentReminder, MemberSubscription } from '@/types/subscription';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PaymentService } from '@/services/paymentService';

interface PaymentReminderSystemProps {
  communityId?: string;
  compact?: boolean;
}

export const PaymentReminderSystem: React.FC<PaymentReminderSystemProps> = ({
  communityId,
  compact = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<(PaymentReminder & { subscription: MemberSubscription })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchReminders();
  }, [user, communityId]);

  const fetchReminders = async () => {
    if (!user) return;

    try {
      // First, get user's subscriptions
      let subscriptionsQuery = supabase
        .from('community_member_subscriptions')
        .select(`
          id,
          user_id,
          community_id,
          plan:community_subscription_plans(*),
          community:communities(name)
        `)
        .eq('user_id', user.id);

      if (communityId) {
        subscriptionsQuery = subscriptionsQuery.eq('community_id', communityId);
      }

      const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

      if (subscriptionsError) throw subscriptionsError;
      if (!subscriptions?.length) {
        setReminders([]);
        return;
      }

      // Then get reminders for those subscriptions
      const subscriptionIds = subscriptions.map(s => s.id);
      
      const { data: reminders, error: remindersError } = await supabase
        .from('payment_reminders')
        .select('*')
        .in('subscription_id', subscriptionIds)
        .gte('due_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('sent_at', { ascending: false });

      if (remindersError) throw remindersError;

      // Manually join the data
      const reminderWithSubscriptions = (reminders || []).map(reminder => ({
        ...reminder,
        subscription: subscriptions.find(s => s.id === reminder.subscription_id)
      })).filter(reminder => reminder.subscription); // Filter out any orphaned reminders

      // Filter out dismissed reminders
      const activeReminders = reminderWithSubscriptions.filter(
        reminder => !dismissedReminders.includes(reminder.id)
      );

      setReminders(activeReminders);
    } catch (error) {
      console.error('Error fetching payment reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissReminder = (reminderId: string) => {
    setDismissedReminders(prev => [...prev, reminderId]);
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const getReminderConfig = (reminder: PaymentReminder) => {
    switch (reminder.reminder_type) {
      case 'upcoming':
        return {
          icon: Clock,
          variant: 'default' as const,
          title: 'Payment Due Soon',
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'overdue':
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          title: 'Payment Overdue',
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600'
        };
      case 'trial_ending':
        return {
          icon: Gift,
          variant: 'default' as const,
          title: 'Trial Ending Soon',
          bgColor: 'bg-orange-50 border-orange-200',
          iconColor: 'text-orange-600'
        };
      default:
        return {
          icon: Clock,
          variant: 'default' as const,
          title: 'Payment Reminder',
          bgColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600'
        };
    }
  };

  const handlePayNow = async (reminder: PaymentReminder & { subscription: MemberSubscription }) => {
    const subscription = reminder.subscription;
    const amount = subscription.billing_cycle === 'yearly' 
      ? subscription.plan?.price_yearly 
      : subscription.plan?.price_monthly;

    if (!amount) {
      toast({
        title: "Error",
        description: "Unable to determine payment amount",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Payment Processing",
      description: "Processing your payment...",
    });

    try {
      const result = await PaymentService.processPayment(subscription.id, amount);
      
      if (result.success) {
        dismissReminder(reminder.id);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        // Refresh the reminders list
        fetchReminders();
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Payment processing failed. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return compact ? null : (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return null;
  }

  if (compact) {
    // Show only the most urgent reminder as a small alert
    const mostUrgent = reminders.sort((a, b) => {
      const urgencyOrder = { overdue: 3, trial_ending: 2, upcoming: 1 };
      return urgencyOrder[b.reminder_type] - urgencyOrder[a.reminder_type];
    })[0];

    if (!mostUrgent) return null;

    const config = getReminderConfig(mostUrgent);
    const IconComponent = config.icon;

    return (
      <Alert className={`${config.bgColor} mb-4`}>
        <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            {config.title} - {mostUrgent.subscription.plan?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissReminder(mostUrgent.id)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Reminders</h3>
      
      {reminders.map((reminder) => {
        const config = getReminderConfig(reminder);
        const IconComponent = config.icon;
        const subscription = reminder.subscription;
        
        return (
          <Card key={reminder.id} className={`${config.bgColor} border`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                  {config.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissReminder(reminder.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {subscription.community?.name} • {subscription.plan?.name}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  {reminder.reminder_type === 'trial_ending' ? (
                    <>
                      <div>Your free trial ends {formatDistanceToNow(new Date(reminder.due_date), { addSuffix: true })}</div>
                      <div className="text-muted-foreground">
                        Trial expires: {format(new Date(reminder.due_date), 'MMM dd, yyyy')}
                      </div>
                    </>
                  ) : reminder.reminder_type === 'overdue' ? (
                    <>
                      <div>Payment was due {formatDistanceToNow(new Date(reminder.due_date), { addSuffix: true })}</div>
                      <div className="text-muted-foreground">
                        Due date: {format(new Date(reminder.due_date), 'MMM dd, yyyy')}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>Payment due {formatDistanceToNow(new Date(reminder.due_date), { addSuffix: true })}</div>
                      <div className="text-muted-foreground">
                        Due date: {format(new Date(reminder.due_date), 'MMM dd, yyyy')}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="font-semibold">
                    ${subscription.billing_cycle === 'yearly' 
                      ? subscription.plan?.price_yearly 
                      : subscription.plan?.price_monthly
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {subscription.billing_cycle}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {reminder.reminder_type !== 'trial_ending' && (
                  <Button
                    onClick={() => handlePayNow(reminder)}
                    size="sm"
                    className="flex-1"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to subscription management
                    window.location.href = `/communities/${subscription.community_id}/subscriptions`;
                  }}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Hook for getting reminder count
export const usePaymentReminders = (communityId?: string) => {
  const { user } = useAuth();
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchReminderCount = async () => {
      try {
        // First get user's subscription IDs
        let subscriptionsQuery = supabase
          .from('community_member_subscriptions')
          .select('id')
          .eq('user_id', user.id);

        if (communityId) {
          subscriptionsQuery = subscriptionsQuery.eq('community_id', communityId);
        }

        const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

        if (subscriptionsError) throw subscriptionsError;
        if (!subscriptions?.length) {
          setReminderCount(0);
          return;
        }

        const subscriptionIds = subscriptions.map(s => s.id);

        const { count, error } = await supabase
          .from('payment_reminders')
          .select('id', { count: 'exact', head: true })
          .in('subscription_id', subscriptionIds)
          .gte('due_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;
        setReminderCount(count || 0);
      } catch (error) {
        console.error('Error fetching reminder count:', error);
      }
    };

    fetchReminderCount();
  }, [user, communityId]);

  return reminderCount;
};