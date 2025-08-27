import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { WalletService } from '@/services/walletService';
import {
  CreatorWallet,
  WalletTransaction,
  PayoutRequest,
  WalletStats,
  WalletSummary,
  TransactionFilter,
  EarningsBreakdown,
  CreatePayoutRequest,
  PayoutRequestResult
} from '@/types/wallet';

export interface UseWalletReturn {
  wallet: CreatorWallet | null;
  walletStats: WalletStats | null;
  walletSummary: WalletSummary | null;
  transactions: WalletTransaction[];
  payoutRequests: PayoutRequest[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshWallet: () => Promise<void>;
  refreshTransactions: (filter?: TransactionFilter) => Promise<void>;
  refreshPayoutRequests: () => Promise<void>;
  requestPayout: (request: CreatePayoutRequest) => Promise<PayoutRequestResult>;
  updatePayoutMethod: (payoutMethod: any) => Promise<boolean>;
  getEarningsBreakdown: (startDate: string, endDate: string) => Promise<EarningsBreakdown | null>;
}

export function useWallet(): UseWalletReturn {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet
  const initializeWallet = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const walletData = await WalletService.getOrCreateWallet(user.id);
      if (walletData) {
        setWallet(walletData);
        
        // Load additional data
        const [stats, summary, txns, payouts] = await Promise.all([
          WalletService.getWalletStats(walletData.id),
          WalletService.getWalletSummary(walletData.id),
          WalletService.getWalletTransactions(walletData.id, { limit: 50 }),
          WalletService.getPayoutRequests(walletData.id)
        ]);

        setWalletStats(stats);
        setWalletSummary(summary);
        setTransactions(txns);
        setPayoutRequests(payouts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  // Refresh wallet data
  const refreshWallet = async () => {
    if (!wallet) return;

    try {
      const [updatedWallet, stats, summary] = await Promise.all([
        WalletService.getWalletById(wallet.id),
        WalletService.getWalletStats(wallet.id),
        WalletService.getWalletSummary(wallet.id)
      ]);

      if (updatedWallet) setWallet(updatedWallet);
      setWalletStats(stats);
      setWalletSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh wallet');
    }
  };

  // Refresh transactions
  const refreshTransactions = async (filter?: TransactionFilter) => {
    if (!wallet) return;

    try {
      const txns = await WalletService.getWalletTransactions(wallet.id, filter);
      setTransactions(txns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh transactions');
    }
  };

  // Refresh payout requests
  const refreshPayoutRequests = async () => {
    if (!wallet) return;

    try {
      const payouts = await WalletService.getPayoutRequests(wallet.id);
      setPayoutRequests(payouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh payout requests');
    }
  };

  // Request payout
  const requestPayout = async (request: CreatePayoutRequest): Promise<PayoutRequestResult> => {
    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    try {
      const result = await WalletService.requestPayout(request);
      if (result.success) {
        // Refresh wallet and payout requests
        await Promise.all([refreshWallet(), refreshPayoutRequests()]);
      }
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Payout request failed'
      };
    }
  };

  // Update payout method
  const updatePayoutMethod = async (payoutMethod: any): Promise<boolean> => {
    if (!wallet) return false;

    try {
      const success = await WalletService.updatePayoutMethod(wallet.id, payoutMethod);
      if (success) {
        await refreshWallet();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payout method');
      return false;
    }
  };

  // Get earnings breakdown
  const getEarningsBreakdown = async (
    startDate: string,
    endDate: string
  ): Promise<EarningsBreakdown | null> => {
    if (!wallet) return null;

    try {
      return await WalletService.getEarningsBreakdown(wallet.id, startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get earnings breakdown');
      return null;
    }
  };

  // Initialize on mount and user change
  useEffect(() => {
    if (user) {
      initializeWallet();
    } else {
      // Clear wallet data when user logs out
      setWallet(null);
      setWalletStats(null);
      setWalletSummary(null);
      setTransactions([]);
      setPayoutRequests([]);
    }
  }, [user]);

  return {
    wallet,
    walletStats,
    walletSummary,
    transactions,
    payoutRequests,
    loading,
    error,
    refreshWallet,
    refreshTransactions,
    refreshPayoutRequests,
    requestPayout,
    updatePayoutMethod,
    getEarningsBreakdown
  };
}

// Hook for specific wallet operations
export function useWalletOperations(walletId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (
    subscriptionId: string,
    amount: number,
    currency: string = 'USD'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await WalletService.processSubscriptionPayment(
        subscriptionId,
        amount,
        currency
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionHistory = async (filter?: TransactionFilter) => {
    if (!walletId) return [];

    setLoading(true);
    setError(null);

    try {
      return await WalletService.getWalletTransactions(walletId, filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    processPayment,
    getTransactionHistory
  };
}