/**
 * Cache Service for optimizing database queries and reducing load
 * Uses browser localStorage for client-side caching with TTL support
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

export interface CachedItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CachedItem<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get item from cache if not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set item in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, item);
    
    // Clean up expired items periodically
    this.scheduleCleanup();
  }

  /**
   * Remove item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Wrapper for caching async operations
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`📦 Cache hit for key: ${key}`);
      return cached;
    }

    console.log(`🔄 Cache miss for key: ${key}, fetching...`);
    
    try {
      // Fetch data and cache it
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch data for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Clean up expired items
   */
  private scheduleCleanup(): void {
    // Run cleanup every 10 minutes
    setTimeout(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired items`);
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Cache key generators for common data types
export const CacheKeys = {
  // User data
  userProfile: (userId: string) => `user:profile:${userId}`,
  userCommunities: (userId: string) => `user:communities:${userId}`,
  
  // Community data
  communityDetails: (communityId: string) => `community:details:${communityId}`,
  communityMembers: (communityId: string) => `community:members:${communityId}`,
  communityPosts: (communityId: string) => `community:posts:${communityId}`,
  
  // Live streams
  liveStreams: () => 'streams:live',
  streamDetails: (streamId: string) => `stream:details:${streamId}`,
  
  // Leaderboard
  leaderboard: (communityId: string) => `leaderboard:${communityId}`,
  
  // Events
  communityEvents: (communityId: string) => `community:events:${communityId}`,
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes  
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 2 * 60 * 60 * 1000, // 2 hours
};