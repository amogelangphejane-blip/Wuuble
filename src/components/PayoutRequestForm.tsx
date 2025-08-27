import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  CreditCard, 
  Building, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { CreatorWallet, CreatePayoutRequest, PayoutRequestResult } from '@/types/wallet';
import { formatCurrency } from '@/lib/utils';

interface PayoutRequestFormProps {
  wallet: CreatorWallet;
  onSubmit: (request: CreatePayoutRequest) => Promise<PayoutRequestResult>;
  onCancel: () => void;
}

export function PayoutRequestForm({ wallet, onSubmit, onCancel }: PayoutRequestFormProps) {
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank_account' | 'paypal'>('bank_account');
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    account_number: '',
    routing_number: '',
    bank_name: '',
    account_type: 'checking' as 'checking' | 'savings'
  });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const minimumAmount = 25.00;
  const maximumAmount = wallet.balance;
  const amountValue = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amountValue < minimumAmount) {
      setError(`Minimum payout amount is ${formatCurrency(minimumAmount)}`);
      return;
    }

    if (amountValue > maximumAmount) {
      setError(`Amount cannot exceed your available balance of ${formatCurrency(maximumAmount)}`);
      return;
    }

    // Validate payout method details
    if (payoutMethod === 'bank_account') {
      if (!bankDetails.account_holder_name || !bankDetails.account_number || !bankDetails.routing_number || !bankDetails.bank_name) {
        setError('Please fill in all bank account details');
        return;
      }
    } else if (payoutMethod === 'paypal') {
      if (!paypalEmail || !paypalEmail.includes('@')) {
        setError('Please enter a valid PayPal email address');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreatePayoutRequest = {
        wallet_id: wallet.id,
        amount: amountValue,
        payout_method: {
          type: payoutMethod,
          details: payoutMethod === 'bank_account' ? bankDetails : { email: paypalEmail }
        }
      };

      const result = await onSubmit(request);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onCancel();
        }, 2000);
      } else {
        setError(result.error || 'Payout request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open onOpenChange={onCancel}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payout Requested!</h3>
            <p className="text-gray-500">
              Your payout request for {formatCurrency(amountValue)} has been submitted successfully.
              You'll receive an email confirmation shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw funds from your creator wallet to your preferred payment method.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(wallet.balance)}
              </p>
              <p className="text-sm text-gray-500">
                Minimum payout: {formatCurrency(minimumAmount)}
              </p>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payout Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={minimumAmount}
                max={maximumAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9"
                required
              />
            </div>
            {amountValue > 0 && (
              <p className="text-sm text-gray-500">
                {amountValue < minimumAmount && (
                  <span className="text-red-600">Amount must be at least {formatCurrency(minimumAmount)}</span>
                )}
                {amountValue > maximumAmount && (
                  <span className="text-red-600">Amount cannot exceed {formatCurrency(maximumAmount)}</span>
                )}
                {amountValue >= minimumAmount && amountValue <= maximumAmount && (
                  <span className="text-green-600">Valid payout amount</span>
                )}
              </p>
            )}
          </div>

          {/* Payout Method */}
          <div className="space-y-4">
            <Label>Payout Method</Label>
            <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_account">
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    Bank Account
                  </div>
                </SelectItem>
                <SelectItem value="paypal">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    PayPal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Account Details */}
          {payoutMethod === 'bank_account' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bank Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_holder_name">Account Holder Name</Label>
                    <Input
                      id="account_holder_name"
                      value={bankDetails.account_holder_name}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, account_holder_name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                      placeholder="Chase Bank"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={bankDetails.account_number}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routing_number">Routing Number</Label>
                    <Input
                      id="routing_number"
                      value={bankDetails.routing_number}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, routing_number: e.target.value }))}
                      placeholder="021000021"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select 
                    value={bankDetails.account_type} 
                    onValueChange={(value: any) => setBankDetails(prev => ({ ...prev, account_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PayPal Details */}
          {payoutMethod === 'paypal' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">PayPal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="paypal_email">PayPal Email</Label>
                  <Input
                    id="paypal_email"
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Processing Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payouts are processed weekly on Fridays. Bank transfers typically take 1-3 business days, 
              while PayPal transfers are usually instant.
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || amountValue < minimumAmount || amountValue > maximumAmount}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Payout
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}