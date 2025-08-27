import { supabase } from '@/integrations/supabase/client';
import { 
  PaymentMethodInfo, 
  CreatePaymentMethodRequest, 
  PaymentMethodValidationResult,
  PaymentMethodVerification,
  PaymentInstructions
} from '@/types/subscription';

export interface PaymentMethodServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PaymentMethodService {
  /**
   * Get all payment methods for a user
   */
  static async getUserPaymentMethods(userId?: string): Promise<PaymentMethodServiceResult<PaymentMethodInfo[]>> {
    try {
      const { data, error } = await supabase.rpc('get_user_payment_methods', {
        p_user_id: userId || null
      });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment methods'
      };
    }
  }

  /**
   * Create a new payment method
   */
  static async createPaymentMethod(paymentMethod: CreatePaymentMethodRequest): Promise<PaymentMethodServiceResult<PaymentMethodInfo>> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          type: paymentMethod.type,
          display_name: paymentMethod.display_name,
          is_default: paymentMethod.is_default || false,
          card_last4: paymentMethod.card_last4,
          card_brand: paymentMethod.card_brand,
          card_exp_month: paymentMethod.card_exp_month,
          card_exp_year: paymentMethod.card_exp_year,
          paypal_email: paymentMethod.paypal_email,
          paypal_account_id: paymentMethod.paypal_account_id,
          bank_name: paymentMethod.bank_name,
          bank_account_last4: paymentMethod.bank_account_last4,
          bank_routing_number: paymentMethod.bank_routing_number,
          bank_account_type: paymentMethod.bank_account_type,
          bank_account_holder_name: paymentMethod.bank_account_holder_name,
          stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
          paypal_payment_method_id: paymentMethod.paypal_payment_method_id
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentMethodInfo
      };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment method'
      };
    }
  }

  /**
   * Update a payment method
   */
  static async updatePaymentMethod(
    paymentMethodId: string, 
    updates: Partial<CreatePaymentMethodRequest>
  ): Promise<PaymentMethodServiceResult<PaymentMethodInfo>> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', paymentMethodId)
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentMethodInfo
      };
    } catch (error) {
      console.error('Error updating payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment method'
      };
    }
  }

  /**
   * Delete a payment method
   */
  static async deletePaymentMethod(paymentMethodId: string): Promise<PaymentMethodServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete payment method'
      };
    }
  }

  /**
   * Set a payment method as default
   */
  static async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethodServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set default payment method'
      };
    }
  }

  /**
   * Validate a payment method for subscription
   */
  static async validatePaymentMethod(
    paymentMethodId: string, 
    userId: string, 
    amount: number
  ): Promise<PaymentMethodServiceResult<PaymentMethodValidationResult>> {
    try {
      const { data, error } = await supabase.rpc('validate_payment_method_for_subscription', {
        p_payment_method_id: paymentMethodId,
        p_user_id: userId,
        p_amount: amount
      });

      if (error) throw error;

      return {
        success: true,
        data: data?.[0] as PaymentMethodValidationResult
      };
    } catch (error) {
      console.error('Error validating payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate payment method'
      };
    }
  }

  /**
   * Get payment method verifications
   */
  static async getPaymentMethodVerifications(paymentMethodId: string): Promise<PaymentMethodServiceResult<PaymentMethodVerification[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_method_verifications')
        .select('*')
        .eq('payment_method_id', paymentMethodId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentMethodVerification[]
      };
    } catch (error) {
      console.error('Error fetching payment method verifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch verifications'
      };
    }
  }

  /**
   * Create payment method verification
   */
  static async createPaymentMethodVerification(
    paymentMethodId: string,
    verificationType: 'micro_deposits' | 'instant' | 'manual'
  ): Promise<PaymentMethodServiceResult<PaymentMethodVerification>> {
    try {
      const verificationData: any = {
        payment_method_id: paymentMethodId,
        verification_type: verificationType,
        status: 'pending'
      };

      // For micro deposits, generate random amounts
      if (verificationType === 'micro_deposits') {
        verificationData.micro_deposit_amounts = [
          Math.floor(Math.random() * 99) + 1,
          Math.floor(Math.random() * 99) + 1
        ];
        verificationData.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      // For manual verification, generate a code
      if (verificationType === 'manual') {
        verificationData.verification_code = Math.random().toString(36).substr(2, 8).toUpperCase();
        verificationData.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      const { data, error } = await supabase
        .from('payment_method_verifications')
        .insert(verificationData)
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentMethodVerification
      };
    } catch (error) {
      console.error('Error creating payment method verification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create verification'
      };
    }
  }

  /**
   * Verify payment method with micro deposits
   */
  static async verifyMicroDeposits(
    verificationId: string,
    amounts: number[]
  ): Promise<PaymentMethodServiceResult<void>> {
    try {
      // Get the verification record
      const { data: verification, error: fetchError } = await supabase
        .from('payment_method_verifications')
        .select('*')
        .eq('id', verificationId)
        .single();

      if (fetchError) throw fetchError;

      if (!verification.micro_deposit_amounts) {
        throw new Error('No micro deposit amounts found');
      }

      // Check if amounts match
      const isMatch = amounts.length === verification.micro_deposit_amounts.length &&
        amounts.every((amount, index) => amount === verification.micro_deposit_amounts[index]);

      const updates: any = {
        attempts: verification.attempts + 1
      };

      if (isMatch) {
        updates.status = 'verified';
        updates.verified_at = new Date().toISOString();
      } else if (verification.attempts + 1 >= verification.max_attempts) {
        updates.status = 'failed';
      }

      const { error } = await supabase
        .from('payment_method_verifications')
        .update(updates)
        .eq('id', verificationId);

      if (error) throw error;

      if (!isMatch && verification.attempts + 1 < verification.max_attempts) {
        throw new Error(`Incorrect amounts. ${verification.max_attempts - (verification.attempts + 1)} attempts remaining.`);
      }

      if (!isMatch) {
        throw new Error('Verification failed. Maximum attempts exceeded.');
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying micro deposits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify micro deposits'
      };
    }
  }

  /**
   * Get payment instructions for a community
   */
  static async getCommunityPaymentInstructions(communityId: string): Promise<PaymentMethodServiceResult<PaymentInstructions[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_instructions')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentInstructions[]
      };
    } catch (error) {
      console.error('Error fetching payment instructions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment instructions'
      };
    }
  }

  /**
   * Create payment instructions for a community (admin only)
   */
  static async createPaymentInstructions(instructions: Omit<PaymentInstructions, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentMethodServiceResult<PaymentInstructions>> {
    try {
      const { data, error } = await supabase
        .from('payment_instructions')
        .insert(instructions)
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentInstructions
      };
    } catch (error) {
      console.error('Error creating payment instructions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment instructions'
      };
    }
  }
}

// Export convenience functions
export const getUserPaymentMethods = PaymentMethodService.getUserPaymentMethods;
export const createPaymentMethod = PaymentMethodService.createPaymentMethod;
export const updatePaymentMethod = PaymentMethodService.updatePaymentMethod;
export const deletePaymentMethod = PaymentMethodService.deletePaymentMethod;
export const setDefaultPaymentMethod = PaymentMethodService.setDefaultPaymentMethod;
export const validatePaymentMethod = PaymentMethodService.validatePaymentMethod;
export const getPaymentMethodVerifications = PaymentMethodService.getPaymentMethodVerifications;
export const createPaymentMethodVerification = PaymentMethodService.createPaymentMethodVerification;
export const verifyMicroDeposits = PaymentMethodService.verifyMicroDeposits;
export const getCommunityPaymentInstructions = PaymentMethodService.getCommunityPaymentInstructions;
export const createPaymentInstructions = PaymentMethodService.createPaymentInstructions;