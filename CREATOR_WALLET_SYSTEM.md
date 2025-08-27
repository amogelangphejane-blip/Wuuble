# Creator Wallet System

A comprehensive Patreon-like subscription system with creator wallets, platform fees, and payout management.

## Overview

The Creator Wallet System transforms the app into a subscription platform where:
- **Payments go to the app first** (not directly to creators)
- **Platform takes a 20% fee** from all subscription payments
- **Remaining 80% goes to creator's wallet**
- **Creators can request payouts** from their wallet balance
- **Comprehensive transaction tracking** for transparency

## Key Features

### 🏦 Creator Wallets
- **Automatic wallet creation** for community creators
- **Balance tracking** (available, pending, lifetime earnings)
- **Multi-currency support** (default USD)
- **Secure payout method storage**

### 💰 Platform Fee Processing
- **20% platform fee** automatically deducted from all payments
- **Configurable fee structure** via database
- **Transparent fee breakdown** shown to creators
- **Automatic fee calculation** and distribution

### 💳 Payment Flow
1. **User pays subscription** → Payment goes to app
2. **Platform deducts 20% fee** → Keeps platform fee
3. **Remaining 80% credited** → Creator's wallet balance
4. **Creator requests payout** → Funds transferred to creator
5. **Transaction recorded** → Full audit trail maintained

### 🔄 Payout System
- **Multiple payout methods**: Bank account, PayPal, Stripe Express
- **Minimum payout threshold**: $25 (configurable)
- **Weekly payout schedule**: Fridays (configurable)
- **Payout status tracking**: Pending, processing, completed, failed
- **Automatic retry logic** for failed payouts

### 📊 Analytics & Reporting
- **Earnings dashboard** with charts and trends
- **Transaction history** with filtering and search
- **Revenue breakdown** (gross, fees, net)
- **Performance metrics** (subscribers, conversion rates)
- **Exportable reports** for tax purposes

## Database Schema

### Core Tables

#### `creator_wallets`
```sql
- id: UUID (primary key)
- creator_id: UUID (references auth.users)
- balance: DECIMAL(10,2) (available balance)
- pending_balance: DECIMAL(10,2) (pending payouts)
- total_earned: DECIMAL(10,2) (lifetime earnings)
- total_withdrawn: DECIMAL(10,2) (lifetime withdrawals)
- currency: VARCHAR(3) (default 'USD')
- payout_method: JSONB (payment method details)
- is_active: BOOLEAN (wallet status)
```

#### `wallet_transactions`
```sql
- id: UUID (primary key)
- wallet_id: UUID (references creator_wallets)
- transaction_type: VARCHAR(50) (subscription_payment, platform_fee, payout, etc.)
- amount: DECIMAL(10,2) (positive for credits, negative for debits)
- currency: VARCHAR(3)
- description: TEXT
- reference_id: UUID (links to payments, payouts, etc.)
- status: VARCHAR(20) (pending, completed, failed)
- metadata: JSONB (additional data)
```

#### `platform_fee_config`
```sql
- id: UUID (primary key)
- fee_percentage: DECIMAL(5,2) (default 20.00)
- minimum_fee: DECIMAL(10,2)
- maximum_fee: DECIMAL(10,2) (optional cap)
- currency: VARCHAR(3)
- is_active: BOOLEAN
```

#### `payout_requests`
```sql
- id: UUID (primary key)
- wallet_id: UUID (references creator_wallets)
- amount: DECIMAL(10,2)
- payout_method: JSONB (bank/PayPal details)
- status: VARCHAR(20) (pending, processing, completed, failed)
- external_payout_id: VARCHAR(255) (Stripe transfer ID, etc.)
- failure_reason: TEXT
- requested_at: TIMESTAMP
- processed_at: TIMESTAMP
- completed_at: TIMESTAMP
```

### Enhanced Tables

#### `subscription_payments` (updated)
```sql
-- New columns added:
- gross_amount: DECIMAL(10,2) (original amount before fees)
- platform_fee: DECIMAL(10,2) (fee deducted)
- creator_amount: DECIMAL(10,2) (amount to creator)
- wallet_transaction_id: UUID (links to wallet transaction)
```

## API Endpoints

### Wallet Management
- `GET /api/wallet` - Get creator wallet details
- `PUT /api/wallet/payout-method` - Update payout method
- `GET /api/wallet/stats` - Get wallet statistics
- `GET /api/wallet/summary` - Get wallet dashboard summary

### Transactions
- `GET /api/wallet/transactions` - Get transaction history (with filtering)
- `GET /api/wallet/earnings` - Get earnings breakdown by period
- `POST /api/wallet/process-payment` - Process subscription payment with fees

### Payouts
- `POST /api/wallet/payout` - Request payout
- `GET /api/wallet/payouts` - Get payout requests
- `PUT /api/wallet/payout/:id` - Update payout status (admin)

### Platform Configuration
- `GET /api/platform/fee-config` - Get current fee configuration
- `PUT /api/platform/fee-config` - Update fee configuration (admin)

## React Components

### Core Components
- **`WalletDashboard`** - Main wallet interface with overview, transactions, payouts, settings
- **`TransactionsList`** - Filterable transaction history with pagination
- **`PayoutRequestForm`** - Modal form for requesting payouts
- **`PayoutMethodSettings`** - Configure bank account or PayPal details
- **`EarningsChart`** - Visual earnings chart with different time periods

### Hooks
- **`useWallet`** - Main wallet hook with balance, transactions, and actions
- **`useWalletOperations`** - Specific wallet operations (payment processing, etc.)

