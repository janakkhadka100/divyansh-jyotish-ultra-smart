import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'cpu' | 'memory' | 'network' | 'database' | 'api' | 'user' | 'system';
  timestamp: Date;
  threshold: number;
  status: 'normal' | 'warning' | 'critical' | 'error';
  trend: 'increasing' | 'decreasing' | 'stable';
  metadata: any;
}

interface PerformanceAlert {
  id: string;
  metricId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolutionTime?: Date;
  actions: string[];
}

interface PerformanceReport {
  id: string;
  name: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startTime: Date;
  endTime: Date;
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averagePerformance: number;
    criticalAlerts: number;
    warnings: number;
    recommendations: string[];
  };
  generatedAt: Date;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    cpu: 'healthy' | 'degraded' | 'critical';
    memory: 'healthy' | 'degraded' | 'critical';
    network: 'healthy' | 'degraded' | 'critical';
    database: 'healthy' | 'degraded' | 'critical';
    api: 'healthy' | 'degraded' | 'critical';
  };
  score: number;
  lastUpdated: Date;
  recommendations: string[];
}

interface PerformanceBaseline {
  metricName: string;
  averageValue: number;
  standardDeviation: number;
  percentile95: number;
  percentile99: number;
  sampleSize: number;
  lastUpdated: Date;
}

class AdvancedPerformanceMonitor {
  private metrics: Map<string, PerformanceMetric>;
  private alerts: Map<string, PerformanceAlert>;
  private reports: Map<string, PerformanceReport>;
  private baselines: Map<string, PerformanceBaseline>;
  private systemHealth: SystemHealth;
  private monitoringInterval: NodeJS.Timeout | null;
  private alertThresholds: Map<string, number>;

  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.reports = new Map();
    this.baselines = new Map();
    this.systemHealth = this.initializeSystemHealth();
    this.monitoringInterval = null;
    this.alertThresholds = new Map();
    
    this.initializeAlertThresholds();
    this.initializeBaselines();
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(): Promise<void> {
    try {
      this.monitoringInterval = setInterval(async () => {
        await this.collectMetrics();
        await this.checkAlerts();
        await this.updateSystemHealth();
      }, 5000); // Monitor every 5 seconds
      
      console.log('Advanced performance monitoring started');
    } catch (error) {
      console.error('Failed to start performance monitoring:', error);
    }
  }

  /**
   * Stop performance monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Advanced performance monitoring stopped');
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics(): Promise<void> {
    try {
      // Collect CPU metrics
      await this.collectCPUMetrics();
      
      // Collect memory metrics
      await this.collectMemoryMetrics();
      
      // Collect network metrics
      await this.collectNetworkMetrics();
      
      // Collect database metrics
      await this.collectDatabaseMetrics();
      
      // Collect API metrics
      await this.collectAPIMetrics();
      
      // Collect user metrics
      await this.collectUserMetrics();
      
      // Collect system metrics
      await this.collectSystemMetrics();
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Collect CPU metrics
   */
  private async collectCPUMetrics(): Promise<void> {
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage
    
    const metric: PerformanceMetric = {
      id: `cpu_${Date.now()}`,
      name: 'CPU Usage',
      value: cpuPercent,
      unit: 'percentage',
      category: 'cpu',
      timestamp: new Date(),
      threshold: 80,
      status: cpuPercent > 80 ? 'critical' : cpuPercent > 60 ? 'warning' : 'normal',
      trend: this.calculateTrend('cpu_usage', cpuPercent),
      metadata: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    };
    
    this.metrics.set(metric.id, metric);
  }

