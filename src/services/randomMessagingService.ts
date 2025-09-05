import { supabase } from '@/integrations/supabase/client';

export interface RandomMessagingPreferences {
  ageRange: string;
  interests: string[];
  location: string;
  language: string;
}

export interface RandomPartner {
  id: string;
  displayName: string;
  age: number;
  location: string;
  interests: string[];
  isOnline: boolean;
  matchScore?: number;
}

export interface RandomMessage {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  sender: 'local' | 'remote';
  senderId: string;
}

export interface RandomConversation {
  id: string;
  partnerId: string;
  partnerInfo: RandomPartner;
  messages: RandomMessage[];
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
}

class RandomMessagingService {
  private conversations: Map<string, RandomConversation> = new Map();
  private currentConversation: RandomConversation | null = null;
  private messageCallbacks: Set<(message: RandomMessage) => void> = new Set();
  private partnerCallbacks: Set<(partner: RandomPartner | null) => void> = new Set();
  private statusCallbacks: Set<(status: 'searching' | 'connected' | 'disconnected') => void> = new Set();

  // Subscribe to message updates
  onMessage(callback: (message: RandomMessage) => void) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  // Subscribe to partner updates
  onPartnerChange(callback: (partner: RandomPartner | null) => void) {
    this.partnerCallbacks.add(callback);
    return () => this.partnerCallbacks.delete(callback);
  }

  // Subscribe to status updates
  onStatusChange(callback: (status: 'searching' | 'connected' | 'disconnected') => void) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  // Find a random partner based on preferences
  async findRandomPartner(preferences: RandomMessagingPreferences): Promise<RandomPartner> {
    // Notify status change
    this.statusCallbacks.forEach(callback => callback('searching'));

    // Simulate finding a partner (in a real implementation, this would query the database)
    const mockPartners = this.generateMockPartners(preferences);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
    
    // Select best match based on preferences
    const partner = this.selectBestMatch(mockPartners, preferences);
    
    // Create a new conversation
    const conversation: RandomConversation = {
      id: this.generateId(),
      partnerId: partner.id,
      partnerInfo: partner,
      messages: [],
      status: 'active',
      startedAt: new Date()
    };

    this.currentConversation = conversation;
    this.conversations.set(conversation.id, conversation);

    // Notify callbacks
    this.partnerCallbacks.forEach(callback => callback(partner));
    this.statusCallbacks.forEach(callback => callback('connected'));

    return partner;
  }

  // Send a message to the current partner
  async sendMessage(text: string): Promise<RandomMessage> {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    const message: RandomMessage = {
      id: this.generateId(),
      text: text.trim(),
      timestamp: new Date(),
      isOwn: true,
      sender: 'local',
      senderId: 'current-user' // In a real app, this would be the actual user ID
    };

    // Add message to conversation
    this.currentConversation.messages.push(message);

    // Simulate partner response after a delay
    setTimeout(() => {
      this.simulatePartnerResponse();
    }, Math.random() * 3000 + 1000);

    return message;
  }

  // End the current conversation
  endConversation(): void {
    if (this.currentConversation) {
      this.currentConversation.status = 'ended';
      this.currentConversation.endedAt = new Date();
      this.currentConversation = null;
    }

    // Notify callbacks
    this.partnerCallbacks.forEach(callback => callback(null));
    this.statusCallbacks.forEach(callback => callback('disconnected'));
  }

  // Skip to next partner
  async skipToNext(preferences: RandomMessagingPreferences): Promise<RandomPartner> {
    this.endConversation();
    return this.findRandomPartner(preferences);
  }

  // Get current conversation
  getCurrentConversation(): RandomConversation | null {
    return this.currentConversation;
  }

