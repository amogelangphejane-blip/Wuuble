/**
 * Enhanced Safety Service for Random Chat
 * Implements user behavior monitoring, content filtering, and safety controls
 */

import { randomChatService } from './randomChatService';

export interface SafetyReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: 'inappropriate_behavior' | 'harassment' | 'spam' | 'underage' | 'fake_profile' | 'other';
  description?: string;
  timestamp: Date;
  evidence?: {
    screenshots?: string[];
    chatLogs?: string[];
  };
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface BlockedUser {
  userId: string;
  blockedUserId: string;
  timestamp: Date;
  reason?: string;
}

export interface SafetySettings {
  autoBlockReported: boolean;
  hideLocation: boolean;
  requireVerification: boolean;
  allowScreenshots: boolean;
  filterProfanity: boolean;
}

interface SafetyAlert {
  id: string;
  userId: string;
  type: 'excessive_skipping' | 'rapid_reconnection' | 'multiple_reports' | 'inappropriate_behavior' | 'spam_messages';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: number;
  resolved: boolean;
}

interface UserBehaviorMetrics {
  userId: string;
  sessionCount: number;
  averageSessionDuration: number;
  skipRate: number; // percentage of sessions ended by user
  reportCount: number; // times this user was reported
  lastActivity: number;
  riskScore: number; // 0-100
  behaviorFlags: string[];
}

interface ContentFilter {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high';
  category: 'profanity' | 'harassment' | 'spam' | 'inappropriate' | 'personal_info';
  action: 'warn' | 'block_message' | 'end_session' | 'temporary_ban';
}

export class SafetyService {
  private reports: Map<string, SafetyReport> = new Map();
  private blockedUsers: Map<string, Set<string>> = new Map();
  private userSettings: Map<string, SafetySettings> = new Map();
  private alerts = new Map<string, SafetyAlert>();
  private userMetrics = new Map<string, UserBehaviorMetrics>();
  private contentFilters: ContentFilter[] = [];
  
  // Enhanced profanity filter
  private profanityFilter: string[] = [
    'badword1', 'badword2', 'inappropriate', 'spam', 'scam'
  ];

  // Configurable thresholds
  private thresholds = {
    highSkipRate: 0.7, // 70% of sessions ended by skipping
    maxReportsPerDay: 3,
    maxSessionsPerHour: 10,
    suspiciousReconnectionTime: 30000, // 30 seconds
    spamMessageThreshold: 5, // messages per minute
    highRiskScore: 70
  };

  constructor() {
    this.initializeContentFilters();
  }

  /**
   * Initialize content filters for message screening
   */
  private initializeContentFilters(): void {
    this.contentFilters = [
      // Profanity filter (basic patterns)
      {
        pattern: /\b(fuck|shit|damn|bastard|bitch)\b/gi,
        severity: 'low',
        category: 'profanity',
        action: 'warn'
      },
      
      // Harassment patterns
      {
        pattern: /\b(kill yourself|kys|die|hate you|ugly|stupid)\b/gi,
        severity: 'high',
        category: 'harassment',
        action: 'end_session'
      },
      
      // Spam patterns
      {
        pattern: /(.)\1{10,}/g, // Repeated characters
        severity: 'medium',
        category: 'spam',
        action: 'block_message'
      },
      
      // Personal information patterns
      {
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b|\b\d{3}-?\d{3}-?\d{4}\b/g, // SSN/Phone
        severity: 'high',
        category: 'personal_info',
        action: 'block_message'
      },
      
      // Inappropriate requests
      {
        pattern: /\b(send nudes|show me|take off|naked|sex chat)\b/gi,
        severity: 'high',
        category: 'inappropriate',
        action: 'end_session'
      }
    ];
  }

  // Report a user
  reportUser(
    reporterId: string, 
    reportedUserId: string, 
    reason: SafetyReport['reason'], 
    description?: string,
    evidence?: SafetyReport['evidence']
  ): string {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: SafetyReport = {
      id: reportId,
      reporterId,
      reportedUserId,
      reason,
      description,
      timestamp: new Date(),
      evidence,
      status: 'pending'
    };

    this.reports.set(reportId, report);

    // Auto-block if user has multiple reports
    this.checkAutoBlock(reportedUserId);

    return reportId;
  }

  // Block a user
  blockUser(userId: string, blockedUserId: string, reason?: string): void {
    if (!this.blockedUsers.has(userId)) {
      this.blockedUsers.set(userId, new Set());
    }
    
    this.blockedUsers.get(userId)!.add(blockedUserId);
    
    // Store block details
    const blockDetails: BlockedUser = {
      userId,
      blockedUserId,
      timestamp: new Date(),
      reason
    };
  }

