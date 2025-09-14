import { prisma } from '@/server/lib/prisma';
import { advancedCacheService } from './advanced-cache';
import { z } from 'zod';

export interface AnalyticsEvent {
  id: string;
  type: 'api_call' | 'user_action' | 'error' | 'performance' | 'business';
  category: string;
  action: string;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  duration?: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export interface AnalyticsMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  successRate: number;
  averageResponseTime: number;
  topUsers: Array<{ userId: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
  errorRate: number;
  peakHours: Array<{ hour: number; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
}

export interface PerformanceMetrics {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
    averageResponseTime: number;
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    uptime: number;
  };
}

export interface BusinessMetrics {
  users: {
    total: number;
    active: number;
    new: number;
    returning: number;
    churnRate: number;
  };
  sessions: {
    total: number;
    average: number;
    peak: number;
    duration: {
      average: number;
      median: number;
      p95: number;
    };
  };
  horoscopes: {
    total: number;
    byType: Record<string, number>;
    byLocation: Record<string, number>;
    byLanguage: Record<string, number>;
    successRate: number;
  };
  revenue: {
    total: number;
    monthly: number;
    byPlan: Record<string, number>;
    conversionRate: number;
  };
}

const AnalyticsEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['api_call', 'user_action', 'error', 'performance', 'business']),
  category: z.string().min(1),
  action: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()),
  timestamp: z.date(),
  duration: z.number().optional(),
  success: z.boolean(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.object({
    country: z.string(),
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private isInitialized = false;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute
  private readonly MAX_EVENTS_IN_MEMORY = 1000;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, this.FLUSH_INTERVAL);

    this.isInitialized = true;
    console.log('Analytics Service initialized');
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };

      // Validate event
      AnalyticsEventSchema.parse(analyticsEvent);

      // Add to memory buffer
      this.events.push(analyticsEvent);

      // Flush if buffer is full
      if (this.events.length >= this.MAX_EVENTS_IN_MEMORY) {
        await this.flushEvents();
      }

      // Emit real-time event
      this.emitRealtimeEvent(analyticsEvent);

    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  /**
   * Track API call
   */
  async trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    success: boolean,
    userId?: string,
    sessionId?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      type: 'api_call',
      category: 'api',
      action: `${method} ${endpoint}`,
      userId,
      sessionId,
      metadata: {
        endpoint,
        method,
        duration,
        ...metadata,
      },
      duration,
      success,
    });
  }

  /**
   * Track user action
   */
  async trackUserAction(
    action: string,
    category: string,
    userId: string,
    sessionId?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      type: 'user_action',
      category,
      action,
      userId,
      sessionId,
      metadata,
      success: true,
    });
  }

  /**
   * Track error
   */
  async trackError(
    error: Error,
    context: string,
    userId?: string,
    sessionId?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      type: 'error',
      category: 'error',
      action: context,
      userId,
      sessionId,
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
        context,
        ...metadata,
      },
      success: false,
    });
  }

  /**
   * Track performance metric
   */
  async trackPerformance(
    metric: string,
    value: number,
    unit: string,
    userId?: string,
    sessionId?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      type: 'performance',
      category: 'performance',
      action: metric,
      userId,
      sessionId,
      metadata: {
        value,
        unit,
        ...metadata,
      },
      success: true,
    });
  }

  /**
   * Track business metric
   */
  async trackBusiness(
    metric: string,
    value: number,
    category: string,
    userId?: string,
    sessionId?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      type: 'business',
      category,
      action: metric,
      userId,
      sessionId,
      metadata: {
        value,
        ...metadata,
      },
      success: true,
    });
  }

  /**
   * Get analytics metrics
   */
  async getMetrics(
    startDate?: Date,
    endDate?: Date,
    filters?: Record<string, any>
  ): Promise<AnalyticsMetrics> {
    try {
      // Flush pending events first
      await this.flushEvents();

      // Build query conditions
      const where: any = {};
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      // Apply filters
      if (filters) {
        Object.assign(where, filters);
      }

      // Get events from database
      const events = await prisma.analyticsEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 10000, // Limit for performance
      });

      // Calculate metrics
      const totalEvents = events.length;
      const eventsByType: Record<string, number> = {};
      const eventsByCategory: Record<string, number> = {};
      let successfulEvents = 0;
      let totalResponseTime = 0;
      const userCounts: Record<string, number> = {};
      const locationCounts: Record<string, number> = {};
      const errorCounts: Record<string, number> = {};
      const hourCounts: Record<number, number> = {};
      const dailyCounts: Record<string, number> = {};

      events.forEach(event => {
        // Count by type
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
        
        // Count by category
        eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
        
        // Count successful events
        if (event.success) successfulEvents++;
        
        // Sum response times
        if (event.duration) totalResponseTime += event.duration;
        
        // Count by user
        if (event.userId) {
          userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
        }
        
        // Count by location
        if (event.location) {
          const location = `${event.location.city}, ${event.location.country}`;
          locationCounts[location] = (locationCounts[location] || 0) + 1;
        }
        
        // Count errors
        if (!event.success) {
          errorCounts[event.category] = (errorCounts[event.category] || 0) + 1;
        }
        
        // Count by hour
        const hour = event.timestamp.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        
        // Count by day
        const date = event.timestamp.toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      // Calculate derived metrics
      const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
      const averageResponseTime = totalEvents > 0 ? totalResponseTime / totalEvents : 0;
      const errorRate = totalEvents > 0 ? ((totalEvents - successfulEvents) / totalEvents) * 100 : 0;

      // Sort and limit top results
      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 24);

      const dailyStats = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      return {
        totalEvents,
        eventsByType,
        eventsByCategory,
        successRate,
        averageResponseTime,
        topUsers,
        topLocations,
        errorRate,
        peakHours,
        dailyStats,
      };

    } catch (error) {
      console.error('Error getting analytics metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      // Get cache metrics
      const cacheMetrics = advancedCacheService.getMetrics();
      
      // Get API call metrics
      const apiEvents = await prisma.analyticsEvent.findMany({
        where: { type: 'api_call' },
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });

      const apiCalls = {
        total: apiEvents.length,
        successful: apiEvents.filter(e => e.success).length,
        failed: apiEvents.filter(e => !e.success).length,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      };

      if (apiEvents.length > 0) {
        const responseTimes = apiEvents
          .filter(e => e.duration)
          .map(e => e.duration!)
          .sort((a, b) => a - b);

        apiCalls.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        apiCalls.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
        apiCalls.p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
      }

      // Get system metrics (mock for now)
      const system = {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0, // Would need external library
        diskUsage: 0, // Would need external library
        uptime: process.uptime(),
      };

      return {
        apiCalls,
        cache: {
          hitRate: cacheMetrics.hitRate,
          missRate: 100 - cacheMetrics.hitRate,
          totalHits: cacheMetrics.hits,
          totalMisses: cacheMetrics.misses,
          averageResponseTime: cacheMetrics.averageResponseTime,
        },
        database: {
          totalQueries: 0, // Would need database monitoring
          averageQueryTime: 0,
          slowQueries: 0,
          connectionPool: {
            active: 0,
            idle: 0,
            total: 0,
          },
        },
        system,
      };

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get business metrics
   */
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      // Get user metrics
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          sessions: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      });

      // Get session metrics
      const sessions = await prisma.session.findMany({
        include: { birth: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      const sessionDurations = sessions
        .filter(s => s.birth)
        .map(s => {
          const created = s.createdAt.getTime();
          const now = Date.now();
          return now - created;
        });

      // Get horoscope metrics
      const horoscopes = await prisma.horoscopeResult.count();
      const successfulHoroscopes = await prisma.horoscopeResult.count({
        where: { summary: { not: { equals: {} } } },
      });

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: 0, // Would need to track new users
          returning: 0, // Would need to track returning users
          churnRate: 0, // Would need to calculate churn
        },
        sessions: {
          total: sessions.length,
          average: sessionDurations.length > 0 ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length : 0,
          peak: Math.max(...sessionDurations, 0),
          duration: {
            average: sessionDurations.length > 0 ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length : 0,
            median: sessionDurations.length > 0 ? sessionDurations.sort((a, b) => a - b)[Math.floor(sessionDurations.length / 2)] : 0,
            p95: sessionDurations.length > 0 ? sessionDurations.sort((a, b) => a - b)[Math.floor(sessionDurations.length * 0.95)] : 0,
          },
        },
        horoscopes: {
          total: horoscopes,
          byType: {}, // Would need to categorize by type
          byLocation: {}, // Would need to group by location
          byLanguage: {}, // Would need to group by language
          successRate: horoscopes > 0 ? (successfulHoroscopes / horoscopes) * 100 : 0,
        },
        revenue: {
          total: 0, // Would need payment integration
          monthly: 0,
          byPlan: {},
          conversionRate: 0,
        },
      };

    } catch (error) {
      console.error('Error getting business metrics:', error);
      throw error;
    }
  }

  /**
   * Flush events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      // Batch insert events
      await prisma.analyticsEvent.createMany({
        data: this.events.map(event => ({
          id: event.id,
          type: event.type,
          category: event.category,
          action: event.action,
          userId: event.userId,
          sessionId: event.sessionId,
          metadata: event.metadata,
          timestamp: event.timestamp,
          duration: event.duration,
          success: event.success,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          location: event.location,
        })),
      });

      // Clear memory buffer
      this.events = [];

    } catch (error) {
      console.error('Error flushing analytics events:', error);
    }
  }

  /**
   * Emit real-time event
   */
  private emitRealtimeEvent(event: AnalyticsEvent): void {
    // This would integrate with real-time service
    // For now, just log
    console.log('Analytics event:', event);
  }

  /**
   * Export analytics data
   */
  async exportData(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const events = await prisma.analyticsEvent.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      if (format === 'json') {
        return JSON.stringify(events, null, 2);
      } else {
        // Convert to CSV
        const headers = Object.keys(events[0] || {}).join(',');
        const rows = events.map(event => 
          Object.values(event).map(value => 
            typeof value === 'object' ? JSON.stringify(value) : value
          ).join(',')
        );
        return [headers, ...rows].join('\n');
      }

    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      await prisma.analyticsEvent.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up analytics data older than ${daysToKeep} days`);

    } catch (error) {
      console.error('Error cleaning up analytics data:', error);
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    await this.flushEvents();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export class for testing
export { AnalyticsService };
