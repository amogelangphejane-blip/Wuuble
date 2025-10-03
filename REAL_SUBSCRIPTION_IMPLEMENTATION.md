# Real Subscription Feature Implementation

## Overview

This document describes the implementation of a **real, production-ready subscription system** for communities using Stripe as the payment processor. The system includes:

- ✅ Real Stripe payment processing
- ✅ Database-backed subscription management
- ✅ Webhook handling for subscription events
- ✅ Trial periods support
- ✅ Multiple billing cycles (monthly/yearly)
- ✅ Subscription cancellation
- ✅ Payment history tracking
- ✅ Real-time subscription status updates

## Architecture

### Components

1. **Frontend Components**
   - `CommunitySubscription.tsx` - Main subscription UI with plan selection
   - `SubscriptionCheckout.tsx` - Stripe Elements payment form
   - `useSubscription` hook - Subscription state management

2. **Backend Services**
   - `SubscriptionService` - Database operations for subscriptions
   - `StripeService` - Stripe API integration
   - `WebhookService` - Stripe webhook event processing

3. **Database Tables**
   - `community_subscription_plans` - Subscription plan definitions
   - `community_member_subscriptions` - User subscriptions
   - `subscription_payments` - Payment history
   - `payment_reminders` - Payment notification tracking

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Stripe Keys (Get from https://dashboard.stripe.com/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (backend only)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
```

### 2. Stripe Dashboard Setup

1. **Create Stripe Account**: Go to https://stripe.com and create an account

2. **Enable Test Mode**: Use test mode keys for development

3. **Configure Webhooks**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events to listen to:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `customer.subscription.trial_will_end`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

4. **Copy Webhook Secret**: Save the webhook signing secret to your environment variables

### 3. Database Migration

The subscription tables are already created by the migration:
```
supabase/migrations/20250125000000_add_community_subscriptions.sql
```

Additional features from:
- `20250202000001_add_coupons_and_discounts.sql` - Coupon support
- `20250203000000_add_payment_methods.sql` - Payment method tracking

### 4. Test Stripe Integration

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## Usage Guide

### For Community Owners

#### Creating Subscription Plans

```typescript
import { SubscriptionService } from '@/services/subscriptionService';

// Create a subscription plan
const plan = await SubscriptionService.createSubscriptionPlan({
  community_id: 'your-community-id',
  name: 'Premium',
  description: 'Premium membership with exclusive benefits',
  price_monthly: 9.99,
  price_yearly: 99.99, // ~17% discount
  trial_days: 7,
  features: [
    'Access to exclusive content',
    'Priority support',
    'Early event access',
    'Special badge',
  ],
  max_members: 100, // Optional limit
});
```

#### Managing Subscriptions

```typescript
import { SubscriptionService } from '@/services/subscriptionService';

// Get all subscribers
const subscriptions = await SubscriptionService.getCommunitySubscriptions(communityId);

// Get subscription metrics
const metrics = await SubscriptionService.getSubscriptionMetrics(communityId);
console.log(metrics);
// {
//   total_subscribers: 45,
//   active_subscribers: 42,
//   trial_subscribers: 3,
//   monthly_revenue: 419.58,
//   yearly_revenue: 1999.80,
//   churn_rate: 0,
//   conversion_rate: 93.33
// }
```

### For Community Members

#### Subscribing to a Plan

The subscription flow is fully integrated in the UI:

1. Navigate to a community's subscription tab
2. Choose a plan (monthly or yearly)
3. Click "Subscribe" or "Start Free Trial"
4. Enter payment details in the Stripe Elements form
5. Submit payment

The component handles:
- Card validation
- Payment processing
- Trial period setup
- Database record creation
- Success/error notifications

#### Using the Hook

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const {
    loading,
    plans,
    subscription,
    hasActiveSubscription,
    subscribe,
    cancel,
  } = useSubscription(communityId);

  // Check if user is subscribed
  if (hasActiveSubscription) {
    return <div>Welcome Premium Member!</div>;
  }

  // Subscribe to a plan
  const handleSubscribe = async () => {
    await subscribe(planId, 'monthly', stripeCustomerId);
  };

  // Cancel subscription
  const handleCancel = async () => {
    await cancel();
  };
}
```

## Payment Flow

### Initial Subscription

1. User selects a plan and billing cycle
2. `SubscriptionCheckout` component displays Stripe Elements form
3. User enters card details
4. On submit:
   - For trials: Card is verified but not charged
   - For immediate payment: Payment intent is created and charged
5. Subscription record created in database
6. Payment record created (if applicable)
7. Stripe subscription created (synced via webhook)

### Recurring Payments

1. Stripe automatically charges the customer on the renewal date
2. Webhook event `invoice.payment_succeeded` is sent
3. `WebhookService` processes the event:
   - Creates payment record
   - Updates subscription status to "active"
   - Extends current_period_end date

### Failed Payments

1. Stripe attempts to charge the card
2. If payment fails, webhook event `invoice.payment_failed` is sent
3. `WebhookService` processes the event:
   - Creates failed payment record
   - Updates subscription status to "past_due"
   - Creates payment reminder
4. Stripe retries payment automatically (configurable)
5. If all retries fail, subscription may be cancelled

## Webhook Event Handling

### Subscription Created/Updated

```typescript
// Handles: customer.subscription.created, customer.subscription.updated
{
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: 'sub_xxx',
      customer: 'cus_xxx',
      status: 'active',
      current_period_start: 1234567890,
      current_period_end: 1234567890,
      trial_end: 1234567890,
      metadata: {
        subscription_id: 'uuid',
        community_id: 'uuid',
        user_id: 'uuid'
      }
    }
  }
}
```

Updates subscription status, period dates, and trial information in the database.

### Payment Succeeded

```typescript
// Handles: invoice.payment_succeeded
{
  type: 'invoice.payment_succeeded',
  data: {
    object: {
      amount_paid: 999, // in cents
      currency: 'usd',
      payment_intent: 'pi_xxx',
      subscription_metadata: {
        subscription_id: 'uuid'
      }
    }
  }
}
```

Creates payment record and updates subscription to active status.

### Payment Failed

```typescript
// Handles: invoice.payment_failed
{
  type: 'invoice.payment_failed',
  data: {
    object: {
      amount_due: 999,
      currency: 'usd',
      subscription_metadata: {
        subscription_id: 'uuid'
      }
    }
  }
}
```

Creates failed payment record, updates subscription to past_due, and creates payment reminder.

## Security Considerations

1. **API Keys**: Never expose Stripe secret keys in frontend code
2. **Webhook Signatures**: Always verify webhook signatures in production
3. **Row Level Security**: Database policies ensure users can only access their own subscriptions
4. **HTTPS**: All payment processing must use HTTPS
5. **PCI Compliance**: Using Stripe Elements ensures PCI compliance

## Testing

### Test Cards

Use these test card numbers in development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### Test Scenarios

1. **Successful Subscription**:
   - Use test card 4242 4242 4242 4242
   - Complete checkout flow
   - Verify subscription in database
   - Check Stripe dashboard

2. **Trial Period**:
   - Create plan with trial_days > 0
   - Subscribe with test card
   - Verify status is "trial"
   - Check trial_end date

3. **Failed Payment**:
   - Use decline card 4000 0000 0000 0002
   - Attempt payment
   - Verify error handling
   - Check payment record status

4. **Subscription Cancellation**:
   - Subscribe to a plan
   - Cancel subscription
   - Verify status is "cancelled"
   - Check Stripe dashboard

## Troubleshooting

### Payments Not Processing

1. Check Stripe API keys are correct
2. Verify webhook endpoint is accessible
3. Check webhook signature verification
4. Review Stripe dashboard for errors

### Webhooks Not Firing

1. Verify webhook URL is correct
2. Check webhook events are enabled
3. Test with Stripe CLI: `stripe listen`
4. Review webhook logs in Stripe dashboard

### Subscription Status Not Updating

1. Check database connection
2. Verify RLS policies allow updates
3. Review webhook processing logs
4. Check subscription_id in webhook metadata

## Migration from Mock to Real

If upgrading from the mock subscription system:

1. **Data Migration**: Existing mock subscriptions will need manual review
2. **Stripe Setup**: Complete Stripe account setup and verification
3. **Webhook Configuration**: Set up production webhook endpoints
4. **Testing**: Thoroughly test in Stripe test mode first
5. **Go Live**: Switch to production Stripe keys
6. **Monitoring**: Monitor webhook logs and payment status

## Future Enhancements

Potential improvements to the subscription system:

- [ ] Promo codes and discount system (partially implemented)
- [ ] Metered billing for usage-based pricing
- [ ] Multi-currency support
- [ ] Invoice customization
- [ ] Automated email receipts
- [ ] Subscription upgrade/downgrade flows
- [ ] Annual subscription reminders
- [ ] Payment method management UI
- [ ] Subscription analytics dashboard
- [ ] Dunning management (retry logic)

## Support

For issues or questions:

1. Check Stripe documentation: https://stripe.com/docs
2. Review webhook logs in Stripe dashboard
3. Check application logs for errors
4. Test with Stripe CLI for debugging

## License & Compliance

- **PCI Compliance**: Achieved by using Stripe Elements (no card data touches your server)
- **Data Protection**: Subscription data stored securely with RLS
- **Terms of Service**: Ensure your terms cover subscription billing
- **Privacy Policy**: Disclose payment processing with Stripe
