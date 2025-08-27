import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  PaymentMethodService,
  PaymentMethodServiceResult 
} from '@/services/paymentMethodService';
import { 
  PaymentMethodInfo, 
  CreatePaymentMethodRequest, 
  PaymentMethodValidationResult,
  PaymentMethodVerification,
  PaymentInstructions
} from '@/types/subscription';
import { useToast } from './use-toast';

export const usePaymentMethods = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load payment methods
  const loadPaymentMethods = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await PaymentMethodService.getUserPaymentMethods(user.id);
      
      if (result.success && result.data) {
        setPaymentMethods(result.data);
      } else {
        setError(result.error || 'Failed to load payment methods');
      }
    } catch (err) {
      setError('Failed to load payment methods');
      console.error('Error loading payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create payment method
  const createPaymentMethod = async (paymentMethod: CreatePaymentMethodRequest): Promise<PaymentMethodServiceResult<PaymentMethodInfo>> => {
    setActionLoading(true);
    
    try {
      const result = await PaymentMethodService.createPaymentMethod(paymentMethod);
      
      if (result.success) {
        await loadPaymentMethods(); // Refresh the list
        toast({
          title: "Payment method added",
          description: "Your payment method has been successfully added."
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add payment method",
          variant: "destructive"
        });
      }
      
      return result;
    } catch (err) {
      const error = "Failed to add payment method";
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setActionLoading(false);
    }
  };

  // Update payment method
  const updatePaymentMethod = async (
    paymentMethodId: string, 
    updates: Partial<CreatePaymentMethodRequest>
  ): Promise<PaymentMethodServiceResult<PaymentMethodInfo>> => {
    setActionLoading(true);
    
    try {
      const result = await PaymentMethodService.updatePaymentMethod(paymentMethodId, updates);
      
      if (result.success) {
        await loadPaymentMethods(); // Refresh the list
        toast({
          title: "Payment method updated",
          description: "Your payment method has been successfully updated."
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update payment method",
          variant: "destructive"
        });
      }
      
      return result;
    } catch (err) {
      const error = "Failed to update payment method";
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setActionLoading(false);
    }
  };

  // Delete payment method
  const deletePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    setActionLoading(true);
    
    try {
      const result = await PaymentMethodService.deletePaymentMethod(paymentMethodId);
      
      if (result.success) {
        await loadPaymentMethods(); // Refresh the list
        toast({
          title: "Payment method removed",
          description: "Your payment method has been successfully removed."
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove payment method",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive"
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Set default payment method
  const setDefaultPaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    setActionLoading(true);
    
    try {
      const result = await PaymentMethodService.setDefaultPaymentMethod(paymentMethodId);
      
      if (result.success) {
        await loadPaymentMethods(); // Refresh the list
        toast({
          title: "Default payment method updated",
          description: "Your default payment method has been updated."
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update default payment method",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive"
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Validate payment method
  const validatePaymentMethod = async (
    paymentMethodId: string, 
    amount: number
  ): Promise<PaymentMethodValidationResult | null> => {
    if (!user?.id) return null;
    
    try {
      const result = await PaymentMethodService.validatePaymentMethod(paymentMethodId, user.id, amount);
      return result.success ? result.data || null : null;
    } catch (err) {
      console.error('Error validating payment method:', err);
      return null;
    }
  };

  // Get default payment method
  const getDefaultPaymentMethod = (): PaymentMethodInfo | null => {
    return paymentMethods.find(pm => pm.is_default) || null;
  };

  // Get payment methods by type
  const getPaymentMethodsByType = (type: PaymentMethodInfo['type']): PaymentMethodInfo[] => {
    return paymentMethods.filter(pm => pm.type === type);
  };

  // Load payment methods on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadPaymentMethods();
    } else {
      setPaymentMethods([]);
      setLoading(false);
    }
  }, [user?.id]);

  return {
    paymentMethods,
    loading,
    error,
    actionLoading,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    validatePaymentMethod,
    getDefaultPaymentMethod,
    getPaymentMethodsByType,
    refreshPaymentMethods: loadPaymentMethods
  };
};

export const usePaymentInstructions = (communityId: string) => {
  const [instructions, setInstructions] = useState<PaymentInstructions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInstructions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await PaymentMethodService.getCommunityPaymentInstructions(communityId);
      
      if (result.success && result.data) {
        setInstructions(result.data);
      } else {
        setError(result.error || 'Failed to load payment instructions');
      }
    } catch (err) {
      setError('Failed to load payment instructions');
      console.error('Error loading payment instructions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (communityId) {
      loadInstructions();
    }
  }, [communityId]);

  return {
    instructions,
    loading,
    error,
    refreshInstructions: loadInstructions
  };
};

export const usePaymentMethodVerification = (paymentMethodId?: string) => {
  const [verifications, setVerifications] = useState<PaymentMethodVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadVerifications = async () => {
    if (!paymentMethodId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await PaymentMethodService.getPaymentMethodVerifications(paymentMethodId);
      
      if (result.success && result.data) {
        setVerifications(result.data);
      } else {
        setError(result.error || 'Failed to load verifications');
      }
    } catch (err) {
      setError('Failed to load verifications');
      console.error('Error loading verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const createVerification = async (
    verificationType: 'micro_deposits' | 'instant' | 'manual'
  ): Promise<PaymentMethodVerification | null> => {
    if (!paymentMethodId) return null;
    
    try {
      const result = await PaymentMethodService.createPaymentMethodVerification(paymentMethodId, verificationType);
      
      if (result.success && result.data) {
        await loadVerifications(); // Refresh the list
        toast({
          title: "Verification started",
          description: `${verificationType.replace('_', ' ')} verification has been initiated.`
        });
        return result.data;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to start verification",
          variant: "destructive"
        });
        return null;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start verification",
        variant: "destructive"
      });
      return null;
    }
  };

  const verifyMicroDeposits = async (
    verificationId: string,
    amounts: number[]
  ): Promise<boolean> => {
    try {
      const result = await PaymentMethodService.verifyMicroDeposits(verificationId, amounts);
      
      if (result.success) {
        await loadVerifications(); // Refresh the list
        toast({
          title: "Verification successful",
          description: "Your bank account has been successfully verified."
        });
        return true;
      } else {
        toast({
          title: "Verification failed",
          description: result.error || "Failed to verify micro deposits",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to verify micro deposits",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (paymentMethodId) {
      loadVerifications();
    }
  }, [paymentMethodId]);

  return {
    verifications,
    loading,
    error,
    createVerification,
    verifyMicroDeposits,
    refreshVerifications: loadVerifications
  };
};