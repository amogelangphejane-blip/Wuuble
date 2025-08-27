# Platform Payment Setup Guide

This guide explains how to add your card details to the app so you can receive payments as the developer and facilitate creator payouts.

## Overview

Your app now has a comprehensive platform payment system that:
- **Routes all payments through your platform account first**
- **Automatically deducts a 20% platform fee**
- **Credits 80% to creator wallets**
- **Enables automated payouts to creators**
- **Provides admin dashboard for payment management**

## Quick Start

### 1. Apply Database Migrations

First, apply the new database migrations:

```bash
# Apply the platform account system migration
supabase db push

# Or if using direct SQL
psql -d your_database -f supabase/migrations/20250115000001_add_platform_account_system.sql
psql -d your_database -f supabase/migrations/20250115000002_add_payout_jobs_table.sql
```

### 2. Set Up Admin Access

Make your user account an admin by updating your user metadata:

```sql
-- Replace 'your-user-id' with your actual user ID
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE id = 'your-user-id';
```

### 3. Access Platform Settings

Navigate to `/admin/platform-settings` in your app to configure payment accounts.

## Payment Method Options

### Option 1: Stripe Connect (Recommended)

**Best for:** Automated processing, compliance, and scalability

1. **Go to Platform Settings** (`/admin/platform-settings`)
2. **Click "Add Payment Account"**
3. **Select "Stripe Connect"**
4. **Click "Setup with Stripe"**
5. **Complete Stripe onboarding** (you'll be redirected to Stripe)
6. **Verify account status** in the dashboard

**Benefits:**
- Automatic payment processing
- PCI compliance handled by Stripe
- Automated creator payouts
- Real-time balance tracking
- Fraud protection

### Option 2: Bank Account

**Best for:** Direct bank deposits (manual processing required)

1. **Go to Platform Settings**
2. **Select "Bank Account"**
3. **Enter your bank details:**
   - Bank name
   - Account holder name
   - Routing number
   - Account number
   - Account type (checking/savings)

**Note:** Bank account payments require manual processing and verification.

### Option 3: PayPal

**Best for:** International payments and PayPal users

1. **Go to Platform Settings**
2. **Select "PayPal"**
3. **Enter your PayPal business email**

## Backend Implementation Required

The frontend components are ready, but you need to implement the backend API endpoints:

### Stripe Connect API Endpoints

Create these endpoints in your backend (Express.js, Next.js API routes, or Supabase Edge Functions):

```typescript
// POST /api/stripe/connect/create
// POST /api/stripe/platform/create-payment-intent
// POST /api/stripe/platform/transfer
// GET /api/stripe/platform/balance
// POST /api/stripe/connect/create-creator-account
```

**Implementation templates are provided in:**
- `src/api/stripe/connect.ts` - Complete backend templates
- `src/services/platformStripeService.ts` - Backend implementation examples

### Environment Variables

Add these to your backend environment:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # or sk_test_ for testing
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://yourdomain.com

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=20.00
MINIMUM_PAYOUT_AMOUNT=25.00
```

## How Payments Flow

### 1. User Subscribes to Creator
```
User pays $29.99 → Platform Account receives $29.99
```

### 2. Automatic Fee Split
```
Platform keeps: $5.99 (20%)
Creator gets: $23.99 (80%) → Added to creator wallet
```

### 3. Creator Payout (Automated)
```
Creator wallet: $100+ → Automatic payout to creator's bank/Stripe account
Platform balance: Updated with remaining fees
```

## Admin Dashboard Features

### Payment Overview
- Total platform revenue
- Creator payouts made
- Active creators
- Monthly growth metrics

### Account Management
- Add/edit payment accounts
- Set primary account
- Configure payout settings
- View account status

### Payout Automation
- Set minimum payout amounts
- Configure payout schedules (daily/weekly/monthly)
- View payout history
- Manual payout processing

## Automated Payout System

### Configuration

```typescript
// Platform settings you can configure:
{
  auto_payout_enabled: true,
  payout_schedule: 'weekly', // 'daily', 'weekly', 'monthly'
  payout_day: 5, // Friday (0=Sunday, 1=Monday, etc.)
  minimum_payout_amount: 25.00 // Minimum $25 for payout
}
```

### How It Works

1. **Daily Check:** System checks if it's payout day
2. **Find Eligible Creators:** Creators with balance ≥ minimum amount
3. **Process Payouts:** Automatic transfers via Stripe Connect
4. **Update Records:** Transaction history and wallet balances updated
5. **Notifications:** Success/failure notifications (optional)

## Testing the System

### 1. Mock Payments (Development)

The system includes mock payment processing for development:

```typescript
// Mock payments simulate:
// - 90% success rate
// - Realistic payment IDs
// - Platform fee calculations
// - Creator wallet updates
```

### 2. Test Flow

1. **Create a test subscription**
2. **Process a mock payment**
3. **Check creator wallet balance**
4. **Verify platform fee collection**
5. **Test payout processing**

### 3. Stripe Test Mode

Use Stripe test keys and test card numbers:

```
Test Cards:
- Visa: 4242424242424242
- Mastercard: 5555555555554444
- Amex: 378282246310005
```

## Security Considerations

### Data Protection
- **Card data:** Never stored locally (handled by Stripe)
- **Bank details:** Encrypted at rest
- **PCI compliance:** Handled by payment processors
- **RLS policies:** Restrict access to admin users only

### Access Control
- **Admin-only access** to platform settings
- **Row-level security** on all financial tables
- **Audit trails** for all transactions
- **Rate limiting** on sensitive operations

## Monitoring and Analytics

### Key Metrics to Track

```typescript
// Platform Performance
- Total revenue (platform fees)
- Creator payouts processed
- Payment success rates
- Average transaction amounts

// Creator Analytics  
- Active creators with earnings
- Average creator earnings
- Payout frequency
- Creator retention rates
```

### Dashboard Widgets

The admin dashboard provides real-time insights:
- Available balance for payouts
- Monthly revenue growth
- Creator payout statistics
- Recent transaction activity

## Troubleshooting

### Common Issues

1. **"No primary platform account"**
   - Solution: Set up and activate a payment account in admin settings

2. **"Stripe Connect account not configured"**
   - Solution: Complete Stripe onboarding process

3. **"Creator payout failed"**
   - Check: Creator has valid Stripe Connect account
   - Check: Sufficient platform balance
   - Check: Payout method configuration

4. **"Unauthorized access"**
   - Solution: Ensure user has admin role in user metadata

### Debug Tools

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('payment_debug', 'true');
```

### Support Checklist

Before reaching out for support:
- ✅ Database migrations applied
- ✅ User has admin role
- ✅ Backend API endpoints implemented
- ✅ Stripe keys configured
- ✅ Environment variables set

## Advanced Configuration

### Custom Platform Fee Rates

Update platform fee percentage:

```sql
UPDATE platform_fee_config 
SET fee_percentage = 15.00 
WHERE is_active = true;
```

### Multi-Currency Support

The system supports multiple currencies:

```sql
INSERT INTO platform_fee_config (fee_percentage, currency, is_active)
VALUES (20.00, 'EUR', true), (20.00, 'GBP', true);
```

### Custom Payout Schedules

Modify payout automation:

```typescript
// Weekly payouts on Fridays
payout_schedule: 'weekly',
payout_day: 5

// Monthly payouts on 15th
payout_schedule: 'monthly', 
payout_day: 15
```

## API Reference

### Platform Account Service

```typescript
import { PlatformAccountService } from '@/services/platformAccountService';

// Get all platform accounts
const accounts = await PlatformAccountService.getPlatformAccounts();

// Create new account
const result = await PlatformAccountService.upsertPlatformAccount({
  account_type: 'stripe_connect',
  account_name: 'My Platform Account',
  is_primary: true
});

// Get platform balance
const balance = await PlatformAccountService.getPlatformBalance();
```

### Payout Automation Service

```typescript
import { PayoutAutomationService } from '@/services/payoutAutomationService';

// Get eligible creators
const creators = await PayoutAutomationService.getEligibleCreators(25.00);

// Schedule payout job
const job = await PayoutAutomationService.schedulePayoutJob(new Date(), 25.00);

// Process payouts
const result = await PayoutAutomationService.processPayoutJob(job.jobId);
```

## Next Steps

1. **Implement backend API endpoints** using provided templates
2. **Set up Stripe Connect** in your Stripe dashboard
3. **Configure webhooks** for real-time payment updates
4. **Test payment flow** with small amounts
5. **Enable automated payouts** for creators
6. **Monitor platform performance** via admin dashboard

## Support

For additional help:
1. Check the troubleshooting section above
2. Review component documentation in the codebase
3. Test with mock data first
4. Verify all environment variables are configured

The platform payment system is designed to be secure, scalable, and compliant with financial regulations while providing a smooth experience for both you as the platform owner and your creators.