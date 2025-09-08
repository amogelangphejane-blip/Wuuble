/**
 * Connection Retry Service with Exponential Backoff
 * Handles automatic reconnection attempts for random chat
 */

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterMaxMs: number;
}

interface RetryState {
  attempts: number;
  lastAttempt: number;
  nextRetryAt: number;
  isRetrying: boolean;
  permanentFailure: boolean;
  reason?: string;
}

class ConnectionRetryService {
  private retryStates = new Map<string, RetryState>();
  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  
  private defaultConfig: RetryConfig = {
    maxAttempts: 10,
    initialDelay: 1000, // 1 second
    maxDelay: 60000, // 60 seconds
    backoffMultiplier: 2,
    jitterMaxMs: 1000 // Random jitter up to 1 second
  };

  /**
   * Calculate delay for next retry attempt using exponential backoff with jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const baseDelay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelay
    );
    
    // Add random jitter to prevent thundering herd
    const jitter = Math.random() * config.jitterMaxMs;
    
    return Math.floor(baseDelay + jitter);
  }

  /**
   * Start retry process for a connection
   */
  startRetry(
    connectionId: string,
    retryFunction: () => Promise<boolean>,
    onSuccess?: () => void,
    onFailure?: (reason: string) => void,
    config?: Partial<RetryConfig>
  ): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Initialize retry state
    const state: RetryState = {
      attempts: 0,
      lastAttempt: 0,
      nextRetryAt: 0,
      isRetrying: true,
      permanentFailure: false
    };
    
    this.retryStates.set(connectionId, state);
    
    console.log(`🔄 Starting retry process for ${connectionId}`);
    
    // Start the retry loop
    this.attemptRetry(connectionId, retryFunction, onSuccess, onFailure, finalConfig);
  }

  /**
   * Attempt a single retry
   */
  private async attemptRetry(
    connectionId: string,
    retryFunction: () => Promise<boolean>,
    onSuccess?: () => void,
    onFailure?: (reason: string) => void,
    config: RetryConfig = this.defaultConfig
  ): Promise<void> {
    const state = this.retryStates.get(connectionId);
    if (!state || !state.isRetrying) {
      return;
    }

    state.attempts++;
    state.lastAttempt = Date.now();
    
    console.log(`🔄 Retry attempt ${state.attempts}/${config.maxAttempts} for ${connectionId}`);

    try {
      const success = await retryFunction();
      
      if (success) {
        console.log(`✅ Connection retry successful for ${connectionId}`);
        this.stopRetry(connectionId);
        onSuccess?.();
        return;
      }
    } catch (error) {
      console.warn(`❌ Retry attempt ${state.attempts} failed for ${connectionId}:`, error);
    }

    // Check if we've exceeded max attempts
    if (state.attempts >= config.maxAttempts) {
      console.error(`💥 All retry attempts exhausted for ${connectionId}`);
      state.permanentFailure = true;
      state.isRetrying = false;
      state.reason = `Max retry attempts (${config.maxAttempts}) exceeded`;
      onFailure?.(state.reason);
      return;
    }

    // Schedule next retry
    const delay = this.calculateDelay(state.attempts, config);
    state.nextRetryAt = Date.now() + delay;
    
    console.log(`⏰ Scheduling next retry for ${connectionId} in ${Math.round(delay/1000)}s`);
    
    const timeout = setTimeout(() => {
      this.attemptRetry(connectionId, retryFunction, onSuccess, onFailure, config);
    }, delay);
    
    this.retryTimeouts.set(connectionId, timeout);
  }

  /**
   * Stop retry process for a connection
   */
  stopRetry(connectionId: string): void {
    const timeout = this.retryTimeouts.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(connectionId);
    }
    
    const state = this.retryStates.get(connectionId);
    if (state) {
      state.isRetrying = false;
    }
    
    console.log(`🛑 Stopped retry process for ${connectionId}`);
  }

  /**
   * Force stop and remove retry state
   */
  cancelRetry(connectionId: string): void {
    this.stopRetry(connectionId);
    this.retryStates.delete(connectionId);
    console.log(`❌ Cancelled retry process for ${connectionId}`);
  }

  /**
   * Check if a connection is currently retrying
   */
  isRetrying(connectionId: string): boolean {
    const state = this.retryStates.get(connectionId);
    return state?.isRetrying ?? false;
  }

  /**
   * Get retry state for a connection
   */
  getRetryState(connectionId: string): RetryState | null {
    return this.retryStates.get(connectionId) || null;
  }

  /**
   * Get human-readable status for a connection
   */
  getRetryStatus(connectionId: string): {
    isRetrying: boolean;
    attempts: number;
    nextRetryIn?: number;
    permanentFailure: boolean;
    reason?: string;
  } {
    const state = this.retryStates.get(connectionId);
    
    if (!state) {
      return {
        isRetrying: false,
        attempts: 0,
        permanentFailure: false
      };
    }

    const nextRetryIn = state.isRetrying && state.nextRetryAt > Date.now() 
      ? Math.ceil((state.nextRetryAt - Date.now()) / 1000)
      : undefined;

    return {
      isRetrying: state.isRetrying,
      attempts: state.attempts,
      nextRetryIn,
      permanentFailure: state.permanentFailure,
      reason: state.reason
    };
  }

  /**
   * Reset retry state for a connection (allows fresh retry attempts)
   */
  resetRetry(connectionId: string): void {
    this.cancelRetry(connectionId);
    console.log(`🔄 Reset retry state for ${connectionId}`);
  }

  /**
   * Get all active retry processes (for monitoring)
   */
  getActiveRetries(): Array<{
    connectionId: string;
    attempts: number;
    isRetrying: boolean;
    nextRetryIn?: number;
  }> {
    const active: Array<any> = [];
    
    for (const [connectionId, state] of this.retryStates.entries()) {
      if (state.isRetrying) {
        const nextRetryIn = state.nextRetryAt > Date.now() 
          ? Math.ceil((state.nextRetryAt - Date.now()) / 1000)
          : 0;
          
        active.push({
          connectionId,
          attempts: state.attempts,
          isRetrying: state.isRetrying,
          nextRetryIn
        });
      }
    }
    
    return active;
  }

  /**
   * Clean up completed retry states (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    for (const [connectionId, state] of this.retryStates.entries()) {
      // Remove old, non-retrying states
      if (!state.isRetrying && state.lastAttempt < oneHourAgo) {
        this.retryStates.delete(connectionId);
        console.log(`🧹 Cleaned up old retry state for ${connectionId}`);
      }
    }
  }

  /**
   * Create a retry-wrapped version of an async function
   */
  withRetry<T>(
    connectionId: string,
    asyncFn: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const retryFn = async (): Promise<boolean> => {
        try {
          const result = await asyncFn();
          resolve(result);
          return true;
        } catch (error) {
          if (this.getRetryState(connectionId)?.attempts === (config?.maxAttempts ?? this.defaultConfig.maxAttempts)) {
            reject(error);
          }
          return false;
        }
      };

      this.startRetry(
        connectionId,
        retryFn,
        undefined, // onSuccess handled by resolve
        (reason) => reject(new Error(`Retry failed: ${reason}`)),
        config
      );
    });
  }
}

// Export singleton instance
export const connectionRetryService = new ConnectionRetryService();