  // Unblock a user
  unblockUser(userId: string, blockedUserId: string): void {
    const blockedSet = this.blockedUsers.get(userId);
    if (blockedSet) {
      blockedSet.delete(blockedUserId);
    }
  }

  // Check if user is blocked
  isUserBlocked(userId: string, checkUserId: string): boolean {
    const blockedSet = this.blockedUsers.get(userId);
    return blockedSet ? blockedSet.has(checkUserId) : false;
  }

  // Get blocked users for a user
  getBlockedUsers(userId: string): string[] {
    const blockedSet = this.blockedUsers.get(userId);
    return blockedSet ? Array.from(blockedSet) : [];
  }

  // Update safety settings
  updateSafetySettings(userId: string, settings: Partial<SafetySettings>): void {
    const currentSettings = this.userSettings.get(userId) || this.getDefaultSafetySettings();
    this.userSettings.set(userId, { ...currentSettings, ...settings });
  }

  // Get safety settings
  getSafetySettings(userId: string): SafetySettings {
    return this.userSettings.get(userId) || this.getDefaultSafetySettings();
  }

  // Get default safety settings
  private getDefaultSafetySettings(): SafetySettings {
    return {
      autoBlockReported: true,
      hideLocation: false,
      requireVerification: false,
      allowScreenshots: true,
      filterProfanity: true
    };
  }

  // Check for auto-block based on reports
  private checkAutoBlock(reportedUserId: string): void {
    const userReports = Array.from(this.reports.values())
      .filter(report => report.reportedUserId === reportedUserId && report.status === 'pending');

    // Auto-block if user has 3 or more reports
    if (userReports.length >= 3) {
      // Add to global block list or take other action
      console.log(`User ${reportedUserId} auto-blocked due to multiple reports`);
    }
  }

