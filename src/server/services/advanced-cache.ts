import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

export interface CacheStrategy {
  ttl: number;
  maxSize: number;
  compression: boolean;
  invalidation: 'time' | 'manual' | 'smart';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  errors: number;
  hitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
}

export interface CacheEntry<T> {
  data: T;
  metadata: {
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    ttl: number;
    priority: string;
    tags: string[];
    size: number;
  };
}

class AdvancedCacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    errors: 0,
    hitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
  };
  private responseTimes: number[] = [];

  // Cache strategies for different data types
  private strategies: Record<string, CacheStrategy> = {
    kundli: {
      ttl: 86400, // 24 hours
      maxSize: 1024 * 1024, // 1MB
      compression: true,
      invalidation: 'smart',
      priority: 'high',
    },
    dashas: {
      ttl: 3600, // 1 hour
      maxSize: 512 * 1024, // 512KB
      compression: true,
      invalidation: 'time',
      priority: 'medium',
    },
    panchang: {
      ttl: 1800, // 30 minutes
      maxSize: 256 * 1024, // 256KB
      compression: false,
      invalidation: 'time',
      priority: 'low',
    },
    geocoding: {
      ttl: 604800, // 7 days
      maxSize: 128 * 1024, // 128KB
      compression: false,
      invalidation: 'manual',
      priority: 'high',
    },
    analytics: {
      ttl: 300, // 5 minutes
      maxSize: 64 * 1024, // 64KB
      compression: true,
      invalidation: 'time',
      priority: 'low',
    },
  };

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DATABASE || '0'),
      });

      this.client.on('error', (err) => {
        console.error('Advanced Cache Error:', err);
        this.metrics.errors++;
      });

      this.client.on('connect', () => {
        console.log('Advanced Cache Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Advanced Cache Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Advanced Cache not available:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get data from cache with intelligent retrieval
   */
  async get<T>(
    key: string,
    type: keyof typeof this.strategies = 'kundli'
  ): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(key, type);

    try {
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        
        // Update access metadata
        entry.metadata.lastAccessed = new Date();
        entry.metadata.accessCount++;
        
        // Check if entry is still valid
        if (this.isEntryValid(entry)) {
          this.metrics.hits++;
          this.updateResponseTime(Date.now() - startTime);
          
          // Update cache with new metadata
          await this.client.setEx(
            cacheKey,
            entry.metadata.ttl,
            JSON.stringify(entry)
          );
          
          return entry.data;
        } else {
          // Entry expired, remove it
          await this.delete(key, type);
          this.metrics.misses++;
          return null;
        }
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * Set data in cache with intelligent storage
   */
  async set<T>(
    key: string,
    data: T,
    type: keyof typeof this.strategies = 'kundli',
    tags: string[] = []
  ): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    const startTime = Date.now();
    const strategy = this.strategies[type];
    const cacheKey = this.generateCacheKey(key, type);

    try {
      // Calculate data size
      const dataSize = this.calculateSize(data);
      
      // Check if data exceeds max size
      if (dataSize > strategy.maxSize) {
        console.warn(`Data size ${dataSize} exceeds max size ${strategy.maxSize} for type ${type}`);
        return false;
      }

      // Create cache entry
      const entry: CacheEntry<T> = {
        data,
        metadata: {
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0,
          ttl: strategy.ttl,
          priority: strategy.priority,
          tags,
          size: dataSize,
        },
      };

      // Compress data if strategy requires it
      const serializedData = strategy.compression 
        ? await this.compress(JSON.stringify(entry))
        : JSON.stringify(entry);

      await this.client.setEx(cacheKey, strategy.ttl, serializedData);
      
      this.metrics.sets++;
      this.updateResponseTime(Date.now() - startTime);
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string, type: keyof typeof this.strategies = 'kundli'): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateCacheKey(key, type);
      const result = await this.client.del(cacheKey);
      this.metrics.deletes++;
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      let invalidatedCount = 0;
      
      for (const tag of tags) {
        const pattern = `*:${tag}:*`;
        const keys = await this.client.keys(pattern);
        
        if (keys.length > 0) {
          await this.client.del(keys);
          invalidatedCount += keys.length;
        }
      }
      
      this.metrics.deletes += invalidatedCount;
      return invalidatedCount;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Smart cache warming
   */
  async warmCache<T>(
    key: string,
    dataFetcher: () => Promise<T>,
    type: keyof typeof this.strategies = 'kundli',
    tags: string[] = []
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, type);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const freshData = await dataFetcher();
    
    // Store in cache
    await this.set(key, freshData, type, tags);
    
    return freshData;
  }

  /**
   * Batch operations
   */
  async mget<T>(
    keys: string[],
    type: keyof typeof this.strategies = 'kundli'
  ): Promise<Map<string, T | null>> {
    if (!this.isConnected || !this.client) {
      return new Map();
    }

    try {
      const cacheKeys = keys.map(key => this.generateCacheKey(key, type));
      const values = await this.client.mGet(cacheKeys);
      
      const result = new Map<string, T | null>();
      
      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            const entry: CacheEntry<T> = JSON.parse(value);
            if (this.isEntryValid(entry)) {
              result.set(key, entry.data);
              this.metrics.hits++;
            } else {
              result.set(key, null);
              this.metrics.misses++;
            }
          } catch (error) {
            result.set(key, null);
            this.metrics.misses++;
          }
        } else {
          result.set(key, null);
          this.metrics.misses++;
        }
      });
      
      return result;
    } catch (error) {
      console.error('Cache mget error:', error);
      this.metrics.errors++;
      return new Map();
    }
  }

  /**
   * Batch set operations
   */
  async mset<T>(
    entries: Array<{ key: string; data: T; tags?: string[] }>,
    type: keyof typeof this.strategies = 'kundli'
  ): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      
      for (const { key, data, tags = [] } of entries) {
        const cacheKey = this.generateCacheKey(key, type);
        const strategy = this.strategies[type];
        
        const entry: CacheEntry<T> = {
          data,
          metadata: {
            createdAt: new Date(),
            lastAccessed: new Date(),
            accessCount: 0,
            ttl: strategy.ttl,
            priority: strategy.priority,
            tags,
            size: this.calculateSize(data),
          },
        };
        
        const serializedData = strategy.compression 
          ? await this.compress(JSON.stringify(entry))
          : JSON.stringify(entry);
        
        pipeline.setEx(cacheKey, strategy.ttl, serializedData);
      }
      
      await pipeline.exec();
      this.metrics.sets += entries.length;
      
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getMetrics(): CacheMetrics {
    this.metrics.hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100;
    this.metrics.averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    return { ...this.metrics };
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      this.resetMetrics();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }

  // Private helper methods
  private generateCacheKey(key: string, type: string): string {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return `advanced:${type}:${hash}`;
  }

  private isEntryValid<T>(entry: CacheEntry<T>): boolean {
    const now = new Date();
    const age = now.getTime() - entry.metadata.createdAt.getTime();
    return age < entry.metadata.ttl * 1000;
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private updateResponseTime(time: number): void {
    this.responseTimes.push(time);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  private async compress(data: string): Promise<string> {
    // Simple compression - in production, use zlib or similar
    return Buffer.from(data).toString('base64');
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      errors: 0,
      hitRate: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
    };
    this.responseTimes = [];
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const advancedCacheService = new AdvancedCacheService();

// Export class for testing
export { AdvancedCacheService };