  // Get conversation history
  getConversationHistory(): RandomConversation[] {
    return Array.from(this.conversations.values())
      .filter(conv => conv.status === 'ended')
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  // Report a user
  async reportUser(partnerId: string, reason: string, description?: string): Promise<void> {
    // In a real implementation, this would send the report to the server
    console.log('Reporting user:', { partnerId, reason, description });
    
    // End the current conversation
    this.endConversation();
  }

  // Like a user
  async likeUser(partnerId: string): Promise<void> {
    // In a real implementation, this would record the like in the database
    console.log('Liking user:', partnerId);
  }

  // Private helper methods
  private generateMockPartners(preferences: RandomMessagingPreferences): RandomPartner[] {
    const names = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Sage', 'River', 'Phoenix', 'Dakota', 'Emery', 'Rowan', 'Skyler', 'Taylor'];
    const locations = [
      'New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia', 
      'Toronto, Canada', 'Berlin, Germany', 'Paris, France', 'Seoul, South Korea', 
      'São Paulo, Brazil', 'Mumbai, India', 'Dubai, UAE', 'Singapore', 
      'Barcelona, Spain', 'Amsterdam, Netherlands', 'Stockholm, Sweden'
    ];
    const allInterests = [
      'Music', 'Travel', 'Art', 'Sports', 'Technology', 'Books', 'Movies', 
      'Gaming', 'Food', 'Photography', 'Fitness', 'Science', 'Nature', 
      'Fashion', 'History', 'Cooking', 'Dancing', 'Writing', 'Languages', 'Yoga'
    ];

    const partners: RandomPartner[] = [];
    
    for (let i = 0; i < 10; i++) {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomAge = this.generateAgeInRange(preferences.ageRange);
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      const randomInterests = allInterests
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 6) + 2);

      const partner: RandomPartner = {
        id: this.generateId(),
        displayName: randomName,
        age: randomAge,
        location: randomLocation,
        interests: randomInterests,
        isOnline: true,
        matchScore: this.calculateMatchScore(preferences, {
          interests: randomInterests,
          location: randomLocation,
          age: randomAge
        })
      };

      partners.push(partner);
    }

    return partners;
  }

  private generateAgeInRange(ageRange: string): number {
    const ranges: { [key: string]: [number, number] } = {
      '18-25': [18, 25],
      '26-35': [26, 35],
      '36-45': [36, 45],
      '18-35': [18, 35],
      '25-45': [25, 45],
      '18-99': [18, 65]
    };

    const [min, max] = ranges[ageRange] || [18, 35];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private calculateMatchScore(preferences: RandomMessagingPreferences, partnerData: {
    interests: string[];
    location: string;
    age: number;
  }): number {
    let score = 0;

    // Interest matching (40% weight)
    const commonInterests = preferences.interests.filter(interest => 
      partnerData.interests.includes(interest)
    ).length;
    const interestScore = preferences.interests.length > 0 
      ? (commonInterests / preferences.interests.length) * 40
      : 20; // Default score if no preferences set

    score += interestScore;

    // Location preference (30% weight)
    let locationScore = 0;
    if (preferences.location === 'global') {
      locationScore = 30;
    } else if (preferences.location === 'local') {
      // Simulate local matching (in reality, this would use actual location data)
      locationScore = Math.random() > 0.7 ? 30 : 10;
    } else if (preferences.location === 'country') {
      // Check if same country (simplified)
      const userCountry = partnerData.location.split(', ')[1];
      locationScore = Math.random() > 0.5 ? 30 : 15;
    }

    score += locationScore;

    // Age compatibility (20% weight)
    const ageScore = 20; // Simplified - in reality would check age compatibility

    score += ageScore;

    // Random factor (10% weight)
    score += Math.random() * 10;

    return Math.min(100, Math.max(0, score));
  }

  private selectBestMatch(partners: RandomPartner[], preferences: RandomMessagingPreferences): RandomPartner {
    // Sort by match score and return the best match
    partners.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    return partners[0];
  }

  private simulatePartnerResponse(): void {
    if (!this.currentConversation) return;

    const responses = [
      "That's really interesting!",
      "I totally agree with you",
      "Tell me more about that",
      "That's so cool!",
      "I've never thought about it that way",
      "What do you think about...",
      "That reminds me of something",
      "I love that too!",
      "Really? That's amazing!",
      "I can relate to that",
      "That's fascinating!",
      "You seem really cool",
      "I enjoy talking with you",
      "What's your favorite...",
      "Have you ever tried...",
      "That sounds like fun",
      "I'd love to hear more",
      "That's a great point",
      "I'm curious about...",
      "Thanks for sharing that"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const message: RandomMessage = {
      id: this.generateId(),
      text: randomResponse,
      timestamp: new Date(),
      isOwn: false,
      sender: 'remote',
      senderId: this.currentConversation.partnerId
    };

    this.currentConversation.messages.push(message);

    // Notify message callbacks
    this.messageCallbacks.forEach(callback => callback(message));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const randomMessagingService = new RandomMessagingService();