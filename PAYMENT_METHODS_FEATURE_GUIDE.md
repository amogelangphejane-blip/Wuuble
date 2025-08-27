# Payment Methods Feature Guide

This guide explains how to use the comprehensive payment methods system that has been added to the subscription feature for accessing private communities.

## Overview

The payment methods feature extends the existing subscription system to support multiple payment options:

- **Credit/Debit Cards** (via Stripe)
- **PayPal** payments and subscriptions
- **Bank Wire Transfers** (manual processing)
- **Cryptocurrency** payments (manual processing)

## Features

### 1. Multiple Payment Methods Support

Users can now choose from various payment methods when subscribing to communities:

- **Stripe Cards**: Secure credit/debit card processing
- **PayPal**: Popular online payment platform
- **Bank Transfers**: Traditional wire transfers with manual verification
- **Crypto**: Cryptocurrency payments (Bitcoin, Ethereum, etc.)

### 2. Saved Payment Methods

Users can save their payment methods for future use:

- Add and manage multiple payment methods
- Set default payment method
- Secure storage of payment information
- Bank account verification system

### 3. Payment Method Verification

For bank transfers, the system includes:

- Micro-deposit verification (1-2 business days)
- Manual verification with confirmation codes
- Automatic verification status tracking

### 4. Admin Payment Instructions

Community creators can configure:

- Custom payment instructions for each method
- Bank account details for wire transfers
- Cryptocurrency wallet addresses
- Custom instruction text and formatting

## Database Schema

### New Tables

#### `payment_methods`
Stores user payment methods with type-specific fields:

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- type: TEXT (card, paypal, bank_transfer, crypto)
- display_name: TEXT (user-friendly name)
- is_default: BOOLEAN
- is_active: BOOLEAN
- card_last4, card_brand, card_exp_month, card_exp_year
- paypal_email, paypal_account_id
- bank_name, bank_account_last4, bank_routing_number, etc.
- stripe_payment_method_id, paypal_payment_method_id
- metadata: JSONB
- created_at, updated_at: TIMESTAMP
```

#### `payment_method_verifications`
Tracks verification status for bank accounts:

```sql
- id: UUID (primary key)
- payment_method_id: UUID (foreign key)
- verification_type: TEXT (micro_deposits, instant, manual)
- status: TEXT (pending, verified, failed, expired)
- verification_code: TEXT
- micro_deposit_amounts: INTEGER[]
- verified_at, expires_at: TIMESTAMP
- attempts, max_attempts: INTEGER
```

#### `payment_instructions`
Community-specific payment instructions:

```sql
- id: UUID (primary key)
- community_id: UUID (foreign key)
- payment_type: TEXT (bank_transfer, crypto, other)
- title: TEXT
- instructions: TEXT
- is_active: BOOLEAN
- bank_name, account_name, account_number, routing_number, swift_code, iban
- wallet_address, crypto_type, network
- metadata: JSONB
```

### Updated Tables

#### `subscription_payments`
Enhanced with payment method tracking:

```sql
+ payment_method_id: UUID (foreign key to payment_methods)
+ payment_processor: TEXT (stripe, paypal, manual, crypto)
```

#### `community_member_subscriptions`
Added payment method preferences:

```sql
+ preferred_payment_method_id: UUID (foreign key)
+ paypal_subscription_id: TEXT
```

## API Services

### PaymentMethodService

Main service for managing payment methods:

```typescript
// Get user payment methods
getUserPaymentMethods(userId?: string): Promise<PaymentMethodServiceResult<PaymentMethodInfo[]>>

// Create new payment method
createPaymentMethod(paymentMethod: CreatePaymentMethodRequest): Promise<PaymentMethodServiceResult<PaymentMethodInfo>>

// Update payment method
updatePaymentMethod(paymentMethodId: string, updates: Partial<CreatePaymentMethodRequest>): Promise<PaymentMethodServiceResult<PaymentMethodInfo>>

// Delete payment method
deletePaymentMethod(paymentMethodId: string): Promise<PaymentMethodServiceResult<void>>

// Set default payment method
setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethodServiceResult<void>>

// Validate payment method for subscription
validatePaymentMethod(paymentMethodId: string, userId: string, amount: number): Promise<PaymentMethodServiceResult<PaymentMethodValidationResult>>
```

### PayPalService

Handles PayPal integration:

```typescript
// Create one-time payment
createPayment(request: CreatePayPalPaymentRequest): Promise<PayPalPaymentResult>

