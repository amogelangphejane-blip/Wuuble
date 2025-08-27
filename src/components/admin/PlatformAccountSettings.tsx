import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Building2, 
  Wallet, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { usePlatformAccount } from '@/hooks/usePlatformAccount';
import { CreatePlatformAccountRequest, UpdatePlatformAccountRequest } from '@/types/platformAccount';

export const PlatformAccountSettings: React.FC = () => {
  const {
    accounts,
    primaryAccount,
    balance,
    dashboardStats,
    stripeConnectInfo,
    loading,
    accountsLoading,
    balanceLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    setupStripeConnect
  } = usePlatformAccount();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'stripe_connect':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_account':
        return <Building2 className="h-4 w-4" />;
      case 'paypal':
        return <Wallet className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (account: any) => {
    if (account.account_type === 'stripe_connect') {
      if (account.stripe_charges_enabled && account.stripe_payouts_enabled) {
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      } else if (account.stripe_details_submitted) {
        return <Badge variant="secondary">Under Review</Badge>;
      } else {
        return <Badge variant="destructive">Setup Required</Badge>;
      }
    }
    return account.is_active ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge> : 
      <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Platform Payment Settings</h1>
          <p className="text-muted-foreground">
            Configure how your platform receives payments and pays out creators
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <AddAccountDialog 
              onSuccess={() => setShowAddDialog(false)}
              onCreateAccount={createAccount}
              onSetupStripeConnect={setupStripeConnect}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Overview */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">${dashboardStats.available_balance.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Fees Collected</p>
                  <p className="text-2xl font-bold">${dashboardStats.total_fees_collected.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Creators</p>
                  <p className="text-2xl font-bold">{dashboardStats.active_creators}</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Growth</p>
                  <p className="text-2xl font-bold">{dashboardStats.growth_percentage > 0 ? '+' : ''}{dashboardStats.growth_percentage.toFixed(1)}%</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Payment Accounts</TabsTrigger>
          <TabsTrigger value="settings">Platform Settings</TabsTrigger>
          <TabsTrigger value="payouts">Payout Management</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {accountsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payment Accounts</h3>
                <p className="text-muted-foreground mb-4">
                  Add a payment account to start receiving payments and paying out creators
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => (
                <Card key={account.id} className={account.is_primary ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getAccountIcon(account.account_type)}
                        <div>
                          <CardTitle className="text-lg">{account.account_name}</CardTitle>
                          <CardDescription>
                            {account.account_type === 'stripe_connect' && 'Stripe Connect'}
                            {account.account_type === 'bank_account' && 'Bank Account'}
                            {account.account_type === 'paypal' && 'PayPal'}
                            {account.is_primary && ' • Primary Account'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(account)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAccount(account.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {account.account_type === 'stripe_connect' && (
                        <>
                          <div>
                            <Label className="text-sm text-muted-foreground">Account ID</Label>
                            <p className="font-mono text-sm">{account.stripe_account_id}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Charges Enabled</Label>
                            <p className="flex items-center space-x-1">
                              {account.stripe_charges_enabled ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span>{account.stripe_charges_enabled ? 'Yes' : 'No'}</span>
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Payouts Enabled</Label>
                            <p className="flex items-center space-x-1">
                              {account.stripe_payouts_enabled ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span>{account.stripe_payouts_enabled ? 'Yes' : 'No'}</span>
                            </p>
                          </div>
                        </>
                      )}
                      
                      {account.account_type === 'bank_account' && (
                        <>
                          <div>
                            <Label className="text-sm text-muted-foreground">Bank Name</Label>
                            <p>{account.bank_name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Account Holder</Label>
                            <p>{account.bank_account_holder_name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Routing Number</Label>
                            <p className="font-mono">****{account.bank_routing_number?.slice(-4)}</p>
                          </div>
                        </>
                      )}
                      
                      {account.account_type === 'paypal' && (
                        <>
                          <div>
                            <Label className="text-sm text-muted-foreground">PayPal Email</Label>
                            <p>{account.paypal_email}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Account ID</Label>
                            <p className="font-mono text-sm">{account.paypal_account_id}</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {account.account_type === 'stripe_connect' && !account.stripe_details_submitted && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            Account setup is incomplete. Complete your Stripe onboarding to start receiving payments.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Complete Setup
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <PlatformSettingsTab 
            primaryAccount={primaryAccount}
            onUpdateAccount={updateAccount}
          />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutManagementTab />
        </TabsContent>
      </Tabs>

      {/* Edit Account Dialog */}
      {editingAccount && (
        <EditAccountDialog
          accountId={editingAccount}
          account={accounts.find(a => a.id === editingAccount)}
          onClose={() => setEditingAccount(null)}
          onUpdateAccount={updateAccount}
          onDeleteAccount={deleteAccount}
        />
      )}
    </div>
  );
};

// Add Account Dialog Component
const AddAccountDialog: React.FC<{
  onSuccess: () => void;
  onCreateAccount: (request: CreatePlatformAccountRequest) => Promise<{ success: boolean; error?: string }>;
  onSetupStripeConnect: (request: any) => Promise<{ success: boolean; onboardingUrl?: string; error?: string }>;
}> = ({ onSuccess, onCreateAccount, onSetupStripeConnect }) => {
  const [accountType, setAccountType] = useState<'stripe_connect' | 'bank_account' | 'paypal'>('stripe_connect');
  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    routing_number: '',
    account_type: 'checking' as 'checking' | 'savings',
    paypal_email: '',
    is_primary: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (accountType === 'stripe_connect') {
        const result = await onSetupStripeConnect({
          business_type: 'individual',
          country: 'US',
          return_url: `${window.location.origin}/admin/platform-settings?setup=success`,
          refresh_url: `${window.location.origin}/admin/platform-settings?setup=refresh`
        });

        if (result.success && result.onboardingUrl) {
          window.location.href = result.onboardingUrl;
        } else {
          setError(result.error || 'Failed to setup Stripe Connect');
        }
      } else {
        const request: CreatePlatformAccountRequest = {
          account_type: accountType,
          account_name: formData.account_name,
          is_primary: formData.is_primary
        };

        if (accountType === 'bank_account') {
          request.bank_details = {
            bank_name: formData.bank_name,
            account_holder_name: formData.account_holder_name,
            account_number: formData.account_number,
            routing_number: formData.routing_number,
            account_type: formData.account_type
          };
        } else if (accountType === 'paypal') {
          request.paypal_details = {
            email: formData.paypal_email
          };
        }

        const result = await onCreateAccount(request);
        if (result.success) {
          onSuccess();
        } else {
          setError(result.error || 'Failed to create account');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Payment Account</DialogTitle>
        <DialogDescription>
          Configure how your platform will receive payments from subscribers
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label>Account Type</Label>
          <Select value={accountType} onValueChange={(value: any) => setAccountType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe_connect">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Stripe Connect (Recommended)</span>
                </div>
              </SelectItem>
              <SelectItem value="bank_account">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Bank Account</span>
                </div>
              </SelectItem>
              <SelectItem value="paypal">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4" />
                  <span>PayPal</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="account_name">Account Name</Label>
          <Input
            id="account_name"
            value={formData.account_name}
            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
            placeholder="My Platform Account"
            required
          />
        </div>

        {accountType === 'stripe_connect' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Stripe Connect will handle all payment processing, compliance, and payouts automatically.
              You'll be redirected to Stripe to complete the setup.
            </AlertDescription>
          </Alert>
        )}

        {accountType === 'bank_account' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Chase Bank"
                required
              />
            </div>
            <div>
              <Label htmlFor="account_holder_name">Account Holder Name</Label>
              <Input
                id="account_holder_name"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                placeholder="Your Business Name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="routing_number">Routing Number</Label>
                <Input
                  id="routing_number"
                  value={formData.routing_number}
                  onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                  placeholder="123456789"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  type="password"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Account Type</Label>
              <Select value={formData.account_type} onValueChange={(value: 'checking' | 'savings') => setFormData({ ...formData, account_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {accountType === 'paypal' && (
          <div>
            <Label htmlFor="paypal_email">PayPal Email</Label>
            <Input
              id="paypal_email"
              type="email"
              value={formData.paypal_email}
              onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
              placeholder="your-business@example.com"
              required
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="is_primary"
            checked={formData.is_primary}
            onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
          />
          <Label htmlFor="is_primary">Set as primary payment account</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => {}}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : accountType === 'stripe_connect' ? 'Setup with Stripe' : 'Create Account'}
          </Button>
        </div>
      </form>
    </>
  );
};

// Platform Settings Tab Component
const PlatformSettingsTab: React.FC<{
  primaryAccount: any;
  onUpdateAccount: (accountId: string, updates: UpdatePlatformAccountRequest) => Promise<{ success: boolean; error?: string }>;
}> = ({ primaryAccount, onUpdateAccount }) => {
  const [settings, setSettings] = useState({
    auto_payout_enabled: primaryAccount?.auto_payout_enabled || false,
    payout_schedule: primaryAccount?.payout_schedule || 'weekly',
    payout_day: primaryAccount?.payout_day || 5,
    minimum_payout_amount: primaryAccount?.minimum_payout_amount || 25.00
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!primaryAccount) return;
    
    setLoading(true);
    try {
      const result = await onUpdateAccount(primaryAccount.id, settings);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>
          Configure automatic payouts and platform-wide settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settings updated successfully!</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Automatic Payouts</Label>
            <p className="text-sm text-muted-foreground">
              Automatically pay creators based on your schedule
            </p>
          </div>
          <Switch
            checked={settings.auto_payout_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, auto_payout_enabled: checked })}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Payout Schedule</Label>
            <Select 
              value={settings.payout_schedule} 
              onValueChange={(value) => setSettings({ ...settings, payout_schedule: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              {settings.payout_schedule === 'weekly' ? 'Day of Week' : 'Day of Month'}
            </Label>
            <Input
              type="number"
              min={settings.payout_schedule === 'weekly' ? 0 : 1}
              max={settings.payout_schedule === 'weekly' ? 6 : 31}
              value={settings.payout_day}
              onChange={(e) => setSettings({ ...settings, payout_day: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {settings.payout_schedule === 'weekly' 
                ? '0=Sunday, 1=Monday, ..., 6=Saturday' 
                : 'Day of the month (1-31)'}
            </p>
          </div>
        </div>

        <div>
          <Label>Minimum Payout Amount</Label>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={settings.minimum_payout_amount}
            onChange={(e) => setSettings({ ...settings, minimum_payout_amount: parseFloat(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Creators must have at least this amount to request a payout
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading || !primaryAccount}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Payout Management Tab Component
const PayoutManagementTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Management</CardTitle>
        <CardDescription>
          Manage creator payouts and view payout history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Payout Management</h3>
          <p className="text-muted-foreground">
            Payout management features will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Edit Account Dialog Component
const EditAccountDialog: React.FC<{
  accountId: string;
  account: any;
  onClose: () => void;
  onUpdateAccount: (accountId: string, updates: UpdatePlatformAccountRequest) => Promise<{ success: boolean; error?: string }>;
  onDeleteAccount: (accountId: string) => Promise<{ success: boolean; error?: string }>;
}> = ({ accountId, account, onClose, onUpdateAccount, onDeleteAccount }) => {
  // Implementation would go here
  return null;
};