  /**
   * Collect memory metrics
   */
  private async collectMemoryMetrics(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    const metric: PerformanceMetric = {
      id: `memory_${Date.now()}`,
      name: 'Memory Usage',
      value: memoryPercent,
      unit: 'percentage',
      category: 'memory',
      timestamp: new Date(),
      threshold: 85,
      status: memoryPercent > 85 ? 'critical' : memoryPercent > 70 ? 'warning' : 'normal',
      trend: this.calculateTrend('memory_usage', memoryPercent),
      metadata: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
    };
    
    this.metrics.set(metric.id, metric);
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics(): Promise<void> {
    // Simulate network metrics collection
    const networkLatency = Math.random() * 100 + 10; // 10-110ms
    const networkThroughput = Math.random() * 1000 + 100; // 100-1100 Mbps
    
    const latencyMetric: PerformanceMetric = {
      id: `network_latency_${Date.now()}`,
      name: 'Network Latency',
      value: networkLatency,
      unit: 'milliseconds',
      category: 'network',
      timestamp: new Date(),
      threshold: 100,
      status: networkLatency > 100 ? 'critical' : networkLatency > 50 ? 'warning' : 'normal',
      trend: this.calculateTrend('network_latency', networkLatency),
      metadata: {},
    };
    
    const throughputMetric: PerformanceMetric = {
      id: `network_throughput_${Date.now()}`,
      name: 'Network Throughput',
      value: networkThroughput,
      unit: 'Mbps',
      category: 'network',
      timestamp: new Date(),
      threshold: 500,
      status: networkThroughput < 500 ? 'warning' : 'normal',
      trend: this.calculateTrend('network_throughput', networkThroughput),
      metadata: {},
    };
    
    this.metrics.set(latencyMetric.id, latencyMetric);
    this.metrics.set(throughputMetric.id, throughputMetric);
  }

  /**
   * Collect database metrics
   */
  private async collectDatabaseMetrics(): Promise<void> {
    try {
      // Simulate database query time
      const queryTime = Math.random() * 100 + 10; // 10-110ms
      
      const metric: PerformanceMetric = {
        id: `db_query_time_${Date.now()}`,
        name: 'Database Query Time',
        value: queryTime,
        unit: 'milliseconds',
        category: 'database',
        timestamp: new Date(),
        threshold: 100,
        status: queryTime > 100 ? 'critical' : queryTime > 50 ? 'warning' : 'normal',
        trend: this.calculateTrend('db_query_time', queryTime),
        metadata: {},
      };
      
      this.metrics.set(metric.id, metric);
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    }
  }

  /**
   * Collect API metrics
   */
  private async collectAPIMetrics(): Promise<void> {
    // Simulate API response time
    const responseTime = Math.random() * 200 + 50; // 50-250ms
    
    const metric: PerformanceMetric = {
      id: `api_response_time_${Date.now()}`,
      name: 'API Response Time',
      value: responseTime,
      unit: 'milliseconds',
      category: 'api',
      timestamp: new Date(),
      threshold: 200,
      status: responseTime > 200 ? 'critical' : responseTime > 100 ? 'warning' : 'normal',
      trend: this.calculateTrend('api_response_time', responseTime),
      metadata: {},
    };
    
    this.metrics.set(metric.id, metric);
  }

  /**
   * Collect user metrics
   */
  private async collectUserMetrics(): Promise<void> {
    try {
      // Get active users count
      const activeUsers = await this.getActiveUsersCount();
      
      const metric: PerformanceMetric = {
        id: `active_users_${Date.now()}`,
        name: 'Active Users',
        value: activeUsers,
        unit: 'count',
        category: 'user',
        timestamp: new Date(),
        threshold: 1000,
        status: activeUsers > 1000 ? 'warning' : 'normal',
        trend: this.calculateTrend('active_users', activeUsers),
        metadata: {},
      };
      
      this.metrics.set(metric.id, metric);
    } catch (error) {
      console.error('Error collecting user metrics:', error);
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    // Simulate system load
    const systemLoad = Math.random() * 4 + 0.1; // 0.1-4.1
    
    const metric: PerformanceMetric = {
      id: `system_load_${Date.now()}`,
      name: 'System Load',
      value: systemLoad,
      unit: 'load',
      category: 'system',
      timestamp: new Date(),
      threshold: 2.0,
      status: systemLoad > 2.0 ? 'critical' : systemLoad > 1.0 ? 'warning' : 'normal',
      trend: this.calculateTrend('system_load', systemLoad),
      metadata: {},
    };
    
    this.metrics.set(metric.id, metric);
  }

  /**
   * Check for performance alerts
   */
  async checkAlerts(): Promise<void> {
    try {
      const recentMetrics = Array.from(this.metrics.values())
        .filter(metric => Date.now() - metric.timestamp.getTime() < 60000); // Last minute
      
      for (const metric of recentMetrics) {
        if (metric.status === 'critical' || metric.status === 'warning') {
          await this.createAlert(metric);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Create performance alert
   */
  private async createAlert(metric: PerformanceMetric): Promise<void> {
    const alertId = `alert_${metric.id}`;
    
    // Check if alert already exists
    if (this.alerts.has(alertId)) {
      return;
    }
    
    const alert: PerformanceAlert = {
      id: alertId,
      metricId: metric.id,
      severity: metric.status === 'critical' ? 'critical' : 'medium',
      message: `${metric.name} is ${metric.status}: ${metric.value}${metric.unit}`,
      threshold: metric.threshold,
      currentValue: metric.value,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      actions: this.generateAlertActions(metric),
    };
    
    this.alerts.set(alert.id, alert);
    
    // Track alert creation
    await analyticsService.trackEvent({
      type: 'performance',
      category: 'performance_monitoring',
      action: 'alert_created',
      metadata: {
        alertId: alert.id,
        metricName: metric.name,
        severity: alert.severity,
        value: metric.value,
        threshold: metric.threshold,
      },
      success: true,
      duration: 0,
    });
  }

  /**
   * Update system health
   */
  async updateSystemHealth(): Promise<void> {
    try {
      const recentMetrics = Array.from(this.metrics.values())
        .filter(metric => Date.now() - metric.timestamp.getTime() < 300000); // Last 5 minutes
      
      const healthScores = {
        cpu: this.calculateComponentHealth(recentMetrics, 'cpu'),
        memory: this.calculateComponentHealth(recentMetrics, 'memory'),
        network: this.calculateComponentHealth(recentMetrics, 'network'),
        database: this.calculateComponentHealth(recentMetrics, 'database'),
        api: this.calculateComponentHealth(recentMetrics, 'api'),
      };
      
      const overallScore = Object.values(healthScores).reduce((sum, score) => sum + score, 0) / Object.keys(healthScores).length;
      
      this.systemHealth = {
        overall: overallScore > 0.8 ? 'healthy' : overallScore > 0.5 ? 'degraded' : 'critical',
        components: {
          cpu: healthScores.cpu > 0.8 ? 'healthy' : healthScores.cpu > 0.5 ? 'degraded' : 'critical',
          memory: healthScores.memory > 0.8 ? 'healthy' : healthScores.memory > 0.5 ? 'degraded' : 'critical',
          network: healthScores.network > 0.8 ? 'healthy' : healthScores.network > 0.5 ? 'degraded' : 'critical',
          database: healthScores.database > 0.8 ? 'healthy' : healthScores.database > 0.5 ? 'degraded' : 'critical',
          api: healthScores.api > 0.8 ? 'healthy' : healthScores.api > 0.5 ? 'degraded' : 'critical',
        },
        score: overallScore,
        lastUpdated: new Date(),
        recommendations: this.generateHealthRecommendations(healthScores),
      };
    } catch (error) {
      console.error('Error updating system health:', error);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startTime: Date,
    endTime: Date
  ): Promise<PerformanceReport> {
    try {
      const reportMetrics = Array.from(this.metrics.values())
        .filter(metric => metric.timestamp >= startTime && metric.timestamp <= endTime);
      
      const criticalAlerts = Array.from(this.alerts.values())
        .filter(alert => alert.severity === 'critical' && alert.timestamp >= startTime && alert.timestamp <= endTime);
      
      const warnings = Array.from(this.alerts.values())
        .filter(alert => alert.severity === 'medium' && alert.timestamp >= startTime && alert.timestamp <= endTime);
      
      const averagePerformance = reportMetrics.length > 0 ? 
        reportMetrics.reduce((sum, metric) => sum + metric.value, 0) / reportMetrics.length : 0;
      
      const report: PerformanceReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${period.charAt(0).toUpperCase() + period.slice(1)} Performance Report`,
        period,
        startTime,
        endTime,
        metrics: reportMetrics,
        summary: {
          totalMetrics: reportMetrics.length,
          averagePerformance,
          criticalAlerts: criticalAlerts.length,
          warnings: warnings.length,
          recommendations: this.generateReportRecommendations(reportMetrics),
        },
        generatedAt: new Date(),
      };
      
      this.reports.set(report.id, report);
      
      return report;
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    category?: string,
    limit: number = 100
  ): Promise<PerformanceMetric[]> {
    try {
      let metrics = Array.from(this.metrics.values());
      
      if (category) {
        metrics = metrics.filter(metric => metric.category === category);
      }
      
      return metrics
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return [];
    }
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(
    severity?: string,
    limit: number = 50
  ): Promise<PerformanceAlert[]> {
    try {
      let alerts = Array.from(this.alerts.values());
      
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }
      
      return alerts
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting performance alerts:', error);
      return [];
    }
  }

  /**
   * Get system health
   */
  getSystemHealth(): SystemHealth {
    return this.systemHealth;
  }

  /**
   * Initialize system health
   */
  private initializeSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      components: {
        cpu: 'healthy',
        memory: 'healthy',
        network: 'healthy',
        database: 'healthy',
        api: 'healthy',
      },
      score: 1.0,
      lastUpdated: new Date(),
      recommendations: [],
    };
  }

  /**
   * Initialize alert thresholds
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds.set('cpu_usage', 80);
    this.alertThresholds.set('memory_usage', 85);
    this.alertThresholds.set('network_latency', 100);
    this.alertThresholds.set('db_query_time', 100);
    this.alertThresholds.set('api_response_time', 200);
    this.alertThresholds.set('system_load', 2.0);
  }

  /**
   * Initialize baselines
   */
  private initializeBaselines(): void {
    const baselineMetrics = [
      'cpu_usage', 'memory_usage', 'network_latency', 'db_query_time',
      'api_response_time', 'active_users', 'system_load'
    ];
    
    baselineMetrics.forEach(metric => {
      this.baselines.set(metric, {
        metricName: metric,
        averageValue: 0,
        standardDeviation: 0,
        percentile95: 0,
        percentile99: 0,
        sampleSize: 0,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Calculate trend
   */
  private calculateTrend(metricName: string, currentValue: number): 'increasing' | 'decreasing' | 'stable' {
    const baseline = this.baselines.get(metricName);
    if (!baseline) return 'stable';
    
    const difference = currentValue - baseline.averageValue;
    const threshold = baseline.standardDeviation * 0.5;
    
    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate component health
   */
  private calculateComponentHealth(metrics: PerformanceMetric[], category: string): number {
    const categoryMetrics = metrics.filter(metric => metric.category === category);
    if (categoryMetrics.length === 0) return 1.0;
    
    const healthyMetrics = categoryMetrics.filter(metric => metric.status === 'normal').length;
    return healthyMetrics / categoryMetrics.length;
  }

  /**
   * Generate alert actions
   */
  private generateAlertActions(metric: PerformanceMetric): string[] {
    const actions: string[] = [];
    
    switch (metric.category) {
      case 'cpu':
        actions.push('Scale up CPU resources', 'Optimize CPU-intensive operations');
        break;
      case 'memory':
        actions.push('Increase memory allocation', 'Optimize memory usage', 'Run garbage collection');
        break;
      case 'network':
        actions.push('Check network connectivity', 'Optimize network configuration');
        break;
      case 'database':
        actions.push('Optimize database queries', 'Check database connections');
        break;
      case 'api':
        actions.push('Scale API servers', 'Optimize API responses');
        break;
    }
    
    return actions;
  }

  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(healthScores: Record<string, number>): string[] {
    const recommendations: string[] = [];
    
    Object.entries(healthScores).forEach(([component, score]) => {
      if (score < 0.5) {
        recommendations.push(`Critical: ${component} component needs immediate attention`);
      } else if (score < 0.8) {
        recommendations.push(`Warning: ${component} component performance is degraded`);
      }
    });
    
    return recommendations;
  }

  /**
   * Generate report recommendations
   */
  private generateReportRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    const criticalMetrics = metrics.filter(metric => metric.status === 'critical');
    if (criticalMetrics.length > 0) {
      recommendations.push(`Address ${criticalMetrics.length} critical performance issues`);
    }
    
    const warningMetrics = metrics.filter(metric => metric.status === 'warning');
    if (warningMetrics.length > 0) {
      recommendations.push(`Monitor ${warningMetrics.length} warning-level metrics`);
    }
    
    return recommendations;
  }

  /**
   * Get active users count
   */
  private async getActiveUsersCount(): Promise<number> {
    try {
      // Simulate active users count
      return Math.floor(Math.random() * 1000) + 100;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
    }
  }

  /**
   * Get performance monitoring statistics
   */
  getPerformanceMonitoringStats(): any {
    return {
      totalMetrics: this.metrics.size,
      totalAlerts: this.alerts.size,
      totalReports: this.reports.size,
      totalBaselines: this.baselines.size,
      systemHealth: this.systemHealth.overall,
      healthScore: this.systemHealth.score,
      monitoringActive: this.monitoringInterval !== null,
    };
  }

  /**
   * Clear performance monitoring data
   */
  clearPerformanceMonitoringData(): void {
    this.metrics.clear();
    this.alerts.clear();
    this.reports.clear();
    this.baselines.clear();
  }
}

export const advancedPerformanceMonitor = new AdvancedPerformanceMonitor();


