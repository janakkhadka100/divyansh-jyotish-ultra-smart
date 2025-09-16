import { z } from 'zod';
import { advancedCacheService } from './advanced-cache';
import { analyticsService } from './analytics';

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  cacheHitRate: number;
  databaseQueryTime: number;
  apiCallTime: number;
  timestamp: Date;
}

export interface OptimizationConfig {
  enableCDN: boolean;
  enableEdgeComputing: boolean;
  enableConnectionPooling: boolean;
  enableLazyLoading: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  enableMonitoring: boolean;
  cdnUrl: string;
  edgeNodes: string[];
  maxConnections: number;
  cacheTTL: number;
  compressionLevel: number;
  monitoringInterval: number;
}

export interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'azure' | 'custom';
  url: string;
  apiKey: string;
  zones: string[];
  cacheRules: Array<{
    pattern: string;
    ttl: number;
    headers: Record<string, string>;
  }>;
}

export interface EdgeConfig {
  nodes: Array<{
    id: string;
    location: string;
    url: string;
    capacity: number;
    latency: number;
  }>;
  loadBalancing: 'round_robin' | 'least_connections' | 'latency_based';
  failover: boolean;
  healthCheck: {
    interval: number;
    timeout: number;
    retries: number;
  };
}

const PerformanceMetricsSchema = z.object({
  responseTime: z.number(),
  throughput: z.number(),
  errorRate: z.number(),
  cpuUsage: z.number(),
  memoryUsage: z.number(),
  cacheHitRate: z.number(),
  databaseQueryTime: z.number(),
  apiCallTime: z.number(),
  timestamp: z.date(),
});

class PerformanceOptimizationService {
  private config: OptimizationConfig;
  private cdnConfig: CDNConfig | null = null;
  private edgeConfig: EdgeConfig | null = null;
  private metrics: PerformanceMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableCDN: config.enableCDN || false,
      enableEdgeComputing: config.enableEdgeComputing || false,
      enableConnectionPooling: config.enableConnectionPooling !== false,
      enableLazyLoading: config.enableLazyLoading !== false,
      enableCompression: config.enableCompression !== false,
      enableCaching: config.enableCaching !== false,
      enableMonitoring: config.enableMonitoring !== false,
      cdnUrl: config.cdnUrl || '',
      edgeNodes: config.edgeNodes || [],
      maxConnections: config.maxConnections || 100,
      cacheTTL: config.cacheTTL || 3600,
      compressionLevel: config.compressionLevel || 6,
      monitoringInterval: config.monitoringInterval || 60000, // 1 minute
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize CDN if enabled
      if (this.config.enableCDN) {
        await this.initializeCDN();
      }

      // Initialize edge computing if enabled
      if (this.config.enableEdgeComputing) {
        await this.initializeEdgeComputing();
      }

      // Start monitoring if enabled
      if (this.config.enableMonitoring) {
        this.startMonitoring();
      }

