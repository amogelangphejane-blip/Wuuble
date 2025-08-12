export interface UserProfile {
  id: string;
  ageRange: string;
  location: string;
  language: string;
  interests: string[];
  isOnline: boolean;
  lastSeen: Date;
  preferences: MatchingPreferences;
}

export interface MatchingPreferences {
  ageRange?: string;
  location?: string;
  language?: string;
  interests?: string[];
  excludeReported?: boolean;
}

export interface MatchScore {
  userId: string;
  score: number;
  reasons: string[];
}

export class MatchingService {
  private users: Map<string, UserProfile> = new Map();
  private reportedUsers: Set<string> = new Set();
  private matchHistory: Map<string, Set<string>> = new Map();

  // Add or update user profile
  addUser(profile: UserProfile): void {
    this.users.set(profile.id, profile);
  }

  // Remove user
  removeUser(userId: string): void {
    this.users.delete(userId);
    this.matchHistory.delete(userId);
  }

  // Update user online status
  setUserOnlineStatus(userId: string, isOnline: boolean): void {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
    }
  }

  // Report user
  reportUser(userId: string): void {
    this.reportedUsers.add(userId);
  }

  // Add to match history
  addToMatchHistory(userId1: string, userId2: string): void {
    if (!this.matchHistory.has(userId1)) {
      this.matchHistory.set(userId1, new Set());
    }
    if (!this.matchHistory.has(userId2)) {
      this.matchHistory.set(userId2, new Set());
    }
    
    this.matchHistory.get(userId1)!.add(userId2);
    this.matchHistory.get(userId2)!.add(userId1);
  }

  // Calculate match score between two users
  private calculateMatchScore(user1: UserProfile, user2: UserProfile): MatchScore {
    let score = 0;
    const reasons: string[] = [];

    // Age compatibility
    if (this.isAgeCompatible(user1.ageRange, user2.ageRange)) {
      score += 30;
      reasons.push('Age compatibility');
    }

    // Language compatibility
    if (user1.language === user2.language) {
      score += 25;
      reasons.push('Same language');
    }

    // Location compatibility
    const locationScore = this.getLocationScore(user1.location, user2.location);
    score += locationScore;
    if (locationScore > 0) {
      reasons.push('Location compatibility');
    }

    // Interest compatibility
    const commonInterests = this.getCommonInterests(user1.interests, user2.interests);
    const interestScore = Math.min(commonInterests.length * 10, 30);
    score += interestScore;
    if (commonInterests.length > 0) {
      reasons.push(`${commonInterests.length} common interests`);
    }

    // Preference matching
    if (this.matchesPreferences(user1, user2.preferences)) {
      score += 15;
      reasons.push('Matches preferences');
    }

    return {
      userId: user2.id,
      score,
      reasons
    };
  }

  // Check if ages are compatible
  private isAgeCompatible(range1: string, range2: string): boolean {
    const ranges = ['18-25', '26-35', '36-45', '46+'];
    const index1 = ranges.indexOf(range1);
    const index2 = ranges.indexOf(range2);
    
    if (index1 === -1 || index2 === -1) return true;
    
    // Adjacent age ranges are compatible
    return Math.abs(index1 - index2) <= 1;
  }

  // Get location compatibility score
  private getLocationScore(location1: string, location2: string): number {
    if (location1 === location2) {
      if (location1 === 'local') return 20;
      if (location1 === 'country') return 15;
      return 10; // global
    }
    
    // Different locations but both allow global
    if (location1 === 'global' || location2 === 'global') {
      return 5;
    }
    
    return 0;
  }

  // Get common interests
  private getCommonInterests(interests1: string[], interests2: string[]): string[] {
    return interests1.filter(interest => interests2.includes(interest));
  }

  // Check if user matches preferences
  private matchesPreferences(user: UserProfile, preferences: MatchingPreferences): boolean {
    if (preferences.ageRange && !this.isAgeCompatible(user.ageRange, preferences.ageRange)) {
      return false;
    }

    if (preferences.language && user.language !== preferences.language) {
      return false;
    }

    if (preferences.location && this.getLocationScore(user.location, preferences.location) === 0) {
      return false;
    }

    if (preferences.interests && preferences.interests.length > 0) {
      const commonInterests = this.getCommonInterests(user.interests, preferences.interests);
      if (commonInterests.length === 0) {
        return false;
      }
    }

    return true;
  }

  // Find best match for a user
  findBestMatch(userId: string): UserProfile | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const candidates = Array.from(this.users.values()).filter(candidate => {
      // Exclude self
      if (candidate.id === userId) return false;
      
      // Only online users
      if (!candidate.isOnline) return false;
      
      // Exclude reported users if preference is set
      if (user.preferences.excludeReported && this.reportedUsers.has(candidate.id)) {
        return false;
      }
      
      // Exclude users already matched with
      const userHistory = this.matchHistory.get(userId);
      if (userHistory && userHistory.has(candidate.id)) {
        return false;
      }
      
      return true;
    });

    if (candidates.length === 0) return null;

    // Calculate scores for all candidates
    const scores = candidates.map(candidate => 
      this.calculateMatchScore(user, candidate)
    );

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    // Add some randomness to prevent always matching with the same high-score users
    const topScores = scores.filter(s => s.score >= Math.max(50, scores[0].score - 20));
    const randomIndex = Math.floor(Math.random() * Math.min(3, topScores.length));
    const selectedMatch = topScores[randomIndex];

    const matchedUser = this.users.get(selectedMatch.userId);
    if (matchedUser) {
      // Add to match history
      this.addToMatchHistory(userId, selectedMatch.userId);
    }

    return matchedUser || null;
  }

  // Get user statistics
  getUserStats(userId: string): {
    totalMatches: number;
    onlineUsers: number;
    potentialMatches: number;
  } {
    const user = this.users.get(userId);
    const userHistory = this.matchHistory.get(userId);
    
    return {
      totalMatches: userHistory ? userHistory.size : 0,
      onlineUsers: Array.from(this.users.values()).filter(u => u.isOnline).length,
      potentialMatches: Array.from(this.users.values()).filter(candidate => {
        if (candidate.id === userId) return false;
        if (!candidate.isOnline) return false;
        if (userHistory && userHistory.has(candidate.id)) return false;
        if (user && !this.matchesPreferences(candidate, user.preferences)) return false;
        return true;
      }).length
    };
  }

  // Clear match history for a user (useful for testing or premium features)
  clearMatchHistory(userId: string): void {
    this.matchHistory.delete(userId);
    
    // Also remove this user from other users' history
    for (const [otherUserId, history] of this.matchHistory.entries()) {
      history.delete(userId);
    }
  }

  // Get all online users count
  getOnlineUsersCount(): number {
    return Array.from(this.users.values()).filter(u => u.isOnline).length;
  }

  // Simulate realistic user activity
  simulateUserActivity(): void {
    const users = Array.from(this.users.values());
    
    users.forEach(user => {
      // Randomly go online/offline
      if (Math.random() < 0.1) {
        user.isOnline = !user.isOnline;
        if (!user.isOnline) {
          user.lastSeen = new Date();
        }
      }
    });
  }
}

// Mock data for demonstration
export const createMockUsers = (): UserProfile[] => {
  const names = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage'];
  const ageRanges = ['18-25', '26-35', '36-45', '46+'];
  const locations = ['global', 'local', 'country'];
  const languages = ['en', 'es', 'fr', 'de'];
  const interestOptions = ['music', 'movies', 'travel', 'sports', 'art', 'technology', 'cooking', 'reading'];

  return names.map((name, index) => ({
    id: `user_${index + 1}`,
    ageRange: ageRanges[Math.floor(Math.random() * ageRanges.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    language: languages[Math.floor(Math.random() * languages.length)],
    interests: interestOptions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 1),
    isOnline: Math.random() > 0.3,
    lastSeen: new Date(Date.now() - Math.random() * 3600000),
    preferences: {
      excludeReported: true
    }
  }));
};

// Singleton instance
export const matchingService = new MatchingService();

// Initialize with mock data
createMockUsers().forEach(user => matchingService.addUser(user));