import { z } from 'zod';
import { analyticsService } from './analytics';
import { performanceOptimizationService } from './performance-optimization';
import { advancedSecurityService } from './advanced-security';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'regex';
  threshold: number | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // milliseconds
  lastTriggered?: Date;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    type: 'email' | 'sms' | 'webhook' | 'slack' | 'discord';
    config: Record<string, any>;
  }>;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  metric: string;
  value: number | string;
  threshold: number | string;
  timestamp: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata: Record<string, any>;
}

export interface MonitoringConfig {
  enableAlerts: boolean;
  enableHealthChecks: boolean;
  enablePerformanceMonitoring: boolean;
  enableSecurityMonitoring: boolean;
  enableUptimeMonitoring: boolean;
  checkInterval: number; // milliseconds
  alertCooldown: number; // milliseconds
  maxAlertsPerHour: number;
  enableEscalation: boolean;
  escalationDelay: number; // milliseconds
}

export interface HealthCheck {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'database' | 'redis' | 'api';
  url?: string;
  host?: string;
  port?: number;
  timeout: number;
  interval: number;
  enabled: boolean;
  lastCheck?: Date;
  lastStatus?: 'healthy' | 'unhealthy' | 'unknown';
  lastResponseTime?: number;
  consecutiveFailures: number;
  maxFailures: number;
}

export interface UptimeReport {
  service: string;
  uptime: number; // percentage
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  lastIncident?: Date;
  incidents: Array<{
    start: Date;
    end: Date;
    duration: number;
    reason: string;
  }>;
}

const AlertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  metric: z.string(),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'contains', 'regex']),
  threshold: z.union([z.number(), z.string()]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  enabled: z.boolean(),
  cooldown: z.number(),
  lastTriggered: z.date().optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })),
  actions: z.array(z.object({
    type: z.enum(['email', 'sms', 'webhook', 'slack', 'discord']),
    config: z.record(z.any()),
  })),
});

const AlertSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'acknowledged', 'resolved', 'suppressed']),
  metric: z.string(),
  value: z.union([z.number(), z.string()]),
  threshold: z.union([z.number(), z.string()]),
  timestamp: z.date(),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  metadata: z.record(z.any()),
});

class MonitoringAlertsService {
  private config: MonitoringConfig;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableAlerts: config.enableAlerts !== false,
      enableHealthChecks: config.enableHealthChecks !== false,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring !== false,
      enableSecurityMonitoring: config.enableSecurityMonitoring !== false,
      enableUptimeMonitoring: config.enableUptimeMonitoring !== false,
      checkInterval: config.checkInterval || 30000, // 30 seconds
      alertCooldown: config.alertCooldown || 300000, // 5 minutes
      maxAlertsPerHour: config.maxAlertsPerHour || 100,
      enableEscalation: config.enableEscalation !== false,
      escalationDelay: config.escalationDelay || 1800000, // 30 minutes
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize default alert rules
      this.initializeDefaultAlertRules();

      // Initialize health checks
      this.initializeHealthChecks();

      // Start monitoring
      this.startMonitoring();

