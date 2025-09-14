import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';
import crypto from 'crypto';

interface SecurityThreat {
  id: string;
  type: 'sql_injection' | 'xss' | 'csrf' | 'brute_force' | 'ddos' | 'malware' | 'phishing' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  timestamp: Date;
  blocked: boolean;
  action: string;
  metadata: any;
}

interface SecurityPolicy {
  id: string;
  name: string;
  type: 'access_control' | 'data_protection' | 'network_security' | 'authentication' | 'authorization';
  rules: SecurityRule[];
  enabled: boolean;
  priority: number;
  lastUpdated: Date;
}

interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'block' | 'alert' | 'log';
  parameters: any;
  enabled: boolean;
}

interface SecurityAudit {
  id: string;
  type: 'access' | 'data' | 'network' | 'authentication' | 'authorization';
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata: any;
}

interface SecurityMetrics {
  totalThreats: number;
  blockedThreats: number;
  activePolicies: number;
  securityScore: number;
  lastAudit: Date;
  threatTypes: Record<string, number>;
  topSources: string[];
  topTargets: string[];
}

interface EncryptionKey {
  id: string;
  name: string;
  algorithm: 'aes-256-gcm' | 'aes-128-gcm' | 'chacha20-poly1305';
  key: Buffer;
  iv: Buffer;
  created: Date;
  expires?: Date;
  active: boolean;
}

class AdvancedSecuritySystem {
  private threats: Map<string, SecurityThreat>;
  private policies: Map<string, SecurityPolicy>;
  private audits: Map<string, SecurityAudit>;
  private encryptionKeys: Map<string, EncryptionKey>;
  private blockedIPs: Set<string>;
  private suspiciousUsers: Set<string>;
  private rateLimits: Map<string, { count: number; resetTime: number }>;
  private securityMetrics: SecurityMetrics;

  constructor() {
    this.threats = new Map();
    this.policies = new Map();
    this.audits = new Map();
    this.encryptionKeys = new Map();
    this.blockedIPs = new Set();
    this.suspiciousUsers = new Set();
    this.rateLimits = new Map();
    this.securityMetrics = this.initializeSecurityMetrics();
    
    this.initializeSecurityPolicies();
    this.initializeEncryptionKeys();
    this.startSecurityMonitoring();
  }

