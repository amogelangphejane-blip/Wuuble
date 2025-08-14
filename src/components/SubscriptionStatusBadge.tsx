import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Crown, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  Gift,
  Calendar
} from 'lucide-react';
import { MemberSubscription, SubscriptionStatus } from '@/types/subscription';
import { format, formatDistanceToNow } from 'date-fns';

interface SubscriptionStatusBadgeProps {
  subscription?: MemberSubscription | null;
  status?: SubscriptionStatus | null;
  size?: 'sm' | 'default' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  subscription,
  status,
  size = 'default',
  showTooltip = true,
  className = ''
}) => {
  if (!subscription && !status) {
    return null;
  }

  const subscriptionStatus = subscription?.status || status?.status;
  const planName = subscription?.plan?.name || status?.plan_name;
  const isTrialActive = status?.is_trial || (subscription?.trial_end && new Date(subscription.trial_end) > new Date());
  const currentPeriodEnd = subscription?.current_period_end || status?.current_period_end;
  const trialEnd = subscription?.trial_end || status?.trial_end;

  const getBadgeConfig = () => {
    switch (subscriptionStatus) {
      case 'trial':
        return {
          variant: 'secondary' as const,
          icon: Gift,
          text: `${planName} Trial`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200'
        };
      case 'active':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          text: planName || 'Active',
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'past_due':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          text: 'Payment Due',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200'
        };
      case 'cancelled':
        return {
          variant: 'outline' as const,
          icon: XCircle,
          text: 'Cancelled',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200'
        };
      case 'expired':
        return {
          variant: 'outline' as const,
          icon: Clock,
          text: 'Expired',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200'
        };
      default:
        return null;
    }
  };

  const badgeConfig = getBadgeConfig();
  if (!badgeConfig) return null;

  const getTooltipContent = () => {
    const lines = [];
    
    if (planName) {
      lines.push(`Plan: ${planName}`);
    }
    
    if (isTrialActive && trialEnd) {
      const daysRemaining = Math.ceil((new Date(trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      lines.push(`Trial ends in ${daysRemaining} days`);
      lines.push(`Trial expires: ${format(new Date(trialEnd), 'MMM dd, yyyy')}`);
    } else if (currentPeriodEnd) {
      if (subscriptionStatus === 'active') {
        lines.push(`Next billing: ${format(new Date(currentPeriodEnd), 'MMM dd, yyyy')}`);
      } else if (subscriptionStatus === 'past_due') {
        lines.push(`Payment was due: ${format(new Date(currentPeriodEnd), 'MMM dd, yyyy')}`);
      }
    }
    
    return lines.join('\n');
  };

  const IconComponent = badgeConfig.icon;
  
  const badge = (
    <Badge 
      variant={badgeConfig.variant}
      className={`${badgeConfig.bgColor} ${badgeConfig.color} border ${className} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 
        size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-1'
      }`}
    >
      <IconComponent className={`${
        size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
      } mr-1`} />
      {badgeConfig.text}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm whitespace-pre-line">
            {getTooltipContent()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface SubscriptionStatusIndicatorProps {
  subscription?: MemberSubscription | null;
  status?: SubscriptionStatus | null;
  compact?: boolean;
  className?: string;
}

export const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({
  subscription,
  status,
  compact = false,
  className = ''
}) => {
  if (!subscription && !status) {
    return null;
  }

  const subscriptionStatus = subscription?.status || status?.status;
  const planName = subscription?.plan?.name || status?.plan_name;
  const isTrialActive = status?.is_trial || (subscription?.trial_end && new Date(subscription.trial_end) > new Date());
  const currentPeriodEnd = subscription?.current_period_end || status?.current_period_end;
  const trialEnd = subscription?.trial_end || status?.trial_end;

  if (compact) {
    return (
      <SubscriptionStatusBadge 
        subscription={subscription}
        status={status}
        size="sm"
        className={className}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SubscriptionStatusBadge 
        subscription={subscription}
        status={status}
        showTooltip={false}
      />
      
      <div className="text-sm text-muted-foreground">
        {isTrialActive && trialEnd ? (
          <span>
            Trial expires {formatDistanceToNow(new Date(trialEnd), { addSuffix: true })}
          </span>
        ) : currentPeriodEnd && subscriptionStatus === 'active' ? (
          <span>
            Next billing {formatDistanceToNow(new Date(currentPeriodEnd), { addSuffix: true })}
          </span>
        ) : currentPeriodEnd && subscriptionStatus === 'past_due' ? (
          <span className="text-yellow-600">
            Payment overdue since {formatDistanceToNow(new Date(currentPeriodEnd), { addSuffix: true })}
          </span>
        ) : null}
      </div>
    </div>
  );
};