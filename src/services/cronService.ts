import { processRenewals, getRenewalStats } from './renewalService';
import { supabase } from '@/integrations/supabase/client';

export interface CronJobResult {
  success: boolean;
  timestamp: string;
  duration: number;
  stats?: any;
  error?: string;
}

export class CronService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the cron service
   */
  static start(): void {
    if (this.intervalId) {
      console.log('Cron service is already running');
      return;
    }

    console.log('Starting cron service...');

    // Run renewal processing every hour
    this.intervalId = setInterval(async () => {
      await this.runRenewalJob();
    }, 60 * 60 * 1000); // 1 hour

    // Run initial job
    setTimeout(() => {
      this.runRenewalJob();
    }, 5000); // Wait 5 seconds after startup

    console.log('Cron service started');
  }

  /**
   * Stop the cron service
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Cron service stopped');
    }
  }

  /**
   * Run the renewal job
   */
  private static async runRenewalJob(): Promise<CronJobResult> {
    if (this.isRunning) {
      console.log('Renewal job is already running, skipping...');
      return {
        success: false,
        timestamp: new Date().toISOString(),
        duration: 0,
        error: 'Job already running'
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    console.log('Running renewal job at:', new Date().toISOString());

    try {
      // Process renewals
      const renewalStats = await processRenewals();

      // Log the results
      await this.logJobResult('renewal', {
        success: true,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        stats: renewalStats
      });

      console.log('Renewal job completed successfully:', renewalStats);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        stats: renewalStats
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log the error
      await this.logJobResult('renewal', {
        success: false,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: errorMessage
      });

      console.error('Renewal job failed:', error);

      return {
        success: false,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: errorMessage
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run renewal job manually
   */
  static async runManualRenewal(): Promise<CronJobResult> {
    console.log('Running manual renewal job...');
    return await this.runRenewalJob();
  }

  /**
   * Log job results to database
   */
  private static async logJobResult(jobType: string, result: CronJobResult): Promise<void> {
    try {
      // Create a simple job log table if it doesn't exist
      // This would typically be done in a migration
      await supabase.rpc('create_job_log_if_not_exists');

      // Insert job log
      const { error } = await supabase
        .from('job_logs')
        .insert({
          job_type: jobType,
          success: result.success,
          duration_ms: result.duration,
          stats: result.stats || null,
          error_message: result.error || null,
          executed_at: result.timestamp
        });

      if (error) {
        console.error('Failed to log job result:', error);
      }
    } catch (error) {
      console.error('Failed to log job result:', error);
    }
  }

  /**
   * Get job statistics
   */
  static async getJobStats(jobType: string, limit = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('job_logs')
        .select('*')
        .eq('job_type', jobType)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get job stats:', error);
      return [];
    }
  }

  /**
   * Health check for cron service
   */
  static getStatus(): {
    isRunning: boolean;
    hasInterval: boolean;
    lastRun?: string;
  } {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null,
      lastRun: this.intervalId ? new Date().toISOString() : undefined
    };
  }

  /**
   * Schedule a one-time job
   */
  static scheduleOneTimeJob(
    jobFunction: () => Promise<void>,
    delayMs: number
  ): NodeJS.Timeout {
    return setTimeout(async () => {
      try {
        await jobFunction();
      } catch (error) {
        console.error('Scheduled job failed:', error);
      }
    }, delayMs);
  }

  /**
   * Daily cleanup job
   */
  static async runDailyCleanup(): Promise<void> {
    console.log('Running daily cleanup...');

    try {
      // Clean up old job logs (keep last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await supabase
        .from('job_logs')
        .delete()
        .lt('executed_at', thirtyDaysAgo.toISOString());

      // Clean up old payment reminders (keep last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      await supabase
        .from('payment_reminders')
        .delete()
        .lt('sent_at', ninetyDaysAgo.toISOString());

      console.log('Daily cleanup completed');
    } catch (error) {
      console.error('Daily cleanup failed:', error);
    }
  }
}

// Auto-start cron service in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  CronService.start();
}

// Export convenience functions
export const startCronService = CronService.start;
export const stopCronService = CronService.stop;
export const runManualRenewal = CronService.runManualRenewal;
export const getCronStatus = CronService.getStatus;