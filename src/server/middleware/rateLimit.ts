import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
  remaining: number;
}

class RateLimiter {
  private cache: LRUCache<string, RateLimitInfo>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cache = new LRUCache<string, RateLimitInfo>({
      max: 1000, // Maximum number of entries
      ttl: config.windowMs, // TTL for entries
    });
  }

  private generateKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation: IP + route
    const ip = this.getClientIP(req);
    const route = req.nextUrl.pathname;
    return `${ip}:${route}`;
  }

  private getClientIP(req: NextRequest): string {
    // Try to get IP from various headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // Fallback to a default IP (for development)
    return '127.0.0.1';
  }

  private getRateLimitInfo(key: string): RateLimitInfo {
    const now = Date.now();
    const existing = this.cache.get(key);
    
    if (existing && existing.resetTime > now) {
      // Still within the window
      return {
        count: existing.count,
        resetTime: existing.resetTime,
        remaining: Math.max(0, this.config.maxRequests - existing.count),
      };
    }
    
    // New window or expired
    const resetTime = now + this.config.windowMs;
    const newInfo: RateLimitInfo = {
      count: 0,
      resetTime,
      remaining: this.config.maxRequests,
    };
    
    this.cache.set(key, newInfo);
    return newInfo;
  }

  private incrementCount(key: string): RateLimitInfo {
    const now = Date.now();
    const existing = this.cache.get(key);
    
    if (existing && existing.resetTime > now) {
      // Within the window, increment count
      existing.count++;
      existing.remaining = Math.max(0, this.config.maxRequests - existing.count);
      this.cache.set(key, existing);
      return existing;
    }
    
    // New window or expired
    const resetTime = now + this.config.windowMs;
    const newInfo: RateLimitInfo = {
      count: 1,
      resetTime,
      remaining: this.config.maxRequests - 1,
    };
    
    this.cache.set(key, newInfo);
    return newInfo;
  }

  check(req: NextRequest): {
    allowed: boolean;
    info: RateLimitInfo;
    headers: Record<string, string>;
  } {
    const key = this.generateKey(req);
    const info = this.getRateLimitInfo(key);
    
    const allowed = info.count < this.config.maxRequests;
    
    const headers = {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': info.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(info.resetTime / 1000).toString(),
    };
    
    if (!allowed) {
      const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);
      headers['Retry-After'] = retryAfter.toString();
    }
    
    return { allowed, info, headers };
  }

  increment(req: NextRequest): {
    allowed: boolean;
    info: RateLimitInfo;
    headers: Record<string, string>;
  } {
    const key = this.generateKey(req);
    const info = this.incrementCount(key);
    
    const allowed = info.count <= this.config.maxRequests;
    
    const headers = {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': info.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(info.resetTime / 1000).toString(),
    };
    
    if (!allowed) {
      const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);
      headers['Retry-After'] = retryAfter.toString();
    }
    
    return { allowed, info, headers };
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }),
  
  // Chat rate limiter (more generous)
  chat: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  }),
  
  // Compute rate limiter (stricter)
  compute: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  }),
  
  // Auth rate limiter (very strict)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  }),
};

// Helper function to create rate limit middleware
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (req: NextRequest): NextResponse | null => {
    const { allowed, headers } = limiter.increment(req);
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: headers['Retry-After'],
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }
    
    return null;
  };
}

// Helper function to check rate limit without incrementing
export function checkRateLimit(limiter: RateLimiter, req: NextRequest) {
  return limiter.check(req);
}

// Helper function to get rate limit info for a request
export function getRateLimitInfo(limiter: RateLimiter, req: NextRequest) {
  const { info, headers } = limiter.check(req);
  return { info, headers };
}

// Rate limit decorator for API routes
export function withRateLimit(limiter: RateLimiter) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const { allowed, headers } = limiter.increment(req);
      
      if (!allowed) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: headers['Retry-After'],
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          }
        );
      }
      
      const response = await handler(req);
      
      // Add rate limit headers to successful responses
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    };
  };
}

export default RateLimiter;




