import { supabase } from '@/integrations/supabase/client';
import { PlatformStripeService } from './platformStripeService';
import { PlatformAccountService } from './platformAccountService';
import { WalletService } from './walletService';

export interface PayoutJob {
  id: string;
  scheduled_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_creators: number;
  total_amount: number;
  successful_payouts: number;
  failed_payouts: number;
  created_at: string;
  processed_at?: string;
  completed_at?: string;
  error_details?: string;
}

export interface CreatorPayoutEligibility {
  creator_id: string;
  creator_name: string;
  wallet_id: string;
  balance: number;
  stripe_account_id?: string;
  payout_method: any;
  minimum_payout_amount: number;
  is_eligible: boolean;
  reason?: string;
}

export class PayoutAutomationService {
  /**
   * Get creators eligible for automated payout
   */
  static async getEligibleCreators(minimumAmount: number = 25.00): Promise<CreatorPayoutEligibility[]> {
    try {
      const { data, error } = await supabase
        .from('creator_wallets')
        .select(`
          *,
          creator:auth.users!creator_id(id, raw_user_meta_data)
        `)
        .gte('balance', minimumAmount)
        .eq('is_active', true);

      if (error) throw error;

      const eligibleCreators: CreatorPayoutEligibility[] = (data || []).map(wallet => {
        const creator = wallet.creator as any;
        const creatorName = creator?.raw_user_meta_data?.full_name || 
                          creator?.raw_user_meta_data?.name || 
                          creator?.email || 
                          'Unknown Creator';

        let isEligible = true;
        let reason: string | undefined;

        // Check if creator has a valid payout method
        if (!wallet.payout_method || Object.keys(wallet.payout_method).length === 0) {
          isEligible = false;
          reason = 'No payout method configured';
        }

        // Check if Stripe account is set up for Stripe payouts
        if (wallet.payout_method?.type === 'stripe_connect' && !wallet.stripe_account_id) {
          isEligible = false;
          reason = 'Stripe Connect account not set up';
        }

        return {
          creator_id: wallet.creator_id,
          creator_name: creatorName,
          wallet_id: wallet.id,
          balance: wallet.balance,
          stripe_account_id: wallet.stripe_account_id,
          payout_method: wallet.payout_method,
          minimum_payout_amount: minimumAmount,
          is_eligible: isEligible,
          reason
        };
      });

      return eligibleCreators;
    } catch (error) {
      console.error('Error fetching eligible creators:', error);
      return [];
    }
  }

  /**
   * Create a scheduled payout job
   */
  static async schedulePayoutJob(
    scheduledDate: Date,
    minimumAmount: number = 25.00
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Get eligible creators
      const eligibleCreators = await this.getEligibleCreators(minimumAmount);
      const eligibleCount = eligibleCreators.filter(c => c.is_eligible).length;
      const totalAmount = eligibleCreators
        .filter(c => c.is_eligible)
        .reduce((sum, c) => sum + c.balance, 0);

      if (eligibleCount === 0) {
        return {
          success: false,
          error: 'No creators eligible for payout'
        };
      }

      // Create payout job record
      const { data, error } = await supabase
        .from('payout_jobs')
        .insert({
          scheduled_date: scheduledDate.toISOString(),
          status: 'pending',
          total_creators: eligibleCount,
          total_amount: totalAmount,
          successful_payouts: 0,
          failed_payouts: 0,
          metadata: {
            minimum_amount: minimumAmount,
            eligible_creators: eligibleCreators.filter(c => c.is_eligible).map(c => ({
              creator_id: c.creator_id,
              wallet_id: c.wallet_id,
              amount: c.balance,
              payout_method: c.payout_method
            }))
          }
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        jobId: data.id
      };
    } catch (error) {
      console.error('Error scheduling payout job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule payout job'
      };
    }
  }

