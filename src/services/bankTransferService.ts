// Bank Transfer Service for handling manual bank transfer payments
// This service manages bank transfer instructions and payment confirmations

import { supabase } from '@/integrations/supabase/client';
import { PaymentInstructions } from '@/types/subscription';

export interface BankTransferPaymentRequest {
  subscriptionId: string;
  amount: number;
  currency: string;
  bankTransferDetails: {
    senderName: string;
    senderAccount: string;
    referenceNumber?: string;
    transferDate: string;
    bankName?: string;
  };
}

export interface BankTransferResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  requiresConfirmation?: boolean;
}

export interface PendingBankTransfer {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  sender_name: string;
  sender_account: string;
  reference_number?: string;
  transfer_date: string;
  bank_name?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  submitted_at: string;
  confirmed_at?: string;
  notes?: string;
}

export class BankTransferService {
  /**
   * Submit a bank transfer payment for manual verification
   */
  static async submitBankTransferPayment(request: BankTransferPaymentRequest): Promise<BankTransferResult> {
    try {
      // Create a pending bank transfer record
      const { data, error } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: request.subscriptionId,
          amount: request.amount,
          currency: request.currency,
          status: 'pending',
          payment_method: 'bank_transfer',
          due_date: new Date().toISOString(),
          external_payment_id: `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          // Store bank transfer details in metadata (if your schema supports it)
        })
        .select('*')
        .single();

      if (error) throw error;

      // In a real implementation, you might also create a separate table for bank transfer details
      // or send an email notification to admins for manual verification

      return {
        success: true,
        paymentId: data.id,
        requiresConfirmation: true
      };
    } catch (error) {
      console.error('Bank transfer submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit bank transfer'
      };
    }
  }

  /**
   * Get pending bank transfers for admin review
   */
  static async getPendingBankTransfers(): Promise<PendingBankTransfer[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          community_member_subscriptions (
            community_id,
            user_id,
            communities (name)
          )
        `)
        .eq('payment_method', 'bank_transfer')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(payment => ({
        id: payment.id,
        subscription_id: payment.subscription_id,
        amount: payment.amount,
        currency: payment.currency,
        sender_name: 'Unknown', // This would come from metadata in a real implementation
        sender_account: 'Unknown',
        reference_number: payment.external_payment_id,
        transfer_date: payment.created_at,
        status: 'pending',
        submitted_at: payment.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching pending bank transfers:', error);
      return [];
    }
  }

  /**
   * Confirm a bank transfer payment (admin only)
   */
  static async confirmBankTransferPayment(
    paymentId: string,
    notes?: string
  ): Promise<BankTransferResult> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .eq('payment_method', 'bank_transfer')
        .select('*')
        .single();

      if (error) throw error;

      // Update the subscription status to active if this was the payment they were waiting for
      await supabase
        .from('community_member_subscriptions')
        .update({
          status: 'active'
        })
        .eq('id', data.subscription_id)
        .eq('status', 'past_due');

      return {
        success: true,
        paymentId: data.id
      };
    } catch (error) {
      console.error('Bank transfer confirmation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm bank transfer'
      };
    }
  }

  /**
   * Reject a bank transfer payment (admin only)
   */
  static async rejectBankTransferPayment(
    paymentId: string,
    reason: string
  ): Promise<BankTransferResult> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .update({
          status: 'failed'
        })
        .eq('id', paymentId)
        .eq('payment_method', 'bank_transfer')
        .select('*')
        .single();

      if (error) throw error;

      // You might want to send an email notification to the user here
      // explaining why their bank transfer was rejected

      return {
        success: true,
        paymentId: data.id
      };
    } catch (error) {
      console.error('Bank transfer rejection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject bank transfer'
      };
    }
  }

  /**
   * Generate bank transfer instructions for a community
   */
  static generateBankInstructions(
    communityName: string,
    amount: number,
    currency: string = 'USD',
    subscriptionId?: string
  ): string {
    const referenceNumber = subscriptionId || `SUB_${Date.now()}`;
    
    return `Bank Transfer Instructions:

1. Transfer the exact amount of ${currency} ${amount.toFixed(2)} to the account details provided.

2. Use the reference number: ${referenceNumber}

3. Include your full name as it appears on your subscription.

4. Bank transfers typically take 1-3 business days to process.

5. Once we receive and verify your payment, your subscription to ${communityName} will be activated.

6. You will receive an email confirmation once your payment is processed.

Important Notes:
- Make sure to include the reference number in your transfer description
- The exact amount must match your subscription fee
- International transfers may incur additional fees
- Contact support if you have any questions about the transfer process

Thank you for your payment!`;
  }

  /**
   * Validate bank transfer details
   */
  static validateBankTransferDetails(details: BankTransferPaymentRequest['bankTransferDetails']): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!details.senderName?.trim()) {
      errors.push('Sender name is required');
    }

    if (!details.senderAccount?.trim()) {
      errors.push('Sender account information is required');
    }

    if (!details.transferDate) {
      errors.push('Transfer date is required');
    } else {
      const transferDate = new Date(details.transferDate);
      const now = new Date();
      const maxPastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      if (transferDate > now) {
        errors.push('Transfer date cannot be in the future');
      }
      
      if (transferDate < maxPastDate) {
        errors.push('Transfer date cannot be more than 30 days ago');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create default bank transfer instructions for a community
   */
  static async createDefaultBankInstructions(
    communityId: string,
    bankDetails: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      routingNumber?: string;
      swiftCode?: string;
      iban?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const instructions = this.generateBankInstructions('this community', 0);
      
      const { error } = await supabase
        .from('payment_instructions')
        .insert({
          community_id: communityId,
          payment_type: 'bank_transfer',
          title: 'Bank Wire Transfer',
          instructions,
          bank_name: bankDetails.bankName,
          account_name: bankDetails.accountName,
          account_number: bankDetails.accountNumber,
          routing_number: bankDetails.routingNumber,
          swift_code: bankDetails.swiftCode,
          iban: bankDetails.iban,
          is_active: true
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error creating bank instructions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bank instructions'
      };
    }
  }

  /**
   * Update bank transfer instructions for a community
   */
  static async updateBankInstructions(
    instructionId: string,
    updates: Partial<PaymentInstructions>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('payment_instructions')
        .update(updates)
        .eq('id', instructionId)
        .eq('payment_type', 'bank_transfer');

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating bank instructions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bank instructions'
      };
    }
  }
}

// Export convenience functions
export const submitBankTransferPayment = BankTransferService.submitBankTransferPayment;
export const getPendingBankTransfers = BankTransferService.getPendingBankTransfers;
export const confirmBankTransferPayment = BankTransferService.confirmBankTransferPayment;
export const rejectBankTransferPayment = BankTransferService.rejectBankTransferPayment;
export const generateBankInstructions = BankTransferService.generateBankInstructions;
export const validateBankTransferDetails = BankTransferService.validateBankTransferDetails;
export const createDefaultBankInstructions = BankTransferService.createDefaultBankInstructions;
export const updateBankInstructions = BankTransferService.updateBankInstructions;