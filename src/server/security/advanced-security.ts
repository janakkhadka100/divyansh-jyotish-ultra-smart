import { analyticsService } from '@/server/services/analytics';

interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'sql_injection' | 'xss' | 'csrf' | 'ddos' | 'malware' | 'phishing' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  timestamp: Date;
  description: string;
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
  metadata: any;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'api_call' | 'file_upload' | 'data_access' | 'system_change';
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  metadata: any;
}

interface SecurityPolicy {
  id: string;
  name: string;
  type: 'access_control' | 'rate_limiting' | 'data_encryption' | 'audit_logging';
  rules: any;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class AdvancedSecurityService {
  private threats: Map<string, SecurityThreat>;
  private events: Map<string, SecurityEvent>;
  private policies: Map<string, SecurityPolicy>;
  private blockedIPs: Set<string>;
  private suspiciousUsers: Set<string>;

  constructor() {
    this.threats = new Map();
    this.events = new Map();
    this.policies = new Map();
    this.blockedIPs = new Set();
    this.suspiciousUsers = new Set();
    
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: 'rate_limiting_policy',
        name: 'Rate Limiting Policy',
        type: 'rate_limiting',
        rules: {
          maxRequestsPerMinute: 60,
          maxRequestsPerHour: 1000,
          maxLoginAttempts: 5,
          lockoutDuration: 15 * 60 * 1000, // 15 minutes
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'access_control_policy',
        name: 'Access Control Policy',
        type: 'access_control',
        rules: {
          requireAuthentication: true,
          requireAuthorization: true,
          allowedOrigins: ['*'],
          blockedCountries: [],
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'data_encryption_policy',
        name: 'Data Encryption Policy',
        type: 'data_encryption',
        rules: {
          encryptSensitiveData: true,
          encryptionAlgorithm: 'AES-256',
          keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'audit_logging_policy',
        name: 'Audit Logging Policy',
        type: 'audit_logging',
        rules: {
          logAllEvents: true,
          logSensitiveData: false,
          retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      this.events.set(securityEvent.id, securityEvent);

      await this.analyzeSecurityEvent(securityEvent);

      await analyticsService.trackEvent({
        type: 'security_event',
        category: 'security',
        action: event.type,
        userId: event.userId,
        metadata: {
          ip: event.ip,
          userAgent: event.userAgent,
          success: event.success,
          ...event.metadata,
        },
        success: event.success,
        duration: 0,
      });

    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }

  private async analyzeSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.detectThreats(event);
    await this.applySecurityPolicies(event);
  }

  private async detectThreats(event: SecurityEvent): Promise<void> {
    const threats = this.analyzeEventForThreats(event);
    
    for (const threat of threats) {
      const securityThreat: SecurityThreat = {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: threat.type,
        severity: threat.severity,
        source: event.ip,
        target: event.target || 'unknown',
        timestamp: new Date(),
        description: threat.description,
        status: 'detected',
        metadata: threat.metadata,
      };
      
      this.threats.set(securityThreat.id, securityThreat);
      
      await this.mitigateThreat(securityThreat);
    }
  }

  private analyzeEventForThreats(event: SecurityEvent): Array<{
    type: SecurityThreat['type'];
    severity: SecurityThreat['severity'];
    description: string;
    metadata: any;
  }> {
    const threats: Array<{
      type: SecurityThreat['type'];
      severity: SecurityThreat['severity'];
      description: string;
      metadata: any;
    }> = [];
    
    if (event.type === 'login_attempt' && !event.success) {
      const failedAttempts = Array.from(this.events.values())
        .filter(e => e.type === 'login_attempt' && e.ip === event.ip && !e.success)
        .length;
      
      if (failedAttempts >= 5) {
        threats.push({
          type: 'brute_force',
          severity: 'high',
          description: `Brute force attack detected from IP ${event.ip}`,
          metadata: { failedAttempts, ip: event.ip },
        });
      }
    }
    
    if (event.type === 'api_call' && event.metadata?.query) {
      const query = event.metadata.query.toLowerCase();
      if (query.includes('drop table') || query.includes('delete from') || query.includes('union select')) {
        threats.push({
          type: 'sql_injection',
          severity: 'critical',
          description: `SQL injection attempt detected from IP ${event.ip}`,
          metadata: { query: event.metadata.query, ip: event.ip },
        });
      }
    }
    
    if (event.type === 'file_upload' && event.metadata?.filename) {
      const filename = event.metadata.filename.toLowerCase();
      if (filename.endsWith('.exe') || filename.endsWith('.bat') || filename.endsWith('.cmd')) {
        threats.push({
          type: 'malware',
          severity: 'high',
          description: `Potential malware upload detected from IP ${event.ip}`,
          metadata: { filename: event.metadata.filename, ip: event.ip },
        });
      }
    }
    
    return threats;
  }

  private async mitigateThreat(threat: SecurityThreat): Promise<void> {
    switch (threat.type) {
      case 'brute_force':
        this.blockedIPs.add(threat.source);
        threat.status = 'mitigated';
        break;
      case 'sql_injection':
        this.blockedIPs.add(threat.source);
        threat.status = 'mitigated';
        break;
      case 'malware':
        this.blockedIPs.add(threat.source);
        threat.status = 'mitigated';
        break;
      default:
        threat.status = 'investigating';
    }
    
    await analyticsService.trackEvent({
      type: 'security_threat',
      category: 'security',
      action: 'threat_mitigated',
      metadata: {
        threatId: threat.id,
        type: threat.type,
        severity: threat.severity,
        source: threat.source,
        status: threat.status,
      },
      success: threat.status === 'mitigated',
      duration: 0,
    });
  }

  private async applySecurityPolicies(event: SecurityEvent): Promise<void> {
    const policies = Array.from(this.policies.values()).filter(p => p.enabled);
    
    for (const policy of policies) {
      switch (policy.type) {
        case 'rate_limiting':
          await this.applyRateLimitingPolicy(event, policy);
          break;
        case 'access_control':
          await this.applyAccessControlPolicy(event, policy);
          break;
        case 'data_encryption':
          await this.applyDataEncryptionPolicy(event, policy);
          break;
        case 'audit_logging':
          await this.applyAuditLoggingPolicy(event, policy);
          break;
      }
    }
  }

  private async applyRateLimitingPolicy(event: SecurityEvent, policy: SecurityPolicy): Promise<void> {
    const rules = policy.rules;
    const recentEvents = Array.from(this.events.values())
      .filter(e => e.ip === event.ip && (Date.now() - e.timestamp.getTime()) < 60000); // Last minute
    
    if (recentEvents.length > rules.maxRequestsPerMinute) {
      this.blockedIPs.add(event.ip);
      await this.logSecurityEvent({
        type: 'rate_limit_exceeded',
        ip: event.ip,
        userAgent: event.userAgent,
        success: false,
        metadata: { policy: policy.name, limit: rules.maxRequestsPerMinute },
      });
    }
  }

  private async applyAccessControlPolicy(event: SecurityEvent, policy: SecurityPolicy): Promise<void> {
    const rules = policy.rules;
    
    if (rules.requireAuthentication && !event.userId) {
      await this.logSecurityEvent({
        type: 'unauthorized_access',
        ip: event.ip,
        userAgent: event.userAgent,
        success: false,
        metadata: { policy: policy.name, reason: 'authentication_required' },
      });
    }
  }

  private async applyDataEncryptionPolicy(event: SecurityEvent, policy: SecurityPolicy): Promise<void> {
    // Data encryption is typically applied at the data layer
    // This is a placeholder for policy enforcement
    console.log('Applying data encryption policy:', policy.name);
  }

  private async applyAuditLoggingPolicy(event: SecurityEvent, policy: SecurityPolicy): Promise<void> {
    // Audit logging is handled by the logSecurityEvent method
    // This is a placeholder for policy enforcement
    console.log('Applying audit logging policy:', policy.name);
  }

  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    const securityPolicy: SecurityPolicy = {
      ...policy,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.policies.set(securityPolicy.id, securityPolicy);
    
    return securityPolicy;
  }

  async updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy | null> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return null;
    }
    
    const updatedPolicy = {
      ...policy,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.policies.set(policyId, updatedPolicy);
    
    return updatedPolicy;
  }

  getSecurityStatistics(): any {
    const threats = Array.from(this.threats.values());
    const events = Array.from(this.events.values());
    const policies = Array.from(this.policies.values());
    
    const threatCounts = threats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const severityCounts = threats.reduce((acc, threat) => {
      acc[threat.severity] = (acc[threat.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalThreats: threats.length,
      totalEvents: events.length,
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.enabled).length,
      blockedIPs: this.blockedIPs.size,
      suspiciousUsers: this.suspiciousUsers.size,
      threatCounts,
      severityCounts,
      recentThreats: threats.slice(-10),
      recentEvents: events.slice(-20),
    };
  }

  getThreats(limit: number = 50): SecurityThreat[] {
    return Array.from(this.threats.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getEvents(limit: number = 100): SecurityEvent[] {
    return Array.from(this.events.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  isUserSuspicious(userId: string): boolean {
    return this.suspiciousUsers.has(userId);
  }

  cleanup(): void {
    this.threats.clear();
    this.events.clear();
    this.policies.clear();
    this.blockedIPs.clear();
    this.suspiciousUsers.clear();
  }
}

export const advancedSecurityService = new AdvancedSecurityService();