// Execute payment after approval
executePayment(paymentId: string, payerId: string): Promise<PayPalPaymentResult>

// Create subscription
createSubscription(request: CreatePayPalSubscriptionRequest): Promise<PayPalSubscriptionResult>

// Cancel subscription
cancelSubscription(subscriptionId: string): Promise<PayPalPaymentResult>
```

### BankTransferService

Manages manual bank transfers:

```typescript
// Submit bank transfer for verification
submitBankTransferPayment(request: BankTransferPaymentRequest): Promise<BankTransferResult>

// Get pending transfers (admin)
getPendingBankTransfers(): Promise<PendingBankTransfer[]>

// Confirm transfer (admin)
confirmBankTransferPayment(paymentId: string, notes?: string): Promise<BankTransferResult>

// Reject transfer (admin)
rejectBankTransferPayment(paymentId: string, reason: string): Promise<BankTransferResult>
```

## React Components

### PaymentMethodSelector

Main component for selecting payment methods during subscription:

```typescript
<PaymentMethodSelector
  communityId={communityId}
  selectedPaymentMethodId={selectedPaymentMethodId}
  onPaymentMethodSelect={setSelectedPaymentMethodId}
  amount={finalAmount}
  disabled={processing}
/>
```

### PaymentMethodManager

Component for managing saved payment methods:

```typescript
<PaymentMethodManager showAddButton={true} />
```

### AddPaymentMethodDialog

Dialog for adding new payment methods:

```typescript
<AddPaymentMethodDialog
  open={showAddDialog}
  onOpenChange={setShowAddDialog}
  onSuccess={() => setShowAddDialog(false)}
/>
```

### PaymentInstructionsDialog

Shows payment instructions for manual methods:

```typescript
<PaymentInstructionsDialog
  open={showInstructionsDialog}
  onOpenChange={setShowInstructionsDialog}
  communityId={communityId}
  paymentType="bank_transfer"
  amount={amount}
/>
```

### EnhancedPaymentForm

Upgraded payment form supporting all payment methods:

```typescript
<EnhancedPaymentForm
  plan={selectedPlan}
  communityId={communityId}
  billingCycle={billingCycle}
  onSuccess={handlePaymentSuccess}
  onCancel={handlePaymentCancel}
/>
```

## Hooks

### usePaymentMethods

Main hook for payment method management:

```typescript
const {
  paymentMethods,
  loading,
  error,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  validatePaymentMethod,
  getDefaultPaymentMethod,
  getPaymentMethodsByType,
  refreshPaymentMethods
} = usePaymentMethods();
```

### usePaymentInstructions

Hook for fetching community payment instructions:

```typescript
const {
  instructions,
  loading,
  error,
  refreshInstructions
} = usePaymentInstructions(communityId);
```

### usePaymentMethodVerification

Hook for managing payment method verification:

```typescript
const {
  verifications,
  loading,
  error,
  createVerification,
  verifyMicroDeposits,
  refreshVerifications
} = usePaymentMethodVerification(paymentMethodId);
```

## Usage Examples

### 1. Adding a Credit Card

```typescript
const { createPaymentMethod } = usePaymentMethods();