### Services
- **`WalletService`** - All wallet-related API calls and business logic
- **`PaymentService`** - Enhanced with platform fee processing
- **`StripeService`** - Payment processing integration

## Security Features

### Row Level Security (RLS)
- **Creators can only access their own wallet** data
- **Users can only view their own transactions**
- **Platform admins have elevated access** for support
- **Payout methods are encrypted** and never fully exposed

### Data Protection
- **Sensitive payment data** stored encrypted
- **PCI compliance** for card data handling
- **Audit trails** for all financial transactions
- **Rate limiting** on payout requests

### Fraud Prevention
- **Minimum payout thresholds** to prevent micro-fraud
- **Maximum daily payout limits** per creator
- **Suspicious activity detection** and flagging
- **Manual review process** for large payouts

## Configuration

### Environment Variables
```env
# Platform fee configuration
PLATFORM_FEE_PERCENTAGE=20.00
MINIMUM_PAYOUT_AMOUNT=25.00
MAXIMUM_DAILY_PAYOUT=10000.00

# Payout schedule
PAYOUT_SCHEDULE_DAY=5  # Friday
PAYOUT_PROCESSING_HOUR=10  # 10 AM UTC

# Payment processing
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Feature Flags
```typescript
const WALLET_FEATURES = {
  PAYPAL_PAYOUTS: true,
  BANK_PAYOUTS: true,
  CRYPTO_PAYOUTS: false,
  INSTANT_PAYOUTS: false,
  MULTI_CURRENCY: false,
};
```

## Usage Examples

### Processing a Subscription Payment
```typescript
import { WalletService } from '@/services/walletService';

// Process payment with automatic fee deduction
const result = await WalletService.processSubscriptionPayment(
  subscriptionId,
  29.99, // gross amount
  'USD',
  'stripe',
  'pi_1234567890'
);

// Result includes:
// - payment_id: Database payment record ID
// - transaction_id: Wallet transaction ID
// - gross_amount: 29.99
// - platform_fee: 5.99 (20%)
// - creator_amount: 23.99 (80%)
```

### Requesting a Payout
```typescript
import { useWallet } from '@/hooks/useWallet';

const { requestPayout } = useWallet();

const result = await requestPayout({
  wallet_id: 'wallet-uuid',
  amount: 100.00,
  payout_method: {
    type: 'bank_account',
    details: {
      account_holder_name: 'John Doe',
      account_number: '1234567890',
      routing_number: '021000021',
      bank_name: 'Chase Bank',
      account_type: 'checking'
    }
  }
});
```

### Getting Wallet Statistics
```typescript
import { useWallet } from '@/hooks/useWallet';

const { walletStats, walletSummary } = useWallet();

// walletStats includes:
// - total_balance: Available balance
// - pending_balance: Pending payouts
// - total_earned: Lifetime earnings
// - this_month_earned: Current month
// - active_subscriptions: Subscriber count

// walletSummary includes:
// - available_balance: Ready for withdrawal
// - current_month_earnings: This month's net
// - platform_fee_rate: Current fee percentage
// - next_payout_date: Next scheduled payout
```

## Migration Guide

### From Direct Payments to Platform Processing

1. **Run the wallet migration**:
   ```bash
   supabase db reset
   # or apply the specific migration
   supabase db push
   ```

2. **Update payment processing code**:
   ```typescript
   // Before: Direct payment to creator
   await StripeService.createPaymentIntent({...});
   
   // After: Payment through platform with fees
   await WalletService.processSubscriptionPayment({...});
   ```

3. **Update subscription components**:
   - Replace direct payment flows with wallet-aware flows
   - Add wallet dashboard to creator interfaces
   - Update payment success messages to mention platform fees

4. **Configure platform settings**:
   - Set platform fee percentage in database
   - Configure payout schedules and limits
   - Set up Stripe Connect for creator payouts

## Monitoring & Analytics

### Key Metrics to Track
- **Total platform revenue** (fees collected)
- **Creator earnings** (amount distributed)
- **Payout success rate** (successful vs failed)
- **Average payout time** (request to completion)
- **Subscription conversion rate** after fee disclosure

### Dashboards
- **Platform Admin Dashboard** - Overall platform performance
- **Creator Dashboard** - Individual creator wallet and earnings
- **Financial Dashboard** - Revenue, fees, payouts, and reconciliation

## Support & Troubleshooting

### Common Issues
1. **Wallet not created** - Automatic creation on first community creation
2. **Missing transactions** - Check RLS policies and user permissions
3. **Payout failures** - Verify bank details and Stripe Connect setup
4. **Fee calculation errors** - Check platform_fee_config table

### Debug Tools
- **Transaction explorer** - Search and filter all wallet transactions
- **Payout tracker** - Monitor payout status and failures
- **Balance reconciliation** - Verify wallet balances match transaction history

## Future Enhancements

### Planned Features
- **Multi-currency support** - Handle different currencies and exchange rates
- **Instant payouts** - Real-time payouts for premium creators
- **Cryptocurrency payouts** - Bitcoin, Ethereum support
- **Creator analytics** - Detailed subscriber and revenue analytics
- **Tax reporting** - 1099 generation and tax document export
- **Subscription tiers** - Different platform fees based on creator tier

### API Improvements
- **GraphQL support** - More efficient data fetching
- **Webhooks** - Real-time notifications for wallet events
- **Bulk operations** - Process multiple payouts simultaneously
- **Advanced filtering** - More sophisticated transaction queries

This system provides a robust, scalable foundation for a creator economy platform with transparent fee processing and comprehensive wallet management.