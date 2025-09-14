import { LRUCache } from 'lru-cache';
import { prisma } from '@/server/lib/prisma';
import { createError } from '@/server/lib/errors';

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  maxAge: number; // Maximum age in milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

class CacheService {
  private memoryCache: LRUCache<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.memoryCache = new LRUCache<string, CacheEntry<any>>({
      max: config.maxSize,
      ttl: config.ttl,
    });
  }

  private generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return now - entry.timestamp > entry.ttl;
  }

  private async getFromDatabase(key: string): Promise<any | null> {
    try {
      const cacheEntry = await prisma.cacheEntry.findUnique({
        where: { key },
      });

      if (!cacheEntry) {
        return null;
      }

      // Check if expired
      const now = Date.now();
      if (now - cacheEntry.timestamp.getTime() > cacheEntry.ttl) {
        // Delete expired entry
        await prisma.cacheEntry.delete({
          where: { key },
        });
        return null;
      }

      return JSON.parse(cacheEntry.data);
    } catch (error) {
      console.error('Database cache read error:', error);
      return null;
    }
  }

  private async setInDatabase(key: string, data: any, ttl: number): Promise<void> {
    try {
      await prisma.cacheEntry.upsert({
        where: { key },
        update: {
          data: JSON.stringify(data),
          timestamp: new Date(),
          ttl,
        },
        create: {
          key,
          data: JSON.stringify(data),
          timestamp: new Date(),
          ttl,
        },
      });
    } catch (error) {
      console.error('Database cache write error:', error);
      // Don't throw error for cache failures
    }
  }

  private async deleteFromDatabase(key: string): Promise<void> {
    try {
      await prisma.cacheEntry.delete({
        where: { key },
      });
    } catch (error) {
      console.error('Database cache delete error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // Check database cache
    const dbData = await this.getFromDatabase(key);
    if (dbData) {
      // Store in memory cache
      const entry: CacheEntry<T> = {
        data: dbData,
        timestamp: Date.now(),
        ttl: this.config.ttl,
        key,
      };
      this.memoryCache.set(key, entry);
      return dbData as T;
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const actualTtl = ttl || this.config.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: actualTtl,
      key,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in database cache (async, don't wait)
    this.setInDatabase(key, data, actualTtl).catch(console.error);
  }

  async delete(key: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from database cache
    await this.deleteFromDatabase(key);
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear database cache
    try {
      await prisma.cacheEntry.deleteMany({});
    } catch (error) {
      console.error('Database cache clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return true;
    }

    const dbData = await this.getFromDatabase(key);
    return dbData !== null;
  }

  getStats(): {
    memorySize: number;
    memoryMaxSize: number;
    memoryHitRate: number;
  } {
    return {
      memorySize: this.memoryCache.size,
      memoryMaxSize: this.memoryCache.max,
      memoryHitRate: 0, // Would need to track hits/misses
    };
  }
}

// Pre-configured cache instances
export const caches = {
  // General purpose cache
  general: new CacheService({
    maxSize: 1000,
    ttl: 60 * 60 * 1000, // 1 hour
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),

  // Prokerala API cache (longer TTL)
  prokerala: new CacheService({
    maxSize: 500,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }),

  // OpenAI responses cache (shorter TTL)
  openai: new CacheService({
    maxSize: 200,
    ttl: 30 * 60 * 1000, // 30 minutes
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  }),

  // Geocoding cache (very long TTL)
  geocoding: new CacheService({
    maxSize: 1000,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }),
};

// Cache key generators
export const cacheKeys = {
  prokerala: (lat: number, lon: number, utcBirth: string, ayanamsa: number, houseSystem: string) =>
    `prokerala:${lat}:${lon}:${utcBirth}:${ayanamsa}:${houseSystem}`,
  
  openai: (query: string, sessionId: string, language: string) =>
    `openai:${Buffer.from(query).toString('base64')}:${sessionId}:${language}`,
  
  geocoding: (query: string) =>
    `geocoding:${Buffer.from(query).toString('base64')}`,
  
  session: (sessionId: string) =>
    `session:${sessionId}`,
  
  horoscope: (sessionId: string) =>
    `horoscope:${sessionId}`,
};

// Cache decorator for functions
export function withCache<T extends any[], R>(
  cache: CacheService,
  keyGenerator: (...args: T) => string,
  ttl?: number
) {
  return function (fn: (...args: T) => Promise<R>) {
    return async (...args: T): Promise<R> => {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await cache.get<R>(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function and cache result
      const result = await fn(...args);
      await cache.set(key, result, ttl);
      
      return result;
    };
  };
}

// Cache invalidation helpers
export async function invalidateSessionCache(sessionId: string): Promise<void> {
  const keys = [
    cacheKeys.session(sessionId),
    cacheKeys.horoscope(sessionId),
  ];
  
  await Promise.all(keys.map(key => caches.general.delete(key)));
}

export async function invalidateProkeralaCache(lat: number, lon: number, utcBirth: string): Promise<void> {
  // Invalidate all Prokerala caches for this birth data
  const ayanamsas = [1, 2, 3]; // Common ayanamsa values
  const houseSystems = ['placidus', 'equal', 'koch'];
  
  const keys = ayanamsas.flatMap(ayanamsa =>
    houseSystems.map(houseSystem =>
      cacheKeys.prokerala(lat, lon, utcBirth, ayanamsa, houseSystem)
    )
  );
  
  await Promise.all(keys.map(key => caches.prokerala.delete(key)));
}

// Cache warming helpers
export async function warmCache<T>(
  cache: CacheService,
  key: string,
  dataLoader: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  const data = await dataLoader();
  await cache.set(key, data, ttl);
  return data;
}

export default CacheService;