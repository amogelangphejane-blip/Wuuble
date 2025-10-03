import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PatronService, CreatorWallet, RevenueTransaction, PayoutRequest } from '@/services/patronService';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const CreatorEarningsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<CreatorWallet[]>([]);
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    totalPayouts: 0,
    thisMonthEarnings: 0,
  });
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'paypal' | 'stripe_transfer'>('stripe_transfer');
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load wallets
      const walletsData = await PatronService.getCreatorWallets(user.id);
      setWallets(walletsData);

      // Load transactions
      const transactionsData = await PatronService.getRevenueTransactions(user.id);
      setTransactions(transactionsData);

      // Load payouts
      const payoutsData = await PatronService.getPayoutRequests(user.id);
      setPayouts(payoutsData);

      // Load summary
      const summaryData = await PatronService.getEarningsSummary(user.id);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading earnings data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      setProcessingPayout(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const amount = parseFloat(payoutAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (amount > summary.availableBalance) {
        throw new Error('Insufficient balance');
      }

      await PatronService.requestPayout(user.id, amount, payoutMethod);

      toast({
        title: 'Payout Requested',
        description: `Your payout of $${amount} has been requested and will be processed within 3-5 business days.`,
      });

      setShowPayoutDialog(false);
      setPayoutAmount('');
      loadData();
    } catch (error) {
      toast({
        title: 'Payout Failed',
        description: error instanceof Error ? error.message : 'Failed to request payout',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayout(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'membership_payment':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'platform_fee':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'payout_completed':
        return <ArrowUpRight className="w-4 h-4 text-purple-500" />;
      case 'refund':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPayoutStatusBadge = (status: PayoutRequest['status']) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'default', icon: Loader2 },
      completed: { variant: 'default', icon: CheckCircle, className: 'bg-green-500' },
      failed: { variant: 'destructive', icon: XCircle },
      cancelled: { variant: 'outline', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Creator Earnings</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your earnings and manage payouts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summary.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${summary.availableBalance.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">${summary.pendingBalance.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Held for 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">${summary.thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Earned this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Split Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Revenue Share:</strong> You receive 70% of each membership payment. 30% goes to platform fees.
          Funds are held for 7 days before becoming available for withdrawal.
        </AlertDescription>
      </Alert>

      {/* Payout Button */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Request Payout</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Available balance: ${summary.availableBalance.toFixed(2)}
              </p>
            </div>
            <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  disabled={summary.availableBalance < 10}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Withdraw Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Payout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="10"
                      max={summary.availableBalance}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum: $10 • Available: ${summary.availableBalance.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="method">Payout Method</Label>
                    <Select value={payoutMethod} onValueChange={(v: any) => setPayoutMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe_transfer">Stripe Transfer (Instant)</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer (3-5 days)</SelectItem>
                        <SelectItem value="paypal">PayPal (1-2 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleRequestPayout}
                    disabled={processingPayout || !payoutAmount}
                  >
                    {processingPayout ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Request ${payoutAmount || '0.00'} Payout</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest earnings and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <p className="font-medium text-sm">
                        {tx.transaction_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()} •{' '}
                        {tx.card_brand && tx.card_last4 && `${tx.card_brand} ****${tx.card_last4}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.creator_amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {tx.creator_amount > 0 ? '+' : ''}${tx.creator_amount.toFixed(2)}
                    </p>
                    {tx.gross_amount !== tx.creator_amount && (
                      <p className="text-xs text-gray-500">
                        ${tx.gross_amount.toFixed(2)} total
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Track your withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payouts yet</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">${payout.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {payout.method.split('_').join(' ')} •{' '}
                      {new Date(payout.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getPayoutStatusBadge(payout.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
