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

export class SafetyService {
  private reports: Map<string, SafetyReport> = new Map();
  private blockedUsers: Map<string, Set<string>> = new Map();
  private userSettings: Map<string, SafetySettings> = new Map();
  private profanityFilter: string[] = [
    // Basic profanity filter - in production, use a more comprehensive list
    'badword1', 'badword2', 'inappropriate'
  ];

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
  }
}

// Singleton instance
export const safetyService = new SafetyService();