      this.isInitialized = true;
      console.log('Performance Optimization Service initialized');

    } catch (error) {
      console.error('Error initializing performance optimization service:', error);
    }
  }

  /**
   * Optimize API response
   */
  async optimizeResponse(
    data: any,
    requestType: string,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<any> {
    let optimizedData = data;

    // Apply compression if enabled
    if (this.config.enableCompression) {
      optimizedData = await this.compressResponse(optimizedData);
    }

    // Apply lazy loading if enabled
    if (this.config.enableLazyLoading) {
      optimizedData = await this.applyLazyLoading(optimizedData, requestType);
    }

    // Apply caching if enabled
    if (this.config.enableCaching) {
      await this.cacheResponse(optimizedData, requestType);
    }

    // Apply CDN optimization if enabled
    if (this.config.enableCDN) {
      optimizedData = await this.applyCDNOptimization(optimizedData, userLocation);
    }

    // Apply edge computing if enabled
    if (this.config.enableEdgeComputing) {
      optimizedData = await this.applyEdgeComputing(optimizedData, userLocation);
    }

    return optimizedData;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const startTime = Date.now();
      
      // Get system metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = await this.getCPUUsage();
      
      // Get cache metrics
      const cacheMetrics = advancedCacheService.getMetrics();
      
      // Get database query time (mock for now)
      const databaseQueryTime = await this.getDatabaseQueryTime();
      
      // Get API call time (mock for now)
      const apiCallTime = await this.getAPICallTime();
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Calculate throughput (requests per second)
      const throughput = this.calculateThroughput();
      
      // Calculate error rate
      const errorRate = await this.getErrorRate();
      
      const metrics: PerformanceMetrics = {
        responseTime,
        throughput,
        errorRate,
        cpuUsage,
        memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
        cacheHitRate: cacheMetrics.hitRate,
        databaseQueryTime,
        apiCallTime,
        timestamp: new Date(),
      };

      // Store metrics
      this.metrics.push(metrics);
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Track analytics
      await analyticsService.trackPerformance(
        'system_metrics',
        responseTime,
        'ms',
        undefined,
        undefined,
        { cpuUsage, memoryUsage: memoryUsage.heapUsed, cacheHitRate: cacheMetrics.hitRate }
      );

      return metrics;

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(hours: number = 24): {
    responseTime: Array<{ timestamp: Date; value: number }>;
    throughput: Array<{ timestamp: Date; value: number }>;
    errorRate: Array<{ timestamp: Date; value: number }>;
    cacheHitRate: Array<{ timestamp: Date; value: number }>;
  } {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    return {
      responseTime: recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.responseTime })),
      throughput: recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.throughput })),
      errorRate: recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.errorRate })),
      cacheHitRate: recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.cacheHitRate })),
    };
  }

  /**
   * Optimize database queries
   */
  async optimizeDatabaseQueries(): Promise<void> {
    try {
      // This would implement database query optimization
      // For now, just log the action
      console.log('Optimizing database queries...');
      
      // Track analytics
      await analyticsService.trackPerformance(
        'database_optimization',
        0,
        'ms',
        undefined,
        undefined,
        { action: 'query_optimization' }
      );

    } catch (error) {
      console.error('Error optimizing database queries:', error);
    }
  }

  /**
   * Optimize cache strategy
   */
  async optimizeCacheStrategy(): Promise<void> {
    try {
      // Analyze cache performance and adjust strategy
      const cacheMetrics = advancedCacheService.getMetrics();
      
      if (cacheMetrics.hitRate < 70) {
        // Increase cache TTL
        console.log('Increasing cache TTL due to low hit rate');
      }
      
      if (cacheMetrics.hitRate > 95) {
        // Decrease cache TTL to ensure freshness
        console.log('Decreasing cache TTL due to high hit rate');
      }

      // Track analytics
      await analyticsService.trackPerformance(
        'cache_optimization',
        cacheMetrics.hitRate,
        'percentage',
        undefined,
        undefined,
        { hitRate: cacheMetrics.hitRate, totalHits: cacheMetrics.hits }
      );

    } catch (error) {
      console.error('Error optimizing cache strategy:', error);
    }
  }

  /**
   * Get CDN status
   */
  async getCDNStatus(): Promise<{
    status: string;
    nodes: Array<{ location: string; status: string; latency: number }>;
    cacheHitRate: number;
    bandwidth: number;
  }> {
    if (!this.config.enableCDN || !this.cdnConfig) {
      return {
        status: 'disabled',
        nodes: [],
        cacheHitRate: 0,
        bandwidth: 0,
      };
    }

    try {
      // This would check CDN status
      // For now, return mock data
      return {
        status: 'active',
        nodes: [
          { location: 'US-East', status: 'healthy', latency: 50 },
          { location: 'EU-West', status: 'healthy', latency: 75 },
          { location: 'Asia-Pacific', status: 'healthy', latency: 100 },
        ],
        cacheHitRate: 85,
        bandwidth: 1000, // Mbps
      };

    } catch (error) {
      console.error('Error getting CDN status:', error);
      return {
        status: 'error',
        nodes: [],
        cacheHitRate: 0,
        bandwidth: 0,
      };
    }
  }

  /**
   * Get edge computing status
   */
  async getEdgeStatus(): Promise<{
    status: string;
    nodes: Array<{ id: string; location: string; status: string; capacity: number }>;
    loadBalancing: string;
    failover: boolean;
  }> {
    if (!this.config.enableEdgeComputing || !this.edgeConfig) {
      return {
        status: 'disabled',
        nodes: [],
        loadBalancing: 'none',
        failover: false,
      };
    }

    try {
      // This would check edge computing status
      // For now, return mock data
      return {
        status: 'active',
        nodes: this.edgeConfig.nodes.map(node => ({
          id: node.id,
          location: node.location,
          status: 'healthy',
          capacity: node.capacity,
        })),
        loadBalancing: this.edgeConfig.loadBalancing,
        failover: this.edgeConfig.failover,
      };

    } catch (error) {
      console.error('Error getting edge status:', error);
      return {
        status: 'error',
        nodes: [],
        loadBalancing: 'none',
        failover: false,
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizationConfig {
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
    console.log('Performance Optimization Service shutdown');
  }

  // Private helper methods
  private async initializeCDN(): Promise<void> {
    // Initialize CDN configuration
    this.cdnConfig = {
      provider: 'cloudflare',
      url: this.config.cdnUrl,
      apiKey: process.env.CDN_API_KEY || '',
      zones: ['divyansh-jyotish.com'],
      cacheRules: [
        { pattern: '*.js', ttl: 86400, headers: { 'Cache-Control': 'public, max-age=86400' } },
        { pattern: '*.css', ttl: 86400, headers: { 'Cache-Control': 'public, max-age=86400' } },
        { pattern: '*.png', ttl: 604800, headers: { 'Cache-Control': 'public, max-age=604800' } },
        { pattern: '*.jpg', ttl: 604800, headers: { 'Cache-Control': 'public, max-age=604800' } },
      ],
    };
  }

  private async initializeEdgeComputing(): Promise<void> {
    // Initialize edge computing configuration
    this.edgeConfig = {
      nodes: [
        { id: 'edge-1', location: 'US-East', url: 'https://edge1.divyansh-jyotish.com', capacity: 1000, latency: 50 },
        { id: 'edge-2', location: 'EU-West', url: 'https://edge2.divyansh-jyotish.com', capacity: 1000, latency: 75 },
        { id: 'edge-3', location: 'Asia-Pacific', url: 'https://edge3.divyansh-jyotish.com', capacity: 1000, latency: 100 },
      ],
      loadBalancing: 'latency_based',
      failover: true,
      healthCheck: {
        interval: 30000,
        timeout: 5000,
        retries: 3,
      },
    };
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.getPerformanceMetrics();
      } catch (error) {
        console.error('Error in performance monitoring:', error);
      }
    }, this.config.monitoringInterval);
  }

  private async compressResponse(data: any): Promise<any> {
    // Simple compression - in production, use proper compression
    return data;
  }

  private async applyLazyLoading(data: any, requestType: string): Promise<any> {
    // Apply lazy loading based on request type
    if (requestType === 'kundli' && data.charts) {
      data.charts = data.charts.map((chart: any) => ({
        ...chart,
        positions: chart.positions?.slice(0, 5), // Load only first 5 positions initially
      }));
    }
    return data;
  }

  private async cacheResponse(data: any, requestType: string): Promise<void> {
    const cacheKey = `performance:${requestType}:${Date.now()}`;
    await advancedCacheService.set(cacheKey, data, 'analytics');
  }

  private async applyCDNOptimization(data: any, userLocation?: { latitude: number; longitude: number }): Promise<any> {
    // Apply CDN-specific optimizations
    if (userLocation) {
      // Add CDN headers based on user location
      data._cdn = {
        optimized: true,
        location: userLocation,
        cacheKey: this.generateCDNCacheKey(data, userLocation),
      };
    }
    return data;
  }

  private async applyEdgeComputing(data: any, userLocation?: { latitude: number; longitude: number }): Promise<any> {
    // Apply edge computing optimizations
    if (userLocation && this.edgeConfig) {
      // Find closest edge node
      const closestNode = this.findClosestEdgeNode(userLocation);
      if (closestNode) {
        data._edge = {
          node: closestNode.id,
          location: closestNode.location,
          latency: closestNode.latency,
        };
      }
    }
    return data;
  }

  private async getCPUUsage(): Promise<number> {
    // Mock CPU usage - in production, use proper CPU monitoring
    return Math.random() * 100;
  }

  private async getDatabaseQueryTime(): Promise<number> {
    // Mock database query time - in production, measure actual queries
    return Math.random() * 100;
  }

  private async getAPICallTime(): Promise<number> {
    // Mock API call time - in production, measure actual API calls
    return Math.random() * 200;
  }

  private calculateThroughput(): number {
    // Calculate requests per second based on recent metrics
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length < 2) return 0;
    
    const timeDiff = recentMetrics[recentMetrics.length - 1].timestamp.getTime() - recentMetrics[0].timestamp.getTime();
    return timeDiff > 0 ? (recentMetrics.length * 1000) / timeDiff : 0;
  }

  private async getErrorRate(): Promise<number> {
    // Get error rate from analytics
    try {
      const metrics = await analyticsService.getMetrics();
      return metrics.errorRate;
    } catch (error) {
      return 0;
    }
  }

  private generateCDNCacheKey(data: any, userLocation: { latitude: number; longitude: number }): string {
    const key = `${JSON.stringify(data)}:${userLocation.latitude}:${userLocation.longitude}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private findClosestEdgeNode(userLocation: { latitude: number; longitude: number }): any {
    if (!this.edgeConfig) return null;
    
    // Simple distance calculation - in production, use proper geolocation
    let closestNode = this.edgeConfig.nodes[0];
    let minDistance = this.calculateDistance(userLocation, { latitude: 0, longitude: 0 });
    
    for (const node of this.edgeConfig.nodes) {
      const distance = this.calculateDistance(userLocation, { latitude: 0, longitude: 0 });
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }
    
    return closestNode;
  }

  private calculateDistance(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Export singleton instance
export const performanceOptimizationService = new PerformanceOptimizationService();

// Export class for testing
export { PerformanceOptimizationService };


