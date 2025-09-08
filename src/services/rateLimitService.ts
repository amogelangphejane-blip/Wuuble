/**
 * Rate Limiting Service for Random Chat
 * Implements various rate limits to prevent abuse
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

interface RateLimitConfig {
  // Messages per minute
  messagesPerMinute: number;
  // Partner skip attempts per hour
  skipAttemptsPerHour: number;
  // Connection attempts per hour
  connectionAttemptsPerHour: number;
  // Reports per day
  reportsPerDay: number;
  // Session duration limits
  maxSessionDurationMinutes: number;
  // Cooldown between sessions
  sessionCooldownMinutes: number;
}

class RateLimitService {
  private storage: Map<string, Map<string, RateLimitEntry>> = new Map();
  private config: RateLimitConfig = {
    messagesPerMinute: 30,
    skipAttemptsPerHour: 20,
    connectionAttemptsPerHour: 50,
    reportsPerDay: 5,
    maxSessionDurationMinutes: 60,
    sessionCooldownMinutes: 2
  };

  private getKey(userId: string, action: string): string {
    return `${userId}:${action}`;
  }

  private getStorageMap(action: string): Map<string, RateLimitEntry> {
    if (!this.storage.has(action)) {
      this.storage.set(action, new Map());
    }
    return this.storage.get(action)!;
  }

  private getTimeWindow(action: string): number {
    switch (action) {
      case 'messages':
        return 60 * 1000; // 1 minute
      case 'skip':
      case 'connection':
        return 60 * 60 * 1000; // 1 hour
      case 'reports':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'session_cooldown':
        return this.config.sessionCooldownMinutes * 60 * 1000;
      default:
        return 60 * 1000; // Default 1 minute
    }
  }

  private getLimit(action: string): number {
    switch (action) {
      case 'messages':
        return this.config.messagesPerMinute;
      case 'skip':
        return this.config.skipAttemptsPerHour;
      case 'connection':
        return this.config.connectionAttemptsPerHour;
      case 'reports':
        return this.config.reportsPerDay;
      case 'session_cooldown':
        return 1; // Only one session allowed during cooldown
      default:
        return 10;
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [action, actionMap] of this.storage.entries()) {
      for (const [key, entry] of actionMap.entries()) {
        // Remove expired entries
        if (now > entry.resetTime && (!entry.blocked || (entry.blockUntil && now > entry.blockUntil))) {
          actionMap.delete(key);
        }
      }
      
      // Remove empty action maps
      if (actionMap.size === 0) {
        this.storage.delete(action);
      }
    }
  }

  /**
   * Check if an action is allowed for a user
   */
  isAllowed(userId: string, action: string): { allowed: boolean; retryAfter?: number; message?: string } {
    this.cleanupExpiredEntries();
    
    const key = this.getKey(userId, action);
    const storageMap = this.getStorageMap(action);
    const limit = this.getLimit(action);
    const timeWindow = this.getTimeWindow(action);
    const now = Date.now();

    let entry = storageMap.get(key);
    
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + timeWindow,
        blocked: false
      };
      storageMap.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
        message: `Temporarily blocked due to rate limit violation. Try again in ${Math.ceil((entry.blockUntil - now) / 60000)} minutes.`
      };
    }

    // Reset count if time window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + timeWindow;
      entry.blocked = false;
      entry.blockUntil = undefined;
    }

    // Check if within limit
    if (entry.count >= limit) {
      // First violation - short block
      const blockDuration = this.getBlockDuration(action, entry.count - limit);
      entry.blocked = true;
      entry.blockUntil = now + blockDuration;
      
      return {
        allowed: false,
        retryAfter: Math.ceil(blockDuration / 1000),
        message: `Rate limit exceeded for ${action}. Please slow down and try again later.`
      };
    }

    return { allowed: true };
  }

  /**
   * Record an action being performed
   */
  recordAction(userId: string, action: string): void {
    const key = this.getKey(userId, action);
    const storageMap = this.getStorageMap(action);
    const entry = storageMap.get(key);

    if (entry) {
      entry.count++;
    }
  }

  /**
   * Get block duration based on action and violation severity
   */
  private getBlockDuration(action: string, violations: number): number {
    const baseMultiplier = Math.pow(2, Math.min(violations, 5)); // Exponential backoff, max 32x
    
    switch (action) {
      case 'messages':
        return 30 * 1000 * baseMultiplier; // Start with 30 seconds
      case 'skip':
        return 2 * 60 * 1000 * baseMultiplier; // Start with 2 minutes
      case 'connection':
        return 5 * 60 * 1000 * baseMultiplier; // Start with 5 minutes
      case 'reports':
        return 60 * 60 * 1000 * baseMultiplier; // Start with 1 hour
      default:
        return 60 * 1000 * baseMultiplier; // Start with 1 minute
    }
  }

  /**
   * Check message sending rate limit
   */
  canSendMessage(userId: string): { allowed: boolean; retryAfter?: number; message?: string } {
    return this.isAllowed(userId, 'messages');
  }

  /**
   * Record a message being sent
   */
  recordMessage(userId: string): void {
    this.recordAction(userId, 'messages');
  }

  /**
   * Check if user can skip to next partner
   */
  canSkipPartner(userId: string): { allowed: boolean; retryAfter?: number; message?: string } {
    return this.isAllowed(userId, 'skip');
  }

  /**
   * Record a skip action
   */
  recordSkip(userId: string): void {
    this.recordAction(userId, 'skip');
  }

  /**
   * Check if user can start a new connection
   */
  canStartConnection(userId: string): { allowed: boolean; retryAfter?: number; message?: string } {
    return this.isAllowed(userId, 'connection');
  }

  /**
   * Record a connection attempt
   */
  recordConnection(userId: string): void {
    this.recordAction(userId, 'connection');
  }

  /**
   * Check if user can submit a report
   */
  canSubmitReport(userId: string): { allowed: boolean; retryAfter?: number; message?: string } {
    return this.isAllowed(userId, 'reports');
  }

  /**
   * Record a report submission
   */
  recordReport(userId: string): void {
    this.recordAction(userId, 'reports');
  }

  /**
   * Check session cooldown (prevent immediate reconnections)
   */
  canStartNewSession(userId: string): { allowed: boolean; retryAfter?: number; message?: string } {
    return this.isAllowed(userId, 'session_cooldown');
  }

  /**
   * Record the start of a new session
   */
  recordSessionStart(userId: string): void {
    this.recordAction(userId, 'session_cooldown');
  }

  /**
   * Get current status for a user (for debugging/monitoring)
   */
  getUserStatus(userId: string): Record<string, { count: number; limit: number; resetTime: number; blocked: boolean }> {
    const status: Record<string, any> = {};
    
    for (const [action, storageMap] of this.storage.entries()) {
      const key = this.getKey(userId, action);
      const entry = storageMap.get(key);
      
      if (entry) {
        status[action] = {
          count: entry.count,
          limit: this.getLimit(action),
          resetTime: entry.resetTime,
          blocked: entry.blocked,
          blockUntil: entry.blockUntil
        };
      }
    }
    
    return status;
  }

  /**
   * Clear all rate limits for a user (admin function)
   */
  clearUserLimits(userId: string): void {
    for (const [action, storageMap] of this.storage.entries()) {
      const key = this.getKey(userId, action);
      storageMap.delete(key);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanup(): void {
    this.cleanupExpiredEntries();
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();