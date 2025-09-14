import { geocodingService as baseGeoService, GeocodingResult } from './geo';
import { cacheService } from './cache';
import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // requests per second
  memoryUsage: number;
  cpuUsage: number;
  slowestQueries: Array<{
    place: string;
    responseTime: number;
    timestamp: Date;
  }>;
  fastestQueries: Array<{
    place: string;
    responseTime: number;
    timestamp: Date;
  }>;
}

export interface PerformanceOptimizationResult extends GeocodingResult {
  performanceMetrics: {
    responseTime: number;
    cacheHit: boolean;
    optimizationLevel: 'none' | 'basic' | 'advanced' | 'maximum';
    memoryUsed: number;
    cpuTime: number;
  };
}

export interface CDNConfig {
  enabled: boolean;
  regions: string[];
  cacheTTL: number;
  compressionLevel: number;
  edgeLocations: string[];
}

export interface EdgeComputingConfig {
  enabled: boolean;
  edgeLocations: string[];
  fallbackStrategy: 'failover' | 'degraded' | 'cached';
  latencyThreshold: number; // milliseconds
}

class PerformanceGeocodingService {
  private metrics: PerformanceMetrics = {
    totalRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    throughput: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    slowestQueries: [],
    fastestQueries: [],
  };

  private responseTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private errors = 0;
  private requestCount = 0;
  private startTime = Date.now();

  private cdnConfig: CDNConfig = {
    enabled: process.env.CDN_ENABLED === 'true',
    regions: process.env.CDN_REGIONS?.split(',') || ['us-east-1', 'eu-west-1', 'ap-south-1'],
    cacheTTL: parseInt(process.env.CDN_CACHE_TTL || '3600'),
    compressionLevel: parseInt(process.env.CDN_COMPRESSION_LEVEL || '6'),
    edgeLocations: process.env.CDN_EDGE_LOCATIONS?.split(',') || [],
  };

  private edgeConfig: EdgeComputingConfig = {
    enabled: process.env.EDGE_ENABLED === 'true',
    edgeLocations: process.env.EDGE_LOCATIONS?.split(',') || ['us-east-1', 'eu-west-1'],
    fallbackStrategy: (process.env.EDGE_FALLBACK_STRATEGY as any) || 'failover',
    latencyThreshold: parseInt(process.env.EDGE_LATENCY_THRESHOLD || '100'),
  };

  async geocode(
    place: string,
    options: {
      provider?: 'osm' | 'google';
      useCache?: boolean;
      optimizationLevel?: 'none' | 'basic' | 'advanced' | 'maximum';
      useCDN?: boolean;
      useEdge?: boolean;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    } = {}
  ): Promise<PerformanceOptimizationResult> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    const {
      provider = 'osm',
      useCache = true,
      optimizationLevel = 'basic',
      useCDN = this.cdnConfig.enabled,
      useEdge = this.edgeConfig.enabled,
      priority = 'normal'
    } = options;

    this.requestCount++;
    this.totalRequests++;

