import { useState, useEffect, useCallback } from 'react';
import {
  PlatformAccountConfig,
  PlatformTransaction,
  PlatformBalance,
  CreatePlatformAccountRequest,
  UpdatePlatformAccountRequest,
  PlatformDashboardStats,
  StripeConnectAccountInfo
} from '@/types/platformAccount';
import { PlatformAccountService } from '@/services/platformAccountService';

export interface UsePlatformAccountResult {
  // Data
  accounts: PlatformAccountConfig[];
  primaryAccount: PlatformAccountConfig | null;
  balance: PlatformBalance | null;
  transactions: PlatformTransaction[];
  dashboardStats: PlatformDashboardStats | null;
  stripeConnectInfo: StripeConnectAccountInfo | null;
  
  // Loading states
  loading: boolean;
  accountsLoading: boolean;
  balanceLoading: boolean;
  transactionsLoading: boolean;
  dashboardLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  createAccount: (request: CreatePlatformAccountRequest) => Promise<{ success: boolean; error?: string }>;
  updateAccount: (accountId: string, updates: UpdatePlatformAccountRequest) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  setupStripeConnect: (request: any) => Promise<{ success: boolean; onboardingUrl?: string; error?: string }>;
  refreshAccounts: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: (filters?: any) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshStripeInfo: (accountId: string) => Promise<void>;
}

export const usePlatformAccount = (): UsePlatformAccountResult => {
  // State
  const [accounts, setAccounts] = useState<PlatformAccountConfig[]>([]);
  const [primaryAccount, setPrimaryAccount] = useState<PlatformAccountConfig | null>(null);
  const [balance, setBalance] = useState<PlatformBalance | null>(null);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [dashboardStats, setDashboardStats] = useState<PlatformDashboardStats | null>(null);
  const [stripeConnectInfo, setStripeConnectInfo] = useState<StripeConnectAccountInfo | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  const refreshAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.getPlatformAccounts();
      if (result.success && result.data) {
        setAccounts(result.data);
        
        // Set primary account
        const primary = result.data.find(account => account.is_primary && account.is_active);
        setPrimaryAccount(primary || null);
      } else {
        setError(result.error || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  // Fetch balance
  const refreshBalance = useCallback(async () => {
    setBalanceLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.getPlatformBalance();
      if (result.success) {
        setBalance(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch balance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // Fetch transactions
  const refreshTransactions = useCallback(async (filters?: any) => {
    setTransactionsLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.getPlatformTransactions(filters);
      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        setError(result.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Fetch dashboard stats
  const refreshDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.getPlatformDashboardStats();
      if (result.success && result.data) {
        setDashboardStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Fetch Stripe Connect info
  const refreshStripeInfo = useCallback(async (accountId: string) => {
    try {
      const result = await PlatformAccountService.getStripeConnectInfo(accountId);
      if (result.success && result.data) {
        setStripeConnectInfo(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch Stripe info:', err);
    }
  }, []);

  // Create account
  const createAccount = useCallback(async (request: CreatePlatformAccountRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.upsertPlatformAccount(request);
      if (result.success) {
        await refreshAccounts();
        if (request.is_primary) {
          await refreshBalance();
        }
        return { success: true };
      } else {
        setError(result.error || 'Failed to create account');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [refreshAccounts, refreshBalance]);

  // Update account
  const updateAccount = useCallback(async (accountId: string, updates: UpdatePlatformAccountRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.updatePlatformAccount(accountId, updates);
      if (result.success) {
        await refreshAccounts();
        if (updates.is_primary) {
          await refreshBalance();
        }
        return { success: true };
      } else {
        setError(result.error || 'Failed to update account');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update account';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [refreshAccounts, refreshBalance]);

  // Delete account
  const deleteAccount = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.deletePlatformAccount(accountId);
      if (result.success) {
        await refreshAccounts();
        return { success: true };
      } else {
        setError(result.error || 'Failed to delete account');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [refreshAccounts]);

  // Setup Stripe Connect
  const setupStripeConnect = useCallback(async (request: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await PlatformAccountService.setupStripeConnect(request);
      if (result.success) {
        await refreshAccounts();
        return { 
          success: true, 
          onboardingUrl: result.onboarding_url 
        };
      } else {
        setError(result.error || 'Failed to setup Stripe Connect');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to setup Stripe Connect';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [refreshAccounts]);

  // Initial data fetch
  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // Fetch balance and dashboard when primary account changes
  useEffect(() => {
    if (primaryAccount) {
      refreshBalance();
      refreshDashboard();
      
      // Fetch Stripe info if it's a Stripe Connect account
      if (primaryAccount.account_type === 'stripe_connect' && primaryAccount.stripe_account_id) {
        refreshStripeInfo(primaryAccount.stripe_account_id);
      }
    }
  }, [primaryAccount, refreshBalance, refreshDashboard, refreshStripeInfo]);

  // Fetch transactions when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0) {
      refreshTransactions();
    }
  }, [accounts, refreshTransactions]);

  return {
    // Data
    accounts,
    primaryAccount,
    balance,
    transactions,
    dashboardStats,
    stripeConnectInfo,
    
    // Loading states
    loading,
    accountsLoading,
    balanceLoading,
    transactionsLoading,
    dashboardLoading,
    
    // Error state
    error,
    
    // Actions
    createAccount,
    updateAccount,
    deleteAccount,
    setupStripeConnect,
    refreshAccounts,
    refreshBalance,
    refreshTransactions,
    refreshDashboard,
    refreshStripeInfo
  };
};