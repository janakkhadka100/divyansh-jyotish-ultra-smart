import { analyticsService } from '@/server/services/analytics';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'cpu' | 'memory' | 'network' | 'database' | 'ai' | 'user' | 'system';
  timestamp: Date;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
  trend: 'increasing' | 'decreasing' | 'stable';
  metadata: any;
}

interface PerformanceAlert {
  id: string;
  metricId: string;
  type: 'warning' | 'critical' | 'recovery';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: any;
}

interface PerformanceReport {
  id: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startTime: Date;
  endTime: Date;
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  summary: {
    totalMetrics: number;
    averagePerformance: number;
    criticalAlerts: number;
    warningAlerts: number;
    uptime: number;
    performanceScore: number;
  };
  recommendations: string[];
  generatedAt: Date;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    cpu: 'healthy' | 'warning' | 'critical';
    memory: 'healthy' | 'warning' | 'critical';
    network: 'healthy' | 'warning' | 'critical';
    database: 'healthy' | 'warning' | 'critical';
    ai: 'healthy' | 'warning' | 'critical';
    user: 'healthy' | 'warning' | 'critical';
  };
  score: number;
  lastUpdated: Date;
  issues: string[];
  recommendations: string[];
}

interface PerformanceConfig {
  monitoringInterval: number;
  alertThresholds: {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    network: { warning: number; critical: number };
    database: { warning: number; critical: number };
    ai: { warning: number; critical: number };
    user: { warning: number; critical: number };
  };
  retentionPeriod: number;
  enableRealTime: boolean;
  enablePredictive: boolean;
  enableAutoOptimization: boolean;
}

class AdvancedPerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric>;
  private alerts: Map<string, PerformanceAlert>;
  private reports: Map<string, PerformanceReport>;
  private config: PerformanceConfig;
  private monitoringInterval: NodeJS.Timeout | null;
  private healthCheckInterval: NodeJS.Timeout | null;
  private alertHandlers: Map<string, (alert: PerformanceAlert) => void>;
  private performanceHistory: Map<string, PerformanceMetric[]>;
  private systemHealth: SystemHealth;
  private predictiveModels: Map<string, any>;

  constructor(config?: Partial<PerformanceConfig>) {
    this.metrics = new Map();
    this.alerts = new Map();
    this.reports = new Map();
    this.config = {
      monitoringInterval: 5000, // 5 seconds
      alertThresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        network: { warning: 1000, critical: 2000 }, // latency in ms
        database: { warning: 500, critical: 1000 }, // query time in ms
        ai: { warning: 2000, critical: 5000 }, // response time in ms
        user: { warning: 1000, critical: 3000 }, // page load time in ms
      },
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      enableRealTime: true,
      enablePredictive: true,
      enableAutoOptimization: true,
      ...config,
    };
    
    this.monitoringInterval = null;
    this.healthCheckInterval = null;
    this.alertHandlers = new Map();
    this.performanceHistory = new Map();
    this.predictiveModels = new Map();
    
    this.systemHealth = {
      overall: 'healthy',
      components: {
        cpu: 'healthy',
        memory: 'healthy',
        network: 'healthy',
        database: 'healthy',
        ai: 'healthy',
        user: 'healthy',
      },
      score: 100,
      lastUpdated: new Date(),
      issues: [],
      recommendations: [],
    };
    
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    this.startMetricCollection();
    this.startHealthMonitoring();
    this.initializePredictiveModels();
  }

  /**
   * Start metric collection
   */
  private startMetricCollection(): void {
    if (this.config.enableRealTime) {
      this.monitoringInterval = setInterval(() => {
        this.collectSystemMetrics();
        this.collectApplicationMetrics();
        this.collectAIMetrics();
        this.collectUserMetrics();
        this.updateSystemHealth();
        this.checkAlerts();
        this.cleanupOldData();
      }, this.config.monitoringInterval);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000); // Every 10 seconds
  }

  /**
   * Initialize predictive models
   */
  private initializePredictiveModels(): void {
    if (this.config.enablePredictive) {
      // Initialize simple predictive models for each metric category
      const categories = ['cpu', 'memory', 'network', 'database', 'ai', 'user'];
      categories.forEach(category => {
        this.predictiveModels.set(category, {
          type: 'linear_regression',
          coefficients: [0, 0, 0], // [intercept, slope, trend]
          accuracy: 0.8,
          lastTrained: new Date(),
        });
      });
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // CPU metrics
    this.recordMetric({
      name: 'cpu_usage',
      value: this.calculateCPUUsage(cpuUsage),
      unit: 'percent',
      category: 'cpu',
      threshold: this.config.alertThresholds.cpu,
    });
    
    // Memory metrics
    this.recordMetric({
      name: 'memory_usage',
      value: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      unit: 'percent',
      category: 'memory',
      threshold: this.config.alertThresholds.memory,
    });
    
    this.recordMetric({
      name: 'memory_heap_used',
      value: memUsage.heapUsed,
      unit: 'bytes',
      category: 'memory',
      threshold: { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 }, // 100MB, 200MB
    });
    
    this.recordMetric({
      name: 'memory_rss',
      value: memUsage.rss,
      unit: 'bytes',
      category: 'memory',
      threshold: { warning: 200 * 1024 * 1024, critical: 500 * 1024 * 1024 }, // 200MB, 500MB
    });
  }

  /**
   * Collect application metrics
   */
  private collectApplicationMetrics(): void {
    // Request metrics
    this.recordMetric({
      name: 'request_count',
      value: this.getRequestCount(),
      unit: 'count',
      category: 'system',
      threshold: { warning: 1000, critical: 2000 },
    });
    
    // Response time metrics
    this.recordMetric({
      name: 'average_response_time',
      value: this.getAverageResponseTime(),
      unit: 'milliseconds',
      category: 'system',
      threshold: { warning: 500, critical: 1000 },
    });
    
    // Error rate metrics
    this.recordMetric({
      name: 'error_rate',
      value: this.getErrorRate(),
      unit: 'percent',
      category: 'system',
      threshold: { warning: 5, critical: 10 },
    });
  }

  /**
   * Collect AI metrics
   */
  private collectAIMetrics(): void {
    // AI response time
    this.recordMetric({
      name: 'ai_response_time',
      value: this.getAIResponseTime(),
      unit: 'milliseconds',
      category: 'ai',
      threshold: this.config.alertThresholds.ai,
    });
    
    // AI accuracy
    this.recordMetric({
      name: 'ai_accuracy',
      value: this.getAIAccuracy(),
      unit: 'percent',
      category: 'ai',
      threshold: { warning: 80, critical: 70 },
    });
    
    // AI cache hit rate
    this.recordMetric({
      name: 'ai_cache_hit_rate',
      value: this.getAICacheHitRate(),
      unit: 'percent',
      category: 'ai',
      threshold: { warning: 50, critical: 30 },
    });
  }

  /**
   * Collect user metrics
   */
  private collectUserMetrics(): void {
    // User session count
    this.recordMetric({
      name: 'active_sessions',
      value: this.getActiveSessionCount(),
      unit: 'count',
      category: 'user',
      threshold: { warning: 100, critical: 200 },
    });
    
    // User satisfaction
    this.recordMetric({
      name: 'user_satisfaction',
      value: this.getUserSatisfaction(),
      unit: 'percent',
      category: 'user',
      threshold: { warning: 70, critical: 50 },
    });
    
    // Page load time
    this.recordMetric({
      name: 'page_load_time',
      value: this.getPageLoadTime(),
      unit: 'milliseconds',
      category: 'user',
      threshold: this.config.alertThresholds.user,
    });
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metricData: Omit<PerformanceMetric, 'id' | 'timestamp' | 'status' | 'trend' | 'metadata'>): void {
    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: this.determineMetricStatus(metricData.value, metricData.threshold),
      trend: this.calculateTrend(metricData.name, metricData.value),
      metadata: {},
      ...metricData,
    };
    
    this.metrics.set(metric.id, metric);
    
    // Store in history
    if (!this.performanceHistory.has(metric.name)) {
      this.performanceHistory.set(metric.name, []);
    }
    
    const history = this.performanceHistory.get(metric.name)!;
    history.push(metric);
    
    // Keep only last 1000 entries per metric
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    // Track analytics
    analyticsService.trackEvent({
      type: 'performance',
      category: 'metric_collection',
      action: 'metric_recorded',
      metadata: {
        metricName: metric.name,
        value: metric.value,
        category: metric.category,
        status: metric.status,
      },
      success: true,
      duration: 0,
    });
  }

  /**
   * Determine metric status based on thresholds
   */
  private determineMetricStatus(value: number, threshold: { warning: number; critical: number }): 'normal' | 'warning' | 'critical' {
    if (value >= threshold.critical) {
      return 'critical';
    } else if (value >= threshold.warning) {
      return 'warning';
    }
    return 'normal';
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(metricName: string, currentValue: number): 'increasing' | 'decreasing' | 'stable' {
    const history = this.performanceHistory.get(metricName);
    if (!history || history.length < 2) {
      return 'stable';
    }
    
    const recentValues = history.slice(-5).map(m => m.value);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    const change = ((currentValue - average) / average) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Update system health
   */
  private updateSystemHealth(): void {
    const components = ['cpu', 'memory', 'network', 'database', 'ai', 'user'];
    let totalScore = 0;
    let criticalCount = 0;
    let warningCount = 0;
    
    components.forEach(component => {
      const componentMetrics = Array.from(this.metrics.values())
        .filter(m => m.category === component && m.timestamp > new Date(Date.now() - 60000)); // Last minute
      
      if (componentMetrics.length === 0) {
        this.systemHealth.components[component as keyof typeof this.systemHealth.components] = 'healthy';
        totalScore += 100;
        return;
      }
      
      const criticalMetrics = componentMetrics.filter(m => m.status === 'critical');
      const warningMetrics = componentMetrics.filter(m => m.status === 'warning');
      
      if (criticalMetrics.length > 0) {
        this.systemHealth.components[component as keyof typeof this.systemHealth.components] = 'critical';
        criticalCount++;
        totalScore += 0;
      } else if (warningMetrics.length > 0) {
        this.systemHealth.components[component as keyof typeof this.systemHealth.components] = 'warning';
        warningCount++;
        totalScore += 50;
      } else {
        this.systemHealth.components[component as keyof typeof this.systemHealth.components] = 'healthy';
        totalScore += 100;
      }
    });
    
    this.systemHealth.score = totalScore / components.length;
    this.systemHealth.lastUpdated = new Date();
    
    if (criticalCount > 0) {
      this.systemHealth.overall = 'critical';
    } else if (warningCount > 0) {
      this.systemHealth.overall = 'warning';
    } else {
      this.systemHealth.overall = 'healthy';
    }
    
    // Generate recommendations
    this.generateRecommendations();
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): void {
    const recommendations: string[] = [];
    
    if (this.systemHealth.components.cpu === 'critical') {
      recommendations.push('CPU usage is critical - consider scaling up or optimizing CPU-intensive operations');
    }
    
    if (this.systemHealth.components.memory === 'critical') {
      recommendations.push('Memory usage is critical - consider increasing memory or optimizing memory usage');
    }
    
    if (this.systemHealth.components.network === 'critical') {
      recommendations.push('Network latency is critical - consider CDN or network optimization');
    }
    
    if (this.systemHealth.components.database === 'critical') {
      recommendations.push('Database performance is critical - consider query optimization or scaling');
    }
    
    if (this.systemHealth.components.ai === 'critical') {
      recommendations.push('AI performance is critical - consider model optimization or caching');
    }
    
    if (this.systemHealth.components.user === 'critical') {
      recommendations.push('User experience is critical - consider frontend optimization or CDN');
    }
    
    this.systemHealth.recommendations = recommendations;
  }

  /**
   * Check for alerts
   */
  private checkAlerts(): void {
    const recentMetrics = Array.from(this.metrics.values())
      .filter(m => m.timestamp > new Date(Date.now() - 60000)); // Last minute
    
    recentMetrics.forEach(metric => {
      if (metric.status === 'warning' || metric.status === 'critical') {
        this.createAlert(metric);
      }
    });
  }

  /**
   * Create performance alert
   */
  private createAlert(metric: PerformanceMetric): void {
    const alertId = `alert_${metric.id}`;
    
    // Check if alert already exists
    if (this.alerts.has(alertId)) {
      return;
    }
    
    const alert: PerformanceAlert = {
      id: alertId,
      metricId: metric.id,
      type: metric.status as 'warning' | 'critical',
      message: `${metric.name} is ${metric.status}: ${metric.value}${metric.unit}`,
      value: metric.value,
      threshold: metric.status === 'critical' ? metric.threshold.critical : metric.threshold.warning,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      metadata: {
        category: metric.category,
        trend: metric.trend,
      },
    };
    
    this.alerts.set(alertId, alert);
    
    // Notify alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    });
    
    // Track analytics
    analyticsService.trackEvent({
      type: 'alert',
      category: 'performance',
      action: 'alert_created',
      metadata: {
        alertId: alert.id,
        metricName: metric.name,
        alertType: alert.type,
        value: alert.value,
        threshold: alert.threshold,
      },
      success: true,
      duration: 0,
    });
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const healthCheck = {
      timestamp: new Date(),
      overall: this.systemHealth.overall,
      score: this.systemHealth.score,
      components: this.systemHealth.components,
      issues: this.systemHealth.issues,
      recommendations: this.systemHealth.recommendations,
    };
    
    // Store health check result
    this.systemHealth.lastUpdated = new Date();
    
    // Track analytics
    analyticsService.trackEvent({
      type: 'health',
      category: 'system',
      action: 'health_check',
      metadata: healthCheck,
      success: true,
      duration: 0,
    });
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(category?: string, limit: number = 100): PerformanceMetric[] {
    let metrics = Array.from(this.metrics.values());
    
    if (category) {
      metrics = metrics.filter(m => m.category === category);
    }
    
    return metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(limit: number = 50): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): PerformanceReport {
    const now = new Date();
    const startTime = this.getReportStartTime(now, period);
    
    const reportMetrics = Array.from(this.metrics.values())
      .filter(m => m.timestamp >= startTime && m.timestamp <= now);
    
    const reportAlerts = Array.from(this.alerts.values())
      .filter(a => a.timestamp >= startTime && a.timestamp <= now);
    
    const criticalAlerts = reportAlerts.filter(a => a.type === 'critical').length;
    const warningAlerts = reportAlerts.filter(a => a.type === 'warning').length;
    
    const averagePerformance = reportMetrics.length > 0 ? 
      reportMetrics.reduce((sum, m) => sum + m.value, 0) / reportMetrics.length : 0;
    
    const uptime = this.calculateUptime(startTime, now);
    const performanceScore = this.calculatePerformanceScore(reportMetrics);
    
    const report: PerformanceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      period,
      startTime,
      endTime: now,
      metrics: reportMetrics,
      alerts: reportAlerts,
      summary: {
        totalMetrics: reportMetrics.length,
        averagePerformance,
        criticalAlerts,
        warningAlerts,
        uptime,
        performanceScore,
      },
      recommendations: this.systemHealth.recommendations,
      generatedAt: new Date(),
    };
    
    this.reports.set(report.id, report);
    
    return report;
  }

  /**
   * Get report start time based on period
   */
  private getReportStartTime(now: Date, period: string): Date {
    const startTime = new Date(now);
    
    switch (period) {
      case 'hourly':
        startTime.setHours(now.getHours() - 1);
        break;
      case 'daily':
        startTime.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startTime.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startTime.setMonth(now.getMonth() - 1);
        break;
    }
    
    return startTime;
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(startTime: Date, endTime: Date): number {
    const totalTime = endTime.getTime() - startTime.getTime();
    const criticalTime = Array.from(this.alerts.values())
      .filter(a => a.type === 'critical' && a.timestamp >= startTime && a.timestamp <= endTime)
      .reduce((sum, a) => sum + (a.resolvedAt ? a.resolvedAt.getTime() - a.timestamp.getTime() : 0), 0);
    
    return Math.max(0, ((totalTime - criticalTime) / totalTime) * 100);
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 100;
    
    const normalMetrics = metrics.filter(m => m.status === 'normal').length;
    const warningMetrics = metrics.filter(m => m.status === 'warning').length;
    const criticalMetrics = metrics.filter(m => m.status === 'critical').length;
    
    const totalMetrics = metrics.length;
    const score = ((normalMetrics * 100) + (warningMetrics * 50) + (criticalMetrics * 0)) / totalMetrics;
    
    return Math.round(score);
  }

  /**
   * Register alert handler
   */
  registerAlertHandler(name: string, handler: (alert: PerformanceAlert) => void): void {
    this.alertHandlers.set(name, handler);
  }

  /**
   * Unregister alert handler
   */
  unregisterAlertHandler(name: string): void {
    this.alertHandlers.delete(name);
  }

  /**
   * Get predictive insights
   */
  getPredictiveInsights(): any {
    if (!this.config.enablePredictive) {
      return { enabled: false };
    }
    
    const insights: any = {};
    
    this.predictiveModels.forEach((model, category) => {
      const history = this.performanceHistory.get(category);
      if (history && history.length > 10) {
        const recentValues = history.slice(-10).map(m => m.value);
        const predictedValue = this.predictValue(model, recentValues);
        
        insights[category] = {
          current: recentValues[recentValues.length - 1],
          predicted: predictedValue,
          trend: predictedValue > recentValues[recentValues.length - 1] ? 'increasing' : 'decreasing',
          confidence: model.accuracy,
        };
      }
    });
    
    return insights;
  }

  /**
   * Predict value using simple linear regression
   */
  private predictValue(model: any, values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return intercept + slope * n;
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);
    
    // Cleanup old metrics
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoffTime) {
        this.metrics.delete(id);
      }
    }
    
    // Cleanup old alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffTime) {
        this.alerts.delete(id);
      }
    }
    
    // Cleanup old reports
    for (const [id, report] of this.reports.entries()) {
      if (report.generatedAt < cutoffTime) {
        this.reports.delete(id);
      }
    }
  }

  /**
   * Mock methods for getting actual values
   */
  private calculateCPUUsage(cpuUsage: NodeJS.CpuUsage): number {
    // Mock CPU usage calculation
    return Math.random() * 100;
  }

  private getRequestCount(): number {
    // Mock request count
    return Math.floor(Math.random() * 1000);
  }

  private getAverageResponseTime(): number {
    // Mock average response time
    return Math.random() * 1000;
  }

  private getErrorRate(): number {
    // Mock error rate
    return Math.random() * 10;
  }

  private getAIResponseTime(): number {
    // Mock AI response time
    return Math.random() * 3000;
  }

  private getAIAccuracy(): number {
    // Mock AI accuracy
    return 80 + Math.random() * 20;
  }

  private getAICacheHitRate(): number {
    // Mock AI cache hit rate
    return Math.random() * 100;
  }

  private getActiveSessionCount(): number {
    // Mock active session count
    return Math.floor(Math.random() * 200);
  }

  private getUserSatisfaction(): number {
    // Mock user satisfaction
    return 70 + Math.random() * 30;
  }

  private getPageLoadTime(): number {
    // Mock page load time
    return Math.random() * 2000;
  }

  /**
   * Cleanup and stop monitoring
   */
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.metrics.clear();
    this.alerts.clear();
    this.reports.clear();
    this.performanceHistory.clear();
    this.alertHandlers.clear();
    this.predictiveModels.clear();
  }
}

export const advancedPerformanceMonitoringService = new AdvancedPerformanceMonitoringService();