const addCard = async (cardData: any) => {
  const result = await createPaymentMethod({
    type: 'card',
    display_name: 'My Visa Card',
    card_last4: cardData.last4,
    card_brand: cardData.brand,
    card_exp_month: cardData.exp_month,
    card_exp_year: cardData.exp_year,
    stripe_payment_method_id: cardData.id,
    is_default: true
  });
  
  if (result.success) {
    console.log('Card added successfully');
  }
};
```

### 2. Adding a Bank Account

```typescript
const addBankAccount = async () => {
  const result = await createPaymentMethod({
    type: 'bank_transfer',
    display_name: 'My Checking Account',
    bank_name: 'Chase Bank',
    bank_account_holder_name: 'John Doe',
    bank_routing_number: '123456789',
    bank_account_last4: '1234',
    bank_account_type: 'checking'
  });
  
  if (result.success) {
    // Start verification process
    const verification = await createVerification('micro_deposits');
  }
};
```

### 3. Setting Up Payment Instructions (Admin)

```typescript
const setupBankInstructions = async () => {
  const result = await PaymentMethodService.createPaymentInstructions({
    community_id: communityId,
    payment_type: 'bank_transfer',
    title: 'Bank Wire Transfer',
    instructions: 'Please transfer the exact amount to our bank account...',
    bank_name: 'Community Bank',
    account_name: 'Community Account',
    account_number: '1234567890',
    routing_number: '987654321',
    is_active: true
  });
};
```

### 4. Processing Different Payment Types

```typescript
const processPayment = async (paymentMethodId: string, amount: number) => {
  const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
  
  switch (paymentMethod?.type) {
    case 'card':
      // Stripe processing
      return await PaymentService.processPayment(
        subscriptionId, 
        amount, 
        'USD', 
        paymentMethodId, 
        customerId, 
        'card'
      );
      
    case 'paypal':
      // PayPal processing
      return await PaymentService.processPayment(
        subscriptionId, 
        amount, 
        'USD', 
        paymentMethodId, 
        undefined, 
        'paypal'
      );
      
    case 'bank_transfer':
      // Manual processing
      return await BankTransferService.submitBankTransferPayment({
        subscriptionId,
        amount,
        currency: 'USD',
        bankTransferDetails: {
          senderName: 'User Name',
          senderAccount: paymentMethod.bank_account_last4,
          transferDate: new Date().toISOString(),
          bankName: paymentMethod.bank_name
        }
      });
  }
};
```

## Configuration

### Environment Variables

Add these environment variables for payment processor integration:

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_SECRET_KEY=sk_test_...

# PayPal
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_PAYPAL_CLIENT_SECRET=your_paypal_client_secret
VITE_PAYPAL_ENVIRONMENT=sandbox  # or production
```

### Database Migration

Run the payment methods migration:

```sql
-- Apply the migration
\i supabase/migrations/20250203000000_add_payment_methods.sql
```

## Security Considerations

1. **PCI Compliance**: Card data is handled by Stripe, never stored locally
2. **RLS Policies**: All payment method tables have row-level security
3. **Encryption**: Sensitive data is encrypted at rest
4. **Validation**: All payment methods are validated before processing
5. **Audit Trail**: All payment transactions are logged

## Testing

### Mock Mode

The system includes mock implementations for development:

- Stripe payments simulate 90% success rate
- PayPal payments use mock approval URLs
- Bank transfers create pending payments for testing

### Test Data

Use these test values in development:

```typescript
// Test card numbers (Stripe)
const testCards = {
  visa: '4242424242424242',
  mastercard: '5555555555554444',
  amex: '378282246310005'
};

// Test PayPal accounts
const testPayPal = {
  email: 'test@example.com'
};

// Test bank accounts
const testBank = {
  routing: '110000000',
  account: '000123456789'
};
```

## Troubleshooting

### Common Issues

1. **Payment Method Not Saving**
   - Check RLS policies are properly configured
   - Verify user authentication
   - Check required fields are provided

2. **Bank Verification Failing**
   - Ensure micro-deposit amounts are entered correctly
   - Check if verification has expired
   - Verify maximum attempts not exceeded

3. **PayPal Integration Issues**
   - Verify PayPal credentials are correct
   - Check sandbox vs production environment
   - Ensure return URLs are properly configured

4. **Stripe Card Errors**
   - Verify Stripe keys are correct
   - Check card element is properly initialized
   - Ensure 3D Secure is handled if required

### Debug Mode

Enable debug logging:

```typescript
// Enable detailed logging
localStorage.setItem('payment_debug', 'true');
```

## Future Enhancements

Potential improvements for the payment methods system:

1. **Apple Pay / Google Pay** integration
2. **ACH Direct Debit** for recurring payments
3. **International payment methods** (SEPA, iDEAL, etc.)
4. **Cryptocurrency automation** with blockchain integration
5. **Payment method analytics** and reporting
6. **Automated bank verification** via Plaid/Yodlee
7. **Multi-currency support**
8. **Payment method recommendations** based on user location

## Support

For issues or questions about the payment methods feature:

1. Check the troubleshooting section above
2. Review the component documentation
3. Test with mock data first
4. Verify database migrations are applied
5. Check environment variables are configured

The payment methods system is designed to be extensible and secure, providing users with flexible options for subscribing to private communities while maintaining PCI compliance and data security standards.