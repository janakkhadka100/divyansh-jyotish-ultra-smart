import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { z } from 'zod';
import { prisma } from '@/server/lib/prisma';
import { analyticsService } from './analytics';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptRounds: number;
  enableRateLimiting: boolean;
  enableIPWhitelist: boolean;
  enableDeviceFingerprinting: boolean;
  enableAnomalyDetection: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // milliseconds
  sessionTimeout: number; // milliseconds
  enableAuditLogging: boolean;
  enableDataEncryption: boolean;
  encryptionKey: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  permissions: string[];
  metadata: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'suspicious_activity' | 'rate_limit' | 'data_access' | 'permission_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: any) => string;
}

const SecurityEventSchema = z.object({
  id: z.string(),
  type: z.enum(['login', 'logout', 'failed_login', 'suspicious_activity', 'rate_limit', 'data_access', 'permission_denied']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  description: z.string(),
  metadata: z.record(z.any()),
  timestamp: z.date(),
  resolved: z.boolean(),
});

class AdvancedSecurityService {
  private config: SecurityConfig;
  private rateLimiters: Map<string, RateLimiterMemory | RateLimiterRedis> = new Map();
  private redisClient: any = null;
  private isInitialized = false;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn: config.jwtExpiresIn || '1h',
      refreshTokenExpiresIn: config.refreshTokenExpiresIn || '7d',
      bcryptRounds: config.bcryptRounds || 12,
      enableRateLimiting: config.enableRateLimiting !== false,
      enableIPWhitelist: config.enableIPWhitelist || false,
      enableDeviceFingerprinting: config.enableDeviceFingerprinting !== false,
      enableAnomalyDetection: config.enableAnomalyDetection !== false,
      maxLoginAttempts: config.maxLoginAttempts || 5,
      lockoutDuration: config.lockoutDuration || 900000, // 15 minutes
      sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
      enableAuditLogging: config.enableAuditLogging !== false,
      enableDataEncryption: config.enableDataEncryption || false,
      encryptionKey: config.encryptionKey || process.env.ENCRYPTION_KEY || 'your-encryption-key',
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Redis for rate limiting
      if (this.config.enableRateLimiting) {
        this.redisClient = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        await this.redisClient.connect();
      }

      // Initialize rate limiters
      this.initializeRateLimiters();

      this.isInitialized = true;
      console.log('Advanced Security Service initialized');

    } catch (error) {
      console.error('Error initializing security service:', error);
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: any): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      issuer: 'divyansh-jyotish',
      audience: 'divyansh-jyotish-users',
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: any): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.refreshTokenExpiresIn,
      issuer: 'divyansh-jyotish',
      audience: 'divyansh-jyotish-refresh',
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        issuer: 'divyansh-jyotish',
        audience: 'divyansh-jyotish-users',
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        issuer: 'divyansh-jyotish',
        audience: 'divyansh-jyotish-refresh',
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.bcryptRounds);
  }

  /**
   * Compare password
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create user session
   */
  async createSession(
    userId: string,
    deviceId: string,
    ipAddress: string,
    userAgent: string,
    location?: any,
    permissions: string[] = []
  ): Promise<UserSession> {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.sessionTimeout);

      const session: UserSession = {
        id: sessionId,
        userId,
        deviceId,
        ipAddress,
        userAgent,
        location,
        createdAt: now,
        lastActivity: now,
        expiresAt,
        isActive: true,
        permissions,
        metadata: {},
      };

      // Store session in database
      await prisma.userSession.create({
        data: {
          id: sessionId,
          userId,
          deviceId,
          ipAddress,
          userAgent,
          location: location ? JSON.stringify(location) : null,
          expiresAt,
          permissions: JSON.stringify(permissions),
          metadata: JSON.stringify({}),
        },
      });

      // Log security event
      await this.logSecurityEvent({
        type: 'login',
        severity: 'low',
        userId,
        sessionId,
        ipAddress,
        userAgent,
        description: 'User session created',
        metadata: { deviceId, location },
      });

      return session;

    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return null;
      }

      // Update last activity
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { lastActivity: new Date() },
      });

      return {
        id: session.id,
        userId: session.userId,
        deviceId: session.deviceId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location ? JSON.parse(session.location) : undefined,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        isActive: session.isActive,
        permissions: session.permissions ? JSON.parse(session.permissions) : [],
        metadata: session.metadata ? JSON.parse(session.metadata) : {},
      };

    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string, userId?: string): Promise<void> {
    try {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false },
      });

      // Log security event
      await this.logSecurityEvent({
        type: 'logout',
        severity: 'low',
        userId,
        sessionId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        description: 'User session invalidated',
        metadata: {},
      });

    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(
    key: string,
    limitConfig: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remaining: 999, resetTime: Date.now() + limitConfig.windowMs };
    }

    try {
      const rateLimiter = this.getRateLimiter(key, limitConfig);
      const result = await rateLimiter.consume(key);

      return {
        allowed: result.remainingPoints > 0,
        remaining: result.remainingPoints,
        resetTime: result.msBeforeNext,
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: false, remaining: 0, resetTime: Date.now() + limitConfig.windowMs };
    }
  }

  /**
   * Check IP whitelist
   */
  async checkIPWhitelist(ipAddress: string): Promise<boolean> {
    if (!this.config.enableIPWhitelist) {
      return true;
    }

    try {
      // This would check against a whitelist in database
      // For now, just return true
      return true;

    } catch (error) {
      console.error('Error checking IP whitelist:', error);
      return false;
    }
  }

  /**
   * Detect suspicious activity
   */
  async detectSuspiciousActivity(
    userId: string,
    ipAddress: string,
    userAgent: string,
    action: string,
    metadata: any = {}
  ): Promise<boolean> {
    if (!this.config.enableAnomalyDetection) {
      return false;
    }

    try {
      // Check for multiple failed login attempts
      const failedAttempts = await prisma.securityEvent.count({
        where: {
          userId,
          type: 'failed_login',
          timestamp: {
            gte: new Date(Date.now() - 3600000), // Last hour
          },
        },
      });

      if (failedAttempts >= this.config.maxLoginAttempts) {
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          userId,
          ipAddress,
          userAgent,
          description: 'Multiple failed login attempts detected',
          metadata: { failedAttempts, action, ...metadata },
        });
        return true;
      }

      // Check for unusual IP address
      const recentSessions = await prisma.userSession.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 86400000), // Last 24 hours
          },
        },
        select: { ipAddress: true },
      });

      const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress));
      if (uniqueIPs.size > 5) { // More than 5 different IPs in 24 hours
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'medium',
          userId,
          ipAddress,
          userAgent,
          description: 'Unusual IP address pattern detected',
          metadata: { uniqueIPs: uniqueIPs.size, action, ...metadata },
        });
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    if (!this.config.enableAuditLogging) {
      return;
    }

    try {
      const securityEvent: SecurityEvent = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        resolved: false,
      };

      // Validate event
      SecurityEventSchema.parse(securityEvent);

      // Store in database
      await prisma.securityEvent.create({
        data: {
          id: securityEvent.id,
          type: securityEvent.type,
          severity: securityEvent.severity,
          userId: securityEvent.userId,
          sessionId: securityEvent.sessionId,
          ipAddress: securityEvent.ipAddress,
          userAgent: securityEvent.userAgent,
          description: securityEvent.description,
          metadata: JSON.stringify(securityEvent.metadata),
          timestamp: securityEvent.timestamp,
          resolved: securityEvent.resolved,
        },
      });

      // Track analytics
      await analyticsService.trackEvent({
        type: 'business',
        category: 'security',
        action: event.type,
        userId: event.userId,
        metadata: {
          severity: event.severity,
          description: event.description,
          ...event.metadata,
        },
        success: true,
      });

    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    if (!this.config.enableDataEncryption) {
      return data;
    }

    // Simple encryption - in production, use proper encryption
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    if (!this.config.enableDataEncryption) {
      return encryptedData;
    }

    // Simple decryption - in production, use proper decryption
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    failedLogins: number;
    suspiciousActivities: number;
    rateLimitHits: number;
    securityEvents: number;
  }> {
    try {
      const [
        totalSessions,
        activeSessions,
        failedLogins,
        suspiciousActivities,
        rateLimitHits,
        securityEvents,
      ] = await Promise.all([
        prisma.userSession.count(),
        prisma.userSession.count({ where: { isActive: true } }),
        prisma.securityEvent.count({ where: { type: 'failed_login' } }),
        prisma.securityEvent.count({ where: { type: 'suspicious_activity' } }),
        prisma.securityEvent.count({ where: { type: 'rate_limit' } }),
        prisma.securityEvent.count(),
      ]);

      return {
        totalSessions,
        activeSessions,
        failedLogins,
        suspiciousActivities,
        rateLimitHits,
        securityEvents,
      };

    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Private helper methods
  private initializeRateLimiters(): void {
    // Initialize different rate limiters for different endpoints
    const rateLimiters = [
      { key: 'login', windowMs: 900000, maxRequests: 5 }, // 5 attempts per 15 minutes
      { key: 'api', windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
      { key: 'horoscope', windowMs: 3600000, maxRequests: 10 }, // 10 horoscopes per hour
      { key: 'chat', windowMs: 60000, maxRequests: 20 }, // 20 messages per minute
    ];

    rateLimiters.forEach(({ key, windowMs, maxRequests }) => {
      const rateLimiter = new RateLimiterMemory({
        keyPrefix: key,
        points: maxRequests,
        duration: Math.floor(windowMs / 1000),
      });

      this.rateLimiters.set(key, rateLimiter);
    });
  }

  private getRateLimiter(key: string, limitConfig: RateLimitConfig): RateLimiterMemory | RateLimiterRedis {
    const rateLimiter = this.rateLimiters.get(key);
    if (rateLimiter) {
      return rateLimiter;
    }

    // Create new rate limiter
    const newRateLimiter = new RateLimiterMemory({
      keyPrefix: key,
      points: limitConfig.maxRequests,
      duration: Math.floor(limitConfig.windowMs / 1000),
    });

    this.rateLimiters.set(key, newRateLimiter);
    return newRateLimiter;
  }
}

// Export singleton instance
export const advancedSecurityService = new AdvancedSecurityService();

// Export class for testing
export { AdvancedSecurityService };