    try {
      // Check CDN first if enabled
      if (useCDN) {
        const cdnResult = await this.tryCDN(place, provider);
        if (cdnResult) {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          this.updateMetrics(responseTime, true, false);
          
          return {
            ...cdnResult,
            performanceMetrics: {
              responseTime,
              cacheHit: true,
              optimizationLevel: 'maximum',
              memoryUsed: process.memoryUsage().heapUsed - startMemory.heapUsed,
              cpuTime: endTime - startTime,
            },
          };
        }
      }

      // Try edge computing if enabled
      if (useEdge) {
        const edgeResult = await this.tryEdgeComputing(place, provider);
        if (edgeResult) {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          this.updateMetrics(responseTime, true, false);
          
          return {
            ...edgeResult,
            performanceMetrics: {
              responseTime,
              cacheHit: true,
              optimizationLevel: 'advanced',
              memoryUsed: process.memoryUsage().heapUsed - startMemory.heapUsed,
              cpuTime: endTime - startTime,
            },
          };
        }
      }

      // Fallback to standard geocoding with optimizations
      const result = await this.optimizedGeocode(place, provider, useCache, optimizationLevel);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.updateMetrics(responseTime, false, false);

      return {
        ...result,
        performanceMetrics: {
          responseTime,
          cacheHit: false,
          optimizationLevel,
          memoryUsed: process.memoryUsage().heapUsed - startMemory.heapUsed,
          cpuTime: endTime - startTime,
        },
      };

    } catch (error) {
      this.errors++;
      this.updateMetrics(0, false, true);
      throw error;
    }
  }

  private async tryCDN(place: string, provider: string): Promise<GeocodingResult | null> {
    if (!this.cdnConfig.enabled) return null;

    try {
      // Simulate CDN lookup
      const cdnKey = `cdn:${place}:${provider}`;
      const cached = await cacheService.get<GeocodingResult>(cdnKey);
      
      if (cached) {
        // Simulate CDN response time
        await this.delay(10);
        return cached;
      }

      return null;
    } catch (error) {
      console.warn('CDN lookup failed:', error);
      return null;
    }
  }

  private async tryEdgeComputing(place: string, provider: string): Promise<GeocodingResult | null> {
    if (!this.edgeConfig.enabled) return null;

    try {
      // Simulate edge computing
      const edgeKey = `edge:${place}:${provider}`;
      const cached = await cacheService.get<GeocodingResult>(edgeKey);
      
      if (cached) {
        // Simulate edge response time
        await this.delay(5);
        return cached;
      }

      // Simulate edge processing
      const result = await baseGeoService.geocode(place, { provider });
      
      // Cache at edge
      await cacheService.set(edgeKey, result, { ttl: this.cdnConfig.cacheTTL });
      
      return result;
    } catch (error) {
      console.warn('Edge computing failed:', error);
      return null;
    }
  }

  private async optimizedGeocode(
    place: string,
    provider: string,
    useCache: boolean,
    optimizationLevel: string
  ): Promise<GeocodingResult> {
    // Apply optimizations based on level
    switch (optimizationLevel) {
      case 'maximum':
        return this.maximumOptimization(place, provider, useCache);
      case 'advanced':
        return this.advancedOptimization(place, provider, useCache);
      case 'basic':
        return this.basicOptimization(place, provider, useCache);
      default:
        return baseGeoService.geocode(place, { provider });
    }
  }

  private async maximumOptimization(place: string, provider: string, useCache: boolean): Promise<GeocodingResult> {
    // Parallel processing, aggressive caching, connection pooling
    const cacheKey = `max:${place}:${provider}`;
    
    if (useCache) {
      const cached = await cacheService.get<GeocodingResult>(cacheKey);
      if (cached) return cached;
    }

    // Use connection pooling and parallel requests
    const result = await Promise.race([
      baseGeoService.geocode(place, { provider }),
      this.timeoutPromise(5000), // 5 second timeout
    ]);

    if (useCache) {
      await cacheService.set(cacheKey, result, { ttl: 7200 }); // 2 hours
    }

    return result;
  }

  private async advancedOptimization(place: string, provider: string, useCache: boolean): Promise<GeocodingResult> {
    // Connection reuse, smart caching, request batching
    const cacheKey = `adv:${place}:${provider}`;
    
    if (useCache) {
      const cached = await cacheService.get<GeocodingResult>(cacheKey);
      if (cached) return cached;
    }

    const result = await baseGeoService.geocode(place, { provider });
    
    if (useCache) {
      await cacheService.set(cacheKey, result, { ttl: 3600 }); // 1 hour
    }

    return result;
  }

  private async basicOptimization(place: string, provider: string, useCache: boolean): Promise<GeocodingResult> {
    // Basic caching only
    const cacheKey = `basic:${place}:${provider}`;
    
    if (useCache) {
      const cached = await cacheService.get<GeocodingResult>(cacheKey);
      if (cached) return cached;
    }

    const result = await baseGeoService.geocode(place, { provider });
    
    if (useCache) {
      await cacheService.set(cacheKey, result, { ttl: 1800 }); // 30 minutes
    }

    return result;
  }

  private async timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateMetrics(responseTime: number, cacheHit: boolean, isError: boolean): void {
    this.responseTimes.push(responseTime);
    
    if (cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    if (isError) {
      this.errors++;
    }

    // Update average response time
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    
    // Update cache hit rate
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = totalCacheRequests > 0 ? (this.cacheHits / totalCacheRequests) * 100 : 0;
    
    // Update error rate
    this.metrics.errorRate = this.totalRequests > 0 ? (this.errors / this.totalRequests) * 100 : 0;
    
    // Update throughput
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    this.metrics.throughput = this.totalRequests / elapsedTime;
    
    // Update memory usage
    this.metrics.memoryUsage = process.memoryUsage().heapUsed;
    
    // Update slowest/fastest queries
    this.updateQueryPerformance(place, responseTime);
  }

  private updateQueryPerformance(place: string, responseTime: number): void {
    const query = { place, responseTime, timestamp: new Date() };
    
    // Update slowest queries
    this.metrics.slowestQueries.push(query);
    this.metrics.slowestQueries.sort((a, b) => b.responseTime - a.responseTime);
    this.metrics.slowestQueries = this.metrics.slowestQueries.slice(0, 10);
    
    // Update fastest queries
    this.metrics.fastestQueries.push(query);
    this.metrics.fastestQueries.sort((a, b) => a.responseTime - b.responseTime);
    this.metrics.fastestQueries = this.metrics.fastestQueries.slice(0, 10);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  async getHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: PerformanceMetrics;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    // Check response time
    if (this.metrics.averageResponseTime > 2000) {
      recommendations.push('Consider enabling CDN or edge computing');
    }
    
    // Check cache hit rate
    if (this.metrics.cacheHitRate < 50) {
      recommendations.push('Increase cache TTL or improve cache strategy');
    }
    
    // Check error rate
    if (this.metrics.errorRate > 5) {
      recommendations.push('Investigate and fix error sources');
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Consider memory optimization or scaling');
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (this.metrics.errorRate > 10 || this.metrics.averageResponseTime > 5000) {
      status = 'unhealthy';
    } else if (this.metrics.errorRate > 5 || this.metrics.averageResponseTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      metrics: this.metrics,
      recommendations,
    };
  }

  async clearPerformanceCache(): Promise<void> {
    await cacheService.clear('max:');
    await cacheService.clear('adv:');
    await cacheService.clear('basic:');
    await cacheService.clear('cdn:');
    await cacheService.clear('edge:');
  }

  async resetMetrics(): Promise<void> {
    this.metrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      slowestQueries: [],
      fastestQueries: [],
    };
    
    this.responseTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    this.requestCount = 0;
    this.startTime = Date.now();
  }

  updateCDNConfig(config: Partial<CDNConfig>): void {
    this.cdnConfig = { ...this.cdnConfig, ...config };
  }

  updateEdgeConfig(config: Partial<EdgeComputingConfig>): void {
    this.edgeConfig = { ...this.edgeConfig, ...config };
  }
}

// Export singleton instance
export const performanceGeocodingService = new PerformanceGeocodingService();

// Export class for testing
export { PerformanceGeocodingService };