  /**
   * Process a scheduled payout job
   */
  static async processPayoutJob(jobId: string): Promise<{
    success: boolean;
    successful_payouts: number;
    failed_payouts: number;
    errors?: Array<{ creator_id: string; error: string }>;
  }> {
    try {
      // Get the payout job
      const { data: job, error: jobError } = await supabase
        .from('payout_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      if (job.status !== 'pending') {
        throw new Error(`Job ${jobId} is not pending (current status: ${job.status})`);
      }

      // Update job status to processing
      await supabase
        .from('payout_jobs')
        .update({ 
          status: 'processing', 
          processed_at: new Date().toISOString() 
        })
        .eq('id', jobId);

      const eligibleCreators = job.metadata?.eligible_creators || [];
      const results = [];
      const errors: Array<{ creator_id: string; error: string }> = [];

      // Process each creator payout
      for (const creator of eligibleCreators) {
        try {
          const result = await this.processCreatorPayout(
            creator.creator_id,
            creator.wallet_id,
            creator.amount,
            creator.payout_method
          );

          results.push({
            creator_id: creator.creator_id,
            success: result.success,
            error: result.error
          });

          if (!result.success) {
            errors.push({
              creator_id: creator.creator_id,
              error: result.error || 'Unknown error'
            });
          }
        } catch (error) {
          errors.push({
            creator_id: creator.creator_id,
            error: error instanceof Error ? error.message : 'Processing failed'
          });
          results.push({
            creator_id: creator.creator_id,
            success: false,
            error: error instanceof Error ? error.message : 'Processing failed'
          });
        }
      }

      const successfulPayouts = results.filter(r => r.success).length;
      const failedPayouts = results.filter(r => !r.success).length;

      // Update job with final results
      await supabase
        .from('payout_jobs')
        .update({
          status: failedPayouts === 0 ? 'completed' : 'failed',
          successful_payouts: successfulPayouts,
          failed_payouts: failedPayouts,
          completed_at: new Date().toISOString(),
          error_details: errors.length > 0 ? JSON.stringify(errors) : null
        })
        .eq('id', jobId);

      return {
        success: failedPayouts === 0,
        successful_payouts: successfulPayouts,
        failed_payouts: failedPayouts,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error processing payout job:', error);
      
      // Update job status to failed
      await supabase
        .from('payout_jobs')
        .update({
          status: 'failed',
          error_details: error instanceof Error ? error.message : 'Processing failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return {
        success: false,
        successful_payouts: 0,
        failed_payouts: 1,
        errors: [{
          creator_id: 'system',
          error: error instanceof Error ? error.message : 'Job processing failed'
        }]
      };
    }
  }

  /**
   * Process payout for a single creator
   */
  static async processCreatorPayout(
    creatorId: string,
    walletId: string,
    amount: number,
    payoutMethod: any
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      // Determine payout method and process accordingly
      switch (payoutMethod?.type) {
        case 'stripe_connect':
          return await this.processStripeConnectPayout(creatorId, walletId, amount, payoutMethod);
        
        case 'bank_transfer':
          return await this.processBankTransferPayout(creatorId, walletId, amount, payoutMethod);
        
        case 'paypal':
          return await this.processPayPalPayout(creatorId, walletId, amount, payoutMethod);
        
        default:
          return {
            success: false,
            error: `Unsupported payout method: ${payoutMethod?.type || 'unknown'}`
          };
      }
    } catch (error) {
      console.error('Error processing creator payout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payout processing failed'
      };
    }
  }

  /**
   * Process Stripe Connect payout
   */
  private static async processStripeConnectPayout(
    creatorId: string,
    walletId: string,
    amount: number,
    payoutMethod: any
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      // Get creator's Stripe account ID from wallet
      const { data: wallet, error: walletError } = await supabase
        .from('creator_wallets')
        .select('stripe_account_id')
        .eq('id', walletId)
        .single();

      if (walletError) throw walletError;

      if (!wallet.stripe_account_id) {
        throw new Error('Creator does not have a Stripe Connect account');
      }

      // Transfer funds to creator's Stripe account
      const transferResult = await PlatformStripeService.transferToCreator({
        amount,
        currency: 'USD',
        creatorStripeAccountId: wallet.stripe_account_id,
        description: `Automated payout for creator ${creatorId}`,
        metadata: {
          creator_id: creatorId,
          wallet_id: walletId,
          payout_type: 'automated'
        }
      });

      if (!transferResult.success) {
        throw new Error(transferResult.error);
      }

      // Create payout request record
      const { data: payoutRequest, error: payoutError } = await supabase
        .from('payout_requests')
        .insert({
          wallet_id: walletId,
          amount,
          currency: 'USD',
          payout_method: payoutMethod,
          status: 'completed',
          external_payout_id: transferResult.transferId,
          processed_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Update wallet balance (move from balance to total_withdrawn)
      await supabase
        .from('creator_wallets')
        .update({
          balance: 0, // Reset balance after payout
          total_withdrawn: supabase.raw(`total_withdrawn + ${amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      return {
        success: true,
        payoutId: payoutRequest.id
      };
    } catch (error) {
      console.error('Stripe Connect payout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payout failed'
      };
    }
  }

  /**
   * Process bank transfer payout (manual processing required)
   */
  private static async processBankTransferPayout(
    creatorId: string,
    walletId: string,
    amount: number,
    payoutMethod: any
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      // Create payout request for manual processing
      const { data: payoutRequest, error: payoutError } = await supabase
        .from('payout_requests')
        .insert({
          wallet_id: walletId,
          amount,
          currency: 'USD',
          payout_method: payoutMethod,
          status: 'pending', // Requires manual processing
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Move amount from balance to pending_balance
      await supabase
        .from('creator_wallets')
        .update({
          balance: supabase.raw(`balance - ${amount}`),
          pending_balance: supabase.raw(`pending_balance + ${amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      return {
        success: true,
        payoutId: payoutRequest.id
      };
    } catch (error) {
      console.error('Bank transfer payout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bank transfer payout failed'
      };
    }
  }

  /**
   * Process PayPal payout
   */
  private static async processPayPalPayout(
    creatorId: string,
    walletId: string,
    amount: number,
    payoutMethod: any
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      // This would integrate with PayPal Payouts API
      // For now, create a pending payout request
      const { data: payoutRequest, error: payoutError } = await supabase
        .from('payout_requests')
        .insert({
          wallet_id: walletId,
          amount,
          currency: 'USD',
          payout_method: payoutMethod,
          status: 'pending', // Would be processed via PayPal API
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Move amount from balance to pending_balance
      await supabase
        .from('creator_wallets')
        .update({
          balance: supabase.raw(`balance - ${amount}`),
          pending_balance: supabase.raw(`pending_balance + ${amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      return {
        success: true,
        payoutId: payoutRequest.id
      };
    } catch (error) {
      console.error('PayPal payout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal payout failed'
      };
    }
  }

  /**
   * Get payout jobs with filtering
   */
  static async getPayoutJobs(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<PayoutJob[]> {
    try {
      let query = supabase
        .from('payout_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payout jobs:', error);
      return [];
    }
  }

  /**
   * Run automated payout check (to be called by cron job)
   */
  static async runAutomatedPayoutCheck(): Promise<{
    success: boolean;
    jobsCreated: number;
    error?: string;
  }> {
    try {
      // Get platform settings
      const platformAccount = await PlatformAccountService.getPrimaryAccount();
      if (!platformAccount.success || !platformAccount.data) {
        return {
          success: false,
          jobsCreated: 0,
          error: 'No primary platform account configured'
        };
      }

      const account = platformAccount.data;

      // Check if auto payouts are enabled
      if (!account.auto_payout_enabled) {
        return {
          success: true,
          jobsCreated: 0,
          error: 'Auto payouts are disabled'
        };
      }

      // Check if it's time for a payout based on schedule
      const now = new Date();
      const shouldRunPayout = this.shouldRunPayout(now, account.payout_schedule, account.payout_day);

      if (!shouldRunPayout) {
        return {
          success: true,
          jobsCreated: 0,
          error: 'Not scheduled for payout today'
        };
      }

      // Create payout job
      const result = await this.schedulePayoutJob(now, account.minimum_payout_amount);

      if (result.success && result.jobId) {
        // Process the job immediately
        await this.processPayoutJob(result.jobId);
        return {
          success: true,
          jobsCreated: 1
        };
      } else {
        return {
          success: false,
          jobsCreated: 0,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error running automated payout check:', error);
      return {
        success: false,
        jobsCreated: 0,
        error: error instanceof Error ? error.message : 'Automated payout check failed'
      };
    }
  }

  /**
   * Check if payout should run based on schedule
   */
  private static shouldRunPayout(
    now: Date,
    schedule: 'daily' | 'weekly' | 'monthly',
    payoutDay: number
  ): boolean {
    switch (schedule) {
      case 'daily':
        return true; // Run every day
      
      case 'weekly':
        return now.getDay() === payoutDay; // payoutDay: 0=Sunday, 1=Monday, etc.
      
      case 'monthly':
        return now.getDate() === payoutDay; // payoutDay: 1-31
      
      default:
        return false;
    }
  }
}

// Export convenience functions
export const getEligibleCreators = PayoutAutomationService.getEligibleCreators;
export const schedulePayoutJob = PayoutAutomationService.schedulePayoutJob;
export const processPayoutJob = PayoutAutomationService.processPayoutJob;
export const getPayoutJobs = PayoutAutomationService.getPayoutJobs;
export const runAutomatedPayoutCheck = PayoutAutomationService.runAutomatedPayoutCheck;