      this.isInitialized = true;
      console.log('Monitoring & Alerts Service initialized');

    } catch (error) {
      console.error('Error initializing monitoring service:', error);
    }
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = crypto.randomUUID();
    const alertRule: AlertRule = {
      ...rule,
      id,
    };

    // Validate rule
    AlertRuleSchema.parse(alertRule);

    this.alertRules.set(id, alertRule);
    return id;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(id: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(id);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates };
    AlertRuleSchema.parse(updatedRule);

    this.alertRules.set(id, updatedRule);
    return true;
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(id: string): boolean {
    return this.alertRules.delete(id);
  }

  /**
   * Get alert rule
   */
  getAlertRule(id: string): AlertRule | undefined {
    return this.alertRules.get(id);
  }

  /**
   * Get all alert rules
   */
  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Check alert conditions
   */
  async checkAlertConditions(): Promise<void> {
    if (!this.config.enableAlerts) return;

    try {
      for (const rule of this.alertRules.values()) {
        if (!rule.enabled) continue;

        // Check cooldown
        if (rule.lastTriggered && 
            Date.now() - rule.lastTriggered.getTime() < rule.cooldown) {
          continue;
        }

        // Check if rule should trigger
        const shouldTrigger = await this.evaluateAlertRule(rule);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule);
          rule.lastTriggered = new Date();
        }
      }

    } catch (error) {
      console.error('Error checking alert conditions:', error);
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert(rule: AlertRule): Promise<void> {
    try {
      const alert: Alert = {
        id: crypto.randomUUID(),
        ruleId: rule.id,
        title: rule.name,
        description: rule.description,
        severity: rule.severity,
        status: 'active',
        metric: rule.metric,
        value: 0, // This would be the actual metric value
        threshold: rule.threshold,
        timestamp: new Date(),
        metadata: {},
      };

      // Validate alert
      AlertSchema.parse(alert);

      // Store alert
      this.activeAlerts.set(alert.id, alert);

      // Execute alert actions
      await this.executeAlertActions(rule, alert);

      // Track analytics
      await analyticsService.trackEvent({
        type: 'business',
        category: 'monitoring',
        action: 'alert_triggered',
        metadata: {
          ruleId: rule.id,
          severity: rule.severity,
          metric: rule.metric,
        },
        success: true,
      });

    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.activeAlerts.set(alertId, alert);

    // Track analytics
    await analyticsService.trackEvent({
      type: 'user_action',
      category: 'monitoring',
      action: 'alert_acknowledged',
      metadata: { alertId, acknowledgedBy },
      success: true,
    });

    return true;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    this.activeAlerts.set(alertId, alert);

    // Track analytics
    await analyticsService.trackEvent({
      type: 'user_action',
      category: 'monitoring',
      action: 'alert_resolved',
      metadata: { alertId, resolvedBy },
      success: true,
    });

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'active');
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Add health check
   */
  addHealthCheck(check: Omit<HealthCheck, 'id'>): string {
    const id = crypto.randomUUID();
    const healthCheck: HealthCheck = {
      ...check,
      id,
    };

    this.healthChecks.set(id, healthCheck);
    return id;
  }

  /**
   * Run health checks
   */
  async runHealthChecks(): Promise<void> {
    if (!this.config.enableHealthChecks) return;

    try {
      for (const check of this.healthChecks.values()) {
        if (!check.enabled) continue;

        const result = await this.performHealthCheck(check);
        
        // Update health check status
        check.lastCheck = new Date();
        check.lastStatus = result.healthy ? 'healthy' : 'unhealthy';
        check.lastResponseTime = result.responseTime;
        
        if (result.healthy) {
          check.consecutiveFailures = 0;
        } else {
          check.consecutiveFailures++;
        }

        // Trigger alert if too many failures
        if (check.consecutiveFailures >= check.maxFailures) {
          await this.triggerHealthCheckAlert(check);
        }
      }

    } catch (error) {
      console.error('Error running health checks:', error);
    }
  }

  /**
   * Get uptime report
   */
  async getUptimeReport(service: string): Promise<UptimeReport> {
    try {
      const checks = Array.from(this.healthChecks.values())
        .filter(check => check.name.includes(service));

      const totalChecks = checks.length;
      const successfulChecks = checks.filter(check => check.lastStatus === 'healthy').length;
      const failedChecks = totalChecks - successfulChecks;
      const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
      const averageResponseTime = checks.reduce((sum, check) => 
        sum + (check.lastResponseTime || 0), 0) / totalChecks;

      return {
        service,
        uptime,
        totalChecks,
        successfulChecks,
        failedChecks,
        averageResponseTime,
        lastIncident: undefined, // This would be calculated from historical data
        incidents: [], // This would be populated from historical data
      };

    } catch (error) {
      console.error('Error getting uptime report:', error);
      throw error;
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(): Promise<{
    alerts: {
      active: number;
      acknowledged: number;
      resolved: number;
      critical: number;
    };
    health: {
      total: number;
      healthy: number;
      unhealthy: number;
      unknown: number;
    };
    performance: {
      responseTime: number;
      throughput: number;
      errorRate: number;
      cpuUsage: number;
      memoryUsage: number;
    };
    security: {
      totalEvents: number;
      failedLogins: number;
      suspiciousActivities: number;
      rateLimitHits: number;
    };
  }> {
    try {
      const alerts = this.getAllAlerts();
      const healthChecks = Array.from(this.healthChecks.values());
      const performance = await performanceOptimizationService.getPerformanceMetrics();
      const security = await advancedSecurityService.getSecurityMetrics();

      return {
        alerts: {
          active: alerts.filter(a => a.status === 'active').length,
          acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
          resolved: alerts.filter(a => a.status === 'resolved').length,
          critical: alerts.filter(a => a.severity === 'critical').length,
        },
        health: {
          total: healthChecks.length,
          healthy: healthChecks.filter(h => h.lastStatus === 'healthy').length,
          unhealthy: healthChecks.filter(h => h.lastStatus === 'unhealthy').length,
          unknown: healthChecks.filter(h => h.lastStatus === 'unknown').length,
        },
        performance: {
          responseTime: performance.responseTime,
          throughput: performance.throughput,
          errorRate: performance.errorRate,
          cpuUsage: performance.cpuUsage,
          memoryUsage: performance.memoryUsage,
        },
        security: {
          totalEvents: security.securityEvents,
          failedLogins: security.failedLogins,
          suspiciousActivities: security.suspiciousActivities,
          rateLimitHits: security.rateLimitHits,
        },
      };

    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.isInitialized = false;
    console.log('Monitoring & Alerts Service shutdown');
  }

  // Private helper methods
  private initializeDefaultAlertRules(): void {
    // High response time alert
    this.addAlertRule({
      name: 'High Response Time',
      description: 'API response time is above threshold',
      metric: 'response_time',
      operator: 'gt',
      threshold: 5000, // 5 seconds
      severity: 'high',
      enabled: true,
      cooldown: 300000, // 5 minutes
      conditions: [],
      actions: [
        {
          type: 'email',
          config: { to: 'admin@divyansh-jyotish.com' },
        },
      ],
    });

    // High error rate alert
    this.addAlertRule({
      name: 'High Error Rate',
      description: 'Error rate is above threshold',
      metric: 'error_rate',
      operator: 'gt',
      threshold: 10, // 10%
      severity: 'critical',
      enabled: true,
      cooldown: 300000, // 5 minutes
      conditions: [],
      actions: [
        {
          type: 'email',
          config: { to: 'admin@divyansh-jyotish.com' },
        },
        {
          type: 'slack',
          config: { webhook: process.env.SLACK_WEBHOOK_URL },
        },
      ],
    });

    // Low cache hit rate alert
    this.addAlertRule({
      name: 'Low Cache Hit Rate',
      description: 'Cache hit rate is below threshold',
      metric: 'cache_hit_rate',
      operator: 'lt',
      threshold: 70, // 70%
      severity: 'medium',
      enabled: true,
      cooldown: 600000, // 10 minutes
      conditions: [],
      actions: [
        {
          type: 'email',
          config: { to: 'admin@divyansh-jyotish.com' },
        },
      ],
    });
  }

  private initializeHealthChecks(): void {
    // Database health check
    this.addHealthCheck({
      name: 'Database',
      type: 'database',
      timeout: 5000,
      interval: 30000,
      enabled: true,
      consecutiveFailures: 0,
      maxFailures: 3,
    });

    // Redis health check
    this.addHealthCheck({
      name: 'Redis',
      type: 'redis',
      timeout: 5000,
      interval: 30000,
      enabled: true,
      consecutiveFailures: 0,
      maxFailures: 3,
    });

    // API health check
    this.addHealthCheck({
      name: 'API',
      type: 'http',
      url: process.env.NEXT_PUBLIC_APP_URL + '/api/health',
      timeout: 10000,
      interval: 60000,
      enabled: true,
      consecutiveFailures: 0,
      maxFailures: 2,
    });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAlertConditions();
        await this.runHealthChecks();
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
    }, this.config.checkInterval);
  }

  private async evaluateAlertRule(rule: AlertRule): Promise<boolean> {
    try {
      // Get current metric value
      const metricValue = await this.getMetricValue(rule.metric);
      
      // Evaluate condition
      switch (rule.operator) {
        case 'gt':
          return metricValue > rule.threshold;
        case 'lt':
          return metricValue < rule.threshold;
        case 'eq':
          return metricValue === rule.threshold;
        case 'gte':
          return metricValue >= rule.threshold;
        case 'lte':
          return metricValue <= rule.threshold;
        case 'contains':
          return String(metricValue).includes(String(rule.threshold));
        case 'regex':
          return new RegExp(String(rule.threshold)).test(String(metricValue));
        default:
          return false;
      }

    } catch (error) {
      console.error('Error evaluating alert rule:', error);
      return false;
    }
  }

  private async getMetricValue(metric: string): Promise<number | string> {
    try {
      switch (metric) {
        case 'response_time':
          const perf = await performanceOptimizationService.getPerformanceMetrics();
          return perf.responseTime;
        case 'error_rate':
          const analytics = await analyticsService.getMetrics();
          return analytics.errorRate;
        case 'cache_hit_rate':
          const cache = await performanceOptimizationService.getPerformanceMetrics();
          return cache.cacheHitRate;
        case 'cpu_usage':
          const cpu = await performanceOptimizationService.getPerformanceMetrics();
          return cpu.cpuUsage;
        case 'memory_usage':
          const memory = await performanceOptimizationService.getPerformanceMetrics();
          return memory.memoryUsage;
        default:
          return 0;
      }

    } catch (error) {
      console.error('Error getting metric value:', error);
      return 0;
    }
  }

  private async executeAlertActions(rule: AlertRule, alert: Alert): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'email':
            await this.sendEmailAlert(action.config, alert);
            break;
          case 'sms':
            await this.sendSMSAlert(action.config, alert);
            break;
          case 'webhook':
            await this.sendWebhookAlert(action.config, alert);
            break;
          case 'slack':
            await this.sendSlackAlert(action.config, alert);
            break;
          case 'discord':
            await this.sendDiscordAlert(action.config, alert);
            break;
        }
      } catch (error) {
        console.error(`Error executing alert action ${action.type}:`, error);
      }
    }
  }

  private async sendEmailAlert(config: any, alert: Alert): Promise<void> {
    // This would integrate with email service
    console.log('Email alert:', { to: config.to, alert: alert.title });
  }

  private async sendSMSAlert(config: any, alert: Alert): Promise<void> {
    // This would integrate with SMS service
    console.log('SMS alert:', { to: config.to, alert: alert.title });
  }

  private async sendWebhookAlert(config: any, alert: Alert): Promise<void> {
    // This would send webhook notification
    console.log('Webhook alert:', { url: config.url, alert: alert.title });
  }

  private async sendSlackAlert(config: any, alert: Alert): Promise<void> {
    // This would send Slack notification
    console.log('Slack alert:', { webhook: config.webhook, alert: alert.title });
  }

  private async sendDiscordAlert(config: any, alert: Alert): Promise<void> {
    // This would send Discord notification
    console.log('Discord alert:', { webhook: config.webhook, alert: alert.title });
  }

  private async performHealthCheck(check: HealthCheck): Promise<{ healthy: boolean; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      switch (check.type) {
        case 'http':
          if (!check.url) throw new Error('URL not provided');
          const response = await fetch(check.url, { 
            method: 'GET',
            signal: AbortSignal.timeout(check.timeout)
          });
          return { healthy: response.ok, responseTime: Date.now() - startTime };
        
        case 'tcp':
          // This would implement TCP health check
          return { healthy: true, responseTime: Date.now() - startTime };
        
        case 'database':
          // This would implement database health check
          return { healthy: true, responseTime: Date.now() - startTime };
        
        case 'redis':
          // This would implement Redis health check
          return { healthy: true, responseTime: Date.now() - startTime };
        
        case 'api':
          // This would implement API health check
          return { healthy: true, responseTime: Date.now() - startTime };
        
        default:
          return { healthy: false, responseTime: Date.now() - startTime };
      }

    } catch (error) {
      console.error(`Health check failed for ${check.name}:`, error);
      return { healthy: false, responseTime: Date.now() - startTime };
    }
  }

  private async triggerHealthCheckAlert(check: HealthCheck): Promise<void> {
    // This would trigger an alert for health check failures
    console.log(`Health check alert triggered for ${check.name}`);
  }
}

// Export singleton instance
export const monitoringAlertsService = new MonitoringAlertsService();

// Export class for testing
export { MonitoringAlertsService };