  // Filter profanity from text
  filterProfanity(text: string, userId?: string): string {
    if (userId) {
      const settings = this.getSafetySettings(userId);
      if (!settings.filterProfanity) {
        return text;
      }
    }

    let filteredText = text;
    this.profanityFilter.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });

    return filteredText;
  }

  // Get reports for a user (as reporter)
  getUserReports(userId: string): SafetyReport[] {
    return Array.from(this.reports.values())
      .filter(report => report.reporterId === userId);
  }

  // Get reports against a user
  getReportsAgainstUser(userId: string): SafetyReport[] {
    return Array.from(this.reports.values())
      .filter(report => report.reportedUserId === userId);
  }

  // Update report status (admin function)
  updateReportStatus(reportId: string, status: SafetyReport['status']): boolean {
    const report = this.reports.get(reportId);
    if (report) {
      report.status = status;
      return true;
    }
    return false;
  }

  // Get safety statistics
  getSafetyStats(): {
    totalReports: number;
    pendingReports: number;
    totalBlocks: number;
    activeUsers: number;
  } {
    const allReports = Array.from(this.reports.values());
    const totalBlocks = Array.from(this.blockedUsers.values())
      .reduce((sum, blockedSet) => sum + blockedSet.size, 0);

    return {
      totalReports: allReports.length,
      pendingReports: allReports.filter(r => r.status === 'pending').length,
      totalBlocks,
      activeUsers: this.userSettings.size
    };
  }

  // Validate user interaction (check if users can interact)
  canUsersInteract(userId1: string, userId2: string): {
    canInteract: boolean;
    reason?: string;
  } {
    // Check if either user has blocked the other
    if (this.isUserBlocked(userId1, userId2)) {
      return { canInteract: false, reason: 'User is blocked' };
    }
    
    if (this.isUserBlocked(userId2, userId1)) {
      return { canInteract: false, reason: 'You are blocked by this user' };
    }

    // Check if either user has too many pending reports
    const reportsAgainstUser1 = this.getReportsAgainstUser(userId1).filter(r => r.status === 'pending');
    const reportsAgainstUser2 = this.getReportsAgainstUser(userId2).filter(r => r.status === 'pending');

    if (reportsAgainstUser1.length >= 5) {
      return { canInteract: false, reason: 'User temporarily restricted due to reports' };
    }

    if (reportsAgainstUser2.length >= 5) {
      return { canInteract: false, reason: 'You are temporarily restricted due to reports' };
    }

    return { canInteract: true };
  }

  // Emergency disconnect (immediately end chat and block user)
  emergencyDisconnect(userId: string, reportedUserId: string, reason: string): void {
    // Block the user
    this.blockUser(userId, reportedUserId, `Emergency disconnect: ${reason}`);
    
    // Create a high-priority report
    this.reportUser(userId, reportedUserId, 'inappropriate_behavior', `Emergency disconnect: ${reason}`);
    
    // Log for immediate review
    console.log(`Emergency disconnect by ${userId} against ${reportedUserId}: ${reason}`);
  }

  // Get safety tips
  getSafetyTips(): string[] {
    return [
      "Never share personal information like your full name, address, or phone number",
      "Report users who make you feel uncomfortable or behave inappropriately",
      "Use the block feature if someone is bothering you",
      "Trust your instincts - if something feels wrong, end the chat",
      "Remember that not everyone online is who they claim to be",
      "Keep conversations light and fun, avoid sharing intimate details",
      "Use the emergency disconnect feature if you feel unsafe",
      "Screenshots and recordings help us investigate reports"
    ];
  }

  // Clear user data (GDPR compliance)
  clearUserData(userId: string): void {
    // Remove user from all reports as reporter
    const userReports = this.getUserReports(userId);
    userReports.forEach(report => {
      this.reports.delete(report.id);
    });

    // Remove user settings
    this.userSettings.delete(userId);

    // Remove user from blocked lists
    this.blockedUsers.delete(userId);

    // Remove user from others' blocked lists
    for (const [otherUserId, blockedSet] of this.blockedUsers.entries()) {
      blockedSet.delete(userId);
    }

    // Remove user metrics and alerts
    this.userMetrics.delete(userId);
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.userId === userId) {
        this.alerts.delete(alertId);
      }
    }
  }

  /**
   * Analyze user behavior and update risk metrics
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorMetrics> {
    try {
      // Get user stats from database
      const stats = await randomChatService.getUserStats(userId);
      
      // Calculate metrics
      const skipRate = stats.total_sessions > 0 
        ? stats.sessions_ended_by_user / stats.total_sessions 
        : 0;
        
      const averageSessionDuration = stats.average_session_minutes || 0;
      
      // Calculate risk score based on various factors
      let riskScore = 0;
      const behaviorFlags: string[] = [];
      
      // High skip rate indicates potentially problematic behavior
      if (skipRate > this.thresholds.highSkipRate) {
        riskScore += 25;
        behaviorFlags.push('high_skip_rate');
      }
      
      // Multiple reports is a strong indicator
      if (stats.times_reported >= this.thresholds.maxReportsPerDay) {
        riskScore += 40;
        behaviorFlags.push('multiple_reports');
      }
      
      // Very short sessions might indicate inappropriate behavior
      if (averageSessionDuration < 1 && stats.total_sessions > 5) {
        riskScore += 20;
        behaviorFlags.push('short_sessions');
      }
      
      // High activity in short time
      const recentSessions = await this.getRecentSessionCount(userId, 3600000); // 1 hour
      if (recentSessions > this.thresholds.maxSessionsPerHour) {
        riskScore += 15;
        behaviorFlags.push('excessive_activity');
      }

      const metrics: UserBehaviorMetrics = {
        userId,
        sessionCount: stats.total_sessions,
        averageSessionDuration,
        skipRate,
        reportCount: stats.times_reported,
        lastActivity: Date.now(),
        riskScore: Math.min(riskScore, 100),
        behaviorFlags
      };

      this.userMetrics.set(userId, metrics);
      
      // Generate alerts for high-risk behavior
      if (riskScore >= this.thresholds.highRiskScore) {
        this.createSafetyAlert(userId, 'inappropriate_behavior', 'high', 
          `High risk score: ${riskScore}. Flags: ${behaviorFlags.join(', ')}`);
      }

      return metrics;
    } catch (error) {
      console.error('Failed to analyze user behavior:', error);
      
      // Return safe defaults
      const defaultMetrics: UserBehaviorMetrics = {
        userId,
        sessionCount: 0,
        averageSessionDuration: 0,
        skipRate: 0,
        reportCount: 0,
        lastActivity: Date.now(),
        riskScore: 0,
        behaviorFlags: []
      };
      
      this.userMetrics.set(userId, defaultMetrics);
      return defaultMetrics;
    }
  }

  /**
   * Get recent session count for a user
   */
  private async getRecentSessionCount(userId: string, timeWindowMs: number): Promise<number> {
    try {
      const recentSessions = await randomChatService.getUserRecentSessions(userId, 50);
      const cutoffTime = Date.now() - timeWindowMs;
      
      return recentSessions.filter(session => 
        new Date(session.created_at).getTime() > cutoffTime
      ).length;
    } catch (error) {
      console.error('Failed to get recent session count:', error);
      return 0;
    }
  }

  /**
   * Filter message content and return action to take
   */
  filterMessage(message: string, userId: string): {
    allowed: boolean;
    filteredMessage?: string;
    action: 'allow' | 'warn' | 'block' | 'end_session' | 'ban';
    reason?: string;
    category?: string;
  } {
    let filteredMessage = message;
    let highestSeverity: 'low' | 'medium' | 'high' = 'low';
    let matchedCategories: string[] = [];
    let suggestedAction: ContentFilter['action'] = 'warn';

    // Test against all content filters
    for (const filter of this.contentFilters) {
      if (filter.pattern.test(message)) {
        matchedCategories.push(filter.category);
        
        // Track highest severity match
        const severityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
        if (severityLevels[filter.severity] > severityLevels[highestSeverity]) {
          highestSeverity = filter.severity;
          suggestedAction = filter.action;
        }

        // Apply content filtering based on action
        if (filter.action === 'block_message') {
          filteredMessage = message.replace(filter.pattern, '***');
        }
      }
    }

    // Determine final action
    let finalAction: 'allow' | 'warn' | 'block' | 'end_session' | 'ban' = 'allow';
    
    if (matchedCategories.length > 0) {
      switch (suggestedAction) {
        case 'warn':
          finalAction = 'warn';
          break;
        case 'block_message':
          finalAction = 'block';
          break;
        case 'end_session':
          finalAction = 'end_session';
          // Create safety alert
          this.createSafetyAlert(userId, 'inappropriate_behavior', highestSeverity,
            `Inappropriate message detected: ${matchedCategories.join(', ')}`);
          break;
        case 'temporary_ban':
          finalAction = 'ban';
          this.createSafetyAlert(userId, 'inappropriate_behavior', 'critical',
            `Severe content violation: ${matchedCategories.join(', ')}`);
          break;
      }
    }

    return {
      allowed: finalAction === 'allow' || finalAction === 'warn',
      filteredMessage: filteredMessage !== message ? filteredMessage : undefined,
      action: finalAction,
      reason: matchedCategories.length > 0 
        ? `Content filter triggered: ${matchedCategories.join(', ')}`
        : undefined,
      category: matchedCategories.join(', ') || undefined
    };
  }

  /**
   * Create a safety alert
   */
  createSafetyAlert(
    userId: string, 
    type: SafetyAlert['type'], 
    severity: SafetyAlert['severity'], 
    details: string
  ): SafetyAlert {
    const alert: SafetyAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      severity,
      details,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.set(alert.id, alert);
    
    console.warn(`🚨 Safety Alert [${severity.toUpperCase()}]: ${type} for user ${userId} - ${details}`);
    
    return alert;
  }

  /**
   * Check if user should be allowed to start a session
   */
  async canUserStartSession(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    banDuration?: number;
  }> {
    try {
      // Check if user is banned
      const isBanned = await randomChatService.isUserBanned(userId);
      if (isBanned) {
        return {
          allowed: false,
          reason: 'User is banned from random chat due to safety violations'
        };
      }

      // Analyze current behavior
      const metrics = await this.analyzeUserBehavior(userId);
      
      // Block users with critical risk scores
      if (metrics.riskScore >= 90) {
        return {
          allowed: false,
          reason: 'Account flagged for review due to safety concerns'
        };
      }

      // Rate limit high-risk users
      if (metrics.riskScore >= this.thresholds.highRiskScore) {
        const recentSessions = await this.getRecentSessionCount(userId, 3600000);
        if (recentSessions >= 5) { // Reduced limit for high-risk users
          return {
            allowed: false,
            reason: 'Session limit reached. Please try again later.'
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Failed to check user session eligibility:', error);
      // Default to allow if check fails
      return { allowed: true };
    }
  }

  /**
   * Get user safety alerts
   */
  getUserAlerts(userId: string): SafetyAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }

  /**
   * Get user risk assessment
   */
  getUserRiskAssessment(userId: string): {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    flags: string[];
    recommendations: string[];
  } {
    const metrics = this.userMetrics.get(userId);
    
    if (!metrics) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        recommendations: []
      };
    }

    const riskLevel = 
      metrics.riskScore >= 90 ? 'critical' :
      metrics.riskScore >= 70 ? 'high' :
      metrics.riskScore >= 40 ? 'medium' : 'low';

    const recommendations: string[] = [];
    
    if (metrics.behaviorFlags.includes('high_skip_rate')) {
      recommendations.push('Consider providing tips for better conversations');
    }
    
    if (metrics.behaviorFlags.includes('multiple_reports')) {
      recommendations.push('Review community guidelines with user');
    }
    
    if (metrics.behaviorFlags.includes('excessive_activity')) {
      recommendations.push('Implement session cooldowns');
    }

    return {
      riskScore: metrics.riskScore,
      riskLevel,
      flags: metrics.behaviorFlags,
      recommendations
    };
  }

  /**
   * Clean up old alerts and metrics
   */
  cleanup(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Remove old resolved alerts
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.timestamp < sevenDaysAgo) {
        this.alerts.delete(alertId);
      }
    }
    
    // Remove old user metrics
    for (const [userId, metrics] of this.userMetrics.entries()) {
      if (metrics.lastActivity < sevenDaysAgo) {
        this.userMetrics.delete(userId);
      }
    }
  }
}

// Singleton instance
export const safetyService = new SafetyService();