  /**
   * Detect and block security threats
   */
  async detectThreat(
    type: SecurityThreat['type'],
    source: string,
    target: string,
    description: string,
    metadata: any = {}
  ): Promise<SecurityThreat> {
    try {
      const threat: SecurityThreat = {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        severity: this.calculateThreatSeverity(type, metadata),
        source,
        target,
        description,
        timestamp: new Date(),
        blocked: false,
        action: 'detected',
        metadata,
      };

      // Apply security policies
      const policy = await this.applySecurityPolicies(threat);
      threat.blocked = policy.blocked;
      threat.action = policy.action;

      // Block if necessary
      if (threat.blocked) {
        await this.blockThreat(threat);
      }

      this.threats.set(threat.id, threat);

      // Track threat detection
      await analyticsService.trackEvent({
        type: 'security',
        category: 'threat_detection',
        action: 'threat_detected',
        metadata: {
          threatId: threat.id,
          type: threat.type,
          severity: threat.severity,
          blocked: threat.blocked,
        },
        success: true,
        duration: 0,
      });

      return threat;
    } catch (error) {
      console.error('Threat detection error:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(
    data: string,
    keyName: string = 'default'
  ): Promise<{ encrypted: string; keyId: string; iv: string }> {
    try {
      const key = this.encryptionKeys.get(keyName);
      if (!key || !key.active) {
        throw new Error('Encryption key not found or inactive');
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(key.algorithm, key.key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encrypted,
        keyId: key.id,
        iv: iv.toString('hex'),
      };
    } catch (error) {
      console.error('Data encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(
    encryptedData: string,
    keyId: string,
    iv: string
  ): Promise<string> {
    try {
      const key = this.encryptionKeys.get(keyId);
      if (!key || !key.active) {
        throw new Error('Decryption key not found or inactive');
      }

      const decipher = crypto.createDecipher(key.algorithm, key.key);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Data decryption error:', error);
      throw error;
    }
  }

  /**
   * Audit security event
   */
  async auditSecurityEvent(
    type: SecurityAudit['type'],
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'blocked',
    userId?: string,
    sessionId?: string,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown',
    metadata: any = {}
  ): Promise<SecurityAudit> {
    try {
      const audit: SecurityAudit = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        userId,
        sessionId,
        action,
        resource,
        result,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        metadata,
      };

      this.audits.set(audit.id, audit);

      // Check for suspicious patterns
      await this.checkSuspiciousPatterns(audit);

      // Update security metrics
      this.updateSecurityMetrics();

      return audit;
    } catch (error) {
      console.error('Security audit error:', error);
      throw error;
    }
  }

  /**
   * Validate input for security threats
   */
  async validateInput(
    input: string,
    type: 'sql' | 'xss' | 'csrf' | 'general' = 'general'
  ): Promise<{ valid: boolean; threats: string[] }> {
    try {
      const threats: string[] = [];

      // SQL Injection detection
      if (type === 'sql' || type === 'general') {
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
          /(;|\-\-|\/\*|\*\/)/,
          /(\b(OR|AND)\b.*\b(OR|AND)\b)/i,
        ];
        
        for (const pattern of sqlPatterns) {
          if (pattern.test(input)) {
            threats.push('sql_injection');
            break;
          }
        }
      }

      // XSS detection
      if (type === 'xss' || type === 'general') {
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /<iframe[^>]*>.*?<\/iframe>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
        ];
        
        for (const pattern of xssPatterns) {
          if (pattern.test(input)) {
            threats.push('xss');
            break;
          }
        }
      }

      // CSRF detection
      if (type === 'csrf' || type === 'general') {
        if (input.includes('csrf') || input.includes('token')) {
          threats.push('csrf');
        }
      }

      return {
        valid: threats.length === 0,
        threats,
      };
    } catch (error) {
      console.error('Input validation error:', error);
      return { valid: false, threats: ['validation_error'] };
    }
  }

  /**
   * Rate limit requests
   */
  async rateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60000
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const now = Date.now();
      const key = `${identifier}_${Math.floor(now / windowMs)}`;
      
      const current = this.rateLimits.get(key) || { count: 0, resetTime: now + windowMs };
      
      if (now > current.resetTime) {
        current.count = 0;
        current.resetTime = now + windowMs;
      }
      
      current.count++;
      this.rateLimits.set(key, current);
      
      const allowed = current.count <= limit;
      const remaining = Math.max(0, limit - current.count);
      
      if (!allowed) {
        // Block the IP if rate limit exceeded
        this.blockedIPs.add(identifier);
        
        // Detect as brute force attack
        await this.detectThreat(
          'brute_force',
          identifier,
          'rate_limit_exceeded',
          'Rate limit exceeded',
          { limit, windowMs, count: current.count }
        );
      }
      
      return {
        allowed,
        remaining,
        resetTime: current.resetTime,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      return { allowed: false, remaining: 0, resetTime: Date.now() + 60000 };
    }
  }

  /**
   * Generate secure token
   */
  async generateSecureToken(
    length: number = 32,
    type: 'alphanumeric' | 'hex' | 'base64' = 'alphanumeric'
  ): Promise<string> {
    try {
      let token: string;
      
      switch (type) {
        case 'hex':
          token = crypto.randomBytes(length).toString('hex');
          break;
        case 'base64':
          token = crypto.randomBytes(length).toString('base64');
          break;
        default:
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          token = Array.from(crypto.randomBytes(length))
            .map(byte => chars[byte % chars.length])
            .join('');
      }
      
      return token;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    try {
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      
      return { hash, salt };
    } catch (error) {
      console.error('Password hashing error:', error);
      throw error;
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(
    password: string,
    hash: string,
    salt: string
  ): Promise<boolean> {
    try {
      const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return hash === testHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return this.securityMetrics;
  }

  /**
   * Get security threats
   */
  getSecurityThreats(limit: number = 100): SecurityThreat[] {
    return Array.from(this.threats.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security audits
   */
  getSecurityAudits(limit: number = 100): SecurityAudit[] {
    return Array.from(this.audits.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Calculate threat severity
   */
  private calculateThreatSeverity(type: SecurityThreat['type'], metadata: any): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<SecurityThreat['type'], 'low' | 'medium' | 'high' | 'critical'> = {
      'sql_injection': 'critical',
      'xss': 'high',
      'csrf': 'medium',
      'brute_force': 'high',
      'ddos': 'critical',
      'malware': 'critical',
      'phishing': 'high',
      'unauthorized_access': 'high',
    };
    
    return severityMap[type] || 'medium';
  }

  /**
   * Apply security policies
   */
  private async applySecurityPolicies(threat: SecurityThreat): Promise<{ blocked: boolean; action: string }> {
    const policies = Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    for (const policy of policies) {
      for (const rule of policy.rules) {
        if (rule.enabled && this.evaluateRule(rule, threat)) {
          return {
            blocked: rule.action === 'deny' || rule.action === 'block',
            action: rule.action,
          };
        }
      }
    }
    
    return { blocked: false, action: 'allow' };
  }

  /**
   * Evaluate security rule
   */
  private evaluateRule(rule: SecurityRule, threat: SecurityThreat): boolean {
    try {
      const condition = rule.condition.toLowerCase();
      
      if (condition.includes('threat_type') && condition.includes('==')) {
        const expectedType = condition.split('==')[1].trim().replace(/['"]/g, '');
        return threat.type === expectedType;
      }
      
      if (condition.includes('severity') && condition.includes('>=')) {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        const threshold = condition.split('>=')[1].trim();
        return severityLevels[threat.severity] >= severityLevels[threshold as keyof typeof severityLevels];
      }
      
      if (condition.includes('source') && condition.includes('contains')) {
        const expectedSource = condition.split('contains')[1].trim().replace(/['"]/g, '');
        return threat.source.includes(expectedSource);
      }
      
      return false;
    } catch (error) {
      console.error('Rule evaluation error:', error);
      return false;
    }
  }

  /**
   * Block threat
   */
  private async blockThreat(threat: SecurityThreat): Promise<void> {
    try {
      // Block IP address
      this.blockedIPs.add(threat.source);
      
      // Add to suspicious users if applicable
      if (threat.metadata.userId) {
        this.suspiciousUsers.add(threat.metadata.userId);
      }
      
      // Log blocking action
      await this.auditSecurityEvent(
        'access',
        'block_threat',
        threat.target,
        'blocked',
        threat.metadata.userId,
        threat.metadata.sessionId,
        threat.source,
        threat.metadata.userAgent,
        { threatId: threat.id, reason: 'security_policy' }
      );
    } catch (error) {
      console.error('Threat blocking error:', error);
    }
  }

  /**
   * Check suspicious patterns
   */
  private async checkSuspiciousPatterns(audit: SecurityAudit): Promise<void> {
    try {
      // Check for multiple failed attempts
      const recentFailures = Array.from(this.audits.values())
        .filter(a => a.result === 'failure' && 
                     a.timestamp > new Date(Date.now() - 300000) && // Last 5 minutes
                     a.ipAddress === audit.ipAddress)
        .length;
      
      if (recentFailures > 5) {
        await this.detectThreat(
          'brute_force',
          audit.ipAddress,
          audit.resource,
          'Multiple failed attempts detected',
          { failures: recentFailures, userId: audit.userId }
        );
      }
      
      // Check for unusual access patterns
      if (audit.type === 'access' && audit.result === 'success') {
        const recentAccess = Array.from(this.audits.values())
          .filter(a => a.type === 'access' && 
                       a.timestamp > new Date(Date.now() - 60000) && // Last minute
                       a.ipAddress === audit.ipAddress)
          .length;
        
        if (recentAccess > 20) {
          await this.detectThreat(
            'ddos',
            audit.ipAddress,
            audit.resource,
            'Unusual access pattern detected',
            { accesses: recentAccess }
          );
        }
      }
    } catch (error) {
      console.error('Suspicious pattern detection error:', error);
    }
  }

  /**
   * Update security metrics
   */
  private updateSecurityMetrics(): void {
    const totalThreats = this.threats.size;
    const blockedThreats = Array.from(this.threats.values()).filter(t => t.blocked).length;
    const activePolicies = Array.from(this.policies.values()).filter(p => p.enabled).length;
    
    const threatTypes: Record<string, number> = {};
    Array.from(this.threats.values()).forEach(threat => {
      threatTypes[threat.type] = (threatTypes[threat.type] || 0) + 1;
    });
    
    const topSources = Array.from(this.threats.values())
      .reduce((acc, threat) => {
        acc[threat.source] = (acc[threat.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topTargets = Array.from(this.threats.values())
      .reduce((acc, threat) => {
        acc[threat.target] = (acc[threat.target] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    this.securityMetrics = {
      totalThreats,
      blockedThreats,
      activePolicies,
      securityScore: this.calculateSecurityScore(),
      lastAudit: new Date(),
      threatTypes,
      topSources: Object.keys(topSources).sort((a, b) => topSources[b] - topSources[a]).slice(0, 10),
      topTargets: Object.keys(topTargets).sort((a, b) => topTargets[b] - topTargets[a]).slice(0, 10),
    };
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(): number {
    const totalThreats = this.threats.size;
    const blockedThreats = Array.from(this.threats.values()).filter(t => t.blocked).length;
    const activePolicies = Array.from(this.policies.values()).filter(p => p.enabled).length;
    
    if (totalThreats === 0) return 100;
    
    const blockRate = blockedThreats / totalThreats;
    const policyScore = Math.min(100, activePolicies * 10);
    const threatScore = Math.max(0, 100 - (totalThreats * 2));
    
    return Math.round((blockRate * 40) + (policyScore * 0.3) + (threatScore * 0.3));
  }

  /**
   * Initialize security policies
   */
  private initializeSecurityPolicies(): void {
    const policies = [
      {
        id: 'sql_injection_policy',
        name: 'SQL Injection Protection',
        type: 'data_protection' as const,
        rules: [
          {
            id: 'block_sql_injection',
            condition: 'threat_type == "sql_injection"',
            action: 'block' as const,
            parameters: {},
            enabled: true,
          },
        ],
        enabled: true,
        priority: 10,
        lastUpdated: new Date(),
      },
      {
        id: 'xss_protection_policy',
        name: 'XSS Protection',
        type: 'data_protection' as const,
        rules: [
          {
            id: 'block_xss',
            condition: 'threat_type == "xss"',
            action: 'block' as const,
            parameters: {},
            enabled: true,
          },
        ],
        enabled: true,
        priority: 9,
        lastUpdated: new Date(),
      },
      {
        id: 'brute_force_protection_policy',
        name: 'Brute Force Protection',
        type: 'access_control' as const,
        rules: [
          {
            id: 'block_brute_force',
            condition: 'threat_type == "brute_force"',
            action: 'block' as const,
            parameters: {},
            enabled: true,
          },
        ],
        enabled: true,
        priority: 8,
        lastUpdated: new Date(),
      },
    ];
    
    policies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Initialize encryption keys
   */
  private initializeEncryptionKeys(): void {
    const defaultKey: EncryptionKey = {
      id: 'default',
      name: 'Default Encryption Key',
      algorithm: 'aes-256-gcm',
      key: crypto.randomBytes(32),
      iv: crypto.randomBytes(16),
      created: new Date(),
      active: true,
    };
    
    this.encryptionKeys.set('default', defaultKey);
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clean up old threats
    for (const [key, threat] of this.threats.entries()) {
      if (threat.timestamp < cutoffTime) {
        this.threats.delete(key);
      }
    }
    
    // Clean up old audits
    for (const [key, audit] of this.audits.entries()) {
      if (audit.timestamp < cutoffTime) {
        this.audits.delete(key);
      }
    }
    
    // Clean up old rate limits
    const now = Date.now();
    for (const [key, rateLimit] of this.rateLimits.entries()) {
      if (now > rateLimit.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  /**
   * Initialize security metrics
   */
  private initializeSecurityMetrics(): SecurityMetrics {
    return {
      totalThreats: 0,
      blockedThreats: 0,
      activePolicies: 0,
      securityScore: 100,
      lastAudit: new Date(),
      threatTypes: {},
      topSources: [],
      topTargets: [],
    };
  }
}

export const advancedSecuritySystem = new AdvancedSecuritySystem();
