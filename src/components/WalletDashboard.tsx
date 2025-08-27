import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Settings,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { TransactionsList } from './TransactionsList';
import { PayoutRequestForm } from './PayoutRequestForm';
import { PayoutMethodSettings } from './PayoutMethodSettings';
import { EarningsChart } from './EarningsChart';
import { formatCurrency, formatDate } from '@/lib/utils';

export function WalletDashboard() {
  const {
    wallet,
    walletStats,
    walletSummary,
    transactions,
    payoutRequests,
    loading,
    error,
    refreshWallet,
    requestPayout,
    updatePayoutMethod
  } = useWallet();

  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [showPayoutSettings, setShowPayoutSettings] = useState(false);

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading wallet: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet || !walletSummary) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No wallet found</h3>
            <p className="text-gray-500">Your creator wallet will be created automatically when you receive your first payment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(walletSummary.available_balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for withdrawal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(walletSummary.current_month_earnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              After {walletSummary.platform_fee_rate}% platform fee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(walletSummary.total_lifetime_earnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total earned since joining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {walletSummary.next_payout_date ? formatDate(walletSummary.next_payout_date) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly payouts on Fridays
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Balance Alert */}
      {walletSummary.pending_payouts > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {formatCurrency(walletSummary.pending_payouts)} pending withdrawal
                </p>
                <p className="text-sm text-yellow-600">
                  Your payout request is being processed and will be available soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Chart</CardTitle>
                <CardDescription>Your earnings over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <EarningsChart walletId={wallet.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your wallet and payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setShowPayoutForm(true)}
                  disabled={walletSummary.available_balance < walletSummary.minimum_payout_amount}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Request Payout
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowPayoutSettings(true)}
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Payout Settings
                </Button>

                <Button 
                  variant="outline"
                  onClick={refreshWallet}
                  className="w-full"
                >
                  Refresh Balance
                </Button>

                {walletSummary.available_balance < walletSummary.minimum_payout_amount && (
                  <p className="text-sm text-muted-foreground">
                    Minimum payout amount is {formatCurrency(walletSummary.minimum_payout_amount)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsList 
                transactions={transactions.slice(0, 5)} 
                showPagination={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsList transactions={transactions} showPagination={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payout Requests</CardTitle>
                <CardDescription>Track your withdrawal requests</CardDescription>
              </div>
              <Button 
                onClick={() => setShowPayoutForm(true)}
                disabled={walletSummary.available_balance < walletSummary.minimum_payout_amount}
              >
                <Download className="mr-2 h-4 w-4" />
                New Payout
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No payout requests</h3>
                    <p className="text-gray-500">Your payout requests will appear here.</p>
                  </div>
                ) : (
                  payoutRequests.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(payout.status)}
                        <div>
                          <p className="font-medium">{formatCurrency(payout.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested on {formatDate(payout.requested_at)}
                          </p>
                          {payout.failure_reason && (
                            <p className="text-sm text-red-600">{payout.failure_reason}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
              <CardDescription>Manage your payout preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutMethodSettings 
                wallet={wallet}
                onUpdate={updatePayoutMethod}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showPayoutForm && (
        <PayoutRequestForm
          wallet={wallet}
          onSubmit={async (request) => {
            const result = await requestPayout(request);
            if (result.success) {
              setShowPayoutForm(false);
            }
            return result;
          }}
          onCancel={() => setShowPayoutForm(false)}
        />
      )}

      {showPayoutSettings && (
        <PayoutMethodSettings
          wallet={wallet}
          onUpdate={updatePayoutMethod}
          onClose={() => setShowPayoutSettings(false)}
        />
      )}
    </div>
  );
}