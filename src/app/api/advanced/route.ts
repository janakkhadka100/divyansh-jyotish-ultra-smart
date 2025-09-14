import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { batchProcessor } from '@/server/services/batch-processor';
import { realtimeUpdateService } from '@/server/services/realtime-updates';
import { analyticsService } from '@/server/services/analytics';
import { mobileOptimizationService } from '@/server/services/mobile-optimization';
import { aiIntegrationService } from '@/server/services/ai-integration';
import { advancedSecurityService } from '@/server/services/advanced-security';
import { performanceOptimizationService } from '@/server/services/performance-optimization';
import { monitoringAlertsService } from '@/server/services/monitoring-alerts';

// Request schemas
const BatchRequestSchema = z.object({
  requests: z.array(z.object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    time: z.string(),
    location: z.string(),
    lang: z.enum(['ne', 'hi', 'en']).default('ne'),
    ayanamsa: z.number().default(1),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    tags: z.array(z.string()).default([]),
  })),
  batchId: z.string().optional(),
});

const AnalyticsRequestSchema = z.object({
  type: z.enum(['api_call', 'user_action', 'error', 'performance', 'business']),
  category: z.string(),
  action: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  duration: z.number().optional(),
  success: z.boolean().default(true),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.object({
    country: z.string(),
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

const MobileOptimizationRequestSchema = z.object({
  data: z.any(),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.enum(['ios', 'android', 'web', 'unknown']),
    version: z.string(),
    screenSize: z.object({
      width: z.number(),
      height: z.number(),
      density: z.number(),
    }),
    capabilities: z.object({
      touch: z.boolean(),
      geolocation: z.boolean(),
      camera: z.boolean(),
      offline: z.boolean(),
      pushNotifications: z.boolean(),
    }),
    network: z.object({
      type: z.enum(['wifi', 'cellular', 'unknown']),
      speed: z.enum(['slow', 'medium', 'fast']),
      offline: z.boolean(),
    }),
  }),
  responseType: z.enum(['kundli', 'dashas', 'panchang', 'general']).default('general'),
});

const AIRequestSchema = z.object({
  userId: z.string(),
  horoscopeData: z.any(),
  userBehavior: z.any().optional(),
  timeframe: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  userPreferences: z.any().optional(),
});

const SecurityRequestSchema = z.object({
  action: z.enum(['login', 'logout', 'validate_session', 'create_session']),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  deviceId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  location: z.object({
    country: z.string(),
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  permissions: z.array(z.string()).optional(),
});

const PerformanceRequestSchema = z.object({
  data: z.any(),
  requestType: z.string(),
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

const MonitoringRequestSchema = z.object({
  action: z.enum(['get_dashboard', 'get_alerts', 'acknowledge_alert', 'resolve_alert', 'get_uptime']),
  alertId: z.string().optional(),
  acknowledgedBy: z.string().optional(),
  resolvedBy: z.string().optional(),
  service: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, action, ...data } = body;

    switch (service) {
      case 'batch':
        return await handleBatchRequest(action, data);
      case 'realtime':
        return await handleRealtimeRequest(action, data);
      case 'analytics':
        return await handleAnalyticsRequest(action, data);
      case 'mobile':
        return await handleMobileRequest(action, data);
      case 'ai':
        return await handleAIRequest(action, data);
      case 'security':
        return await handleSecurityRequest(action, data);
      case 'performance':
        return await handlePerformanceRequest(action, data);
      case 'monitoring':
        return await handleMonitoringRequest(action, data);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid service',
          message: 'Service must be one of: batch, realtime, analytics, mobile, ai, security, performance, monitoring',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Advanced API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const action = searchParams.get('action');

    switch (service) {
      case 'health':
        return await handleHealthCheck();
      case 'status':
        return await handleStatusCheck();
      case 'metrics':
        return await handleMetricsRequest();
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid service',
          message: 'Service must be one of: health, status, metrics',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Advanced API GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Handler functions
async function handleBatchRequest(action: string, data: any) {
  switch (action) {
    case 'process':
      const batchData = BatchRequestSchema.parse(data);
      const results = await batchProcessor.processBatch(
        batchData.requests,
        batchData.batchId
      );
      return NextResponse.json({
        success: true,
        data: results,
        message: `Processed ${results.length} requests`,
      });

    case 'progress':
      const batchId = data.batchId;
      if (!batchId) {
        return NextResponse.json({
          success: false,
          error: 'Batch ID required',
        }, { status: 400 });
      }
      const progress = batchProcessor.getBatchProgress(batchId);
      return NextResponse.json({
        success: true,
        data: progress,
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: process, progress',
      }, { status: 400 });
  }
}

async function handleRealtimeRequest(action: string, data: any) {
  switch (action) {
    case 'subscribe':
      // This would handle WebSocket subscription
      return NextResponse.json({
        success: true,
        message: 'Subscription handled via WebSocket',
      });

    case 'unsubscribe':
      // This would handle WebSocket unsubscription
      return NextResponse.json({
        success: true,
        message: 'Unsubscription handled via WebSocket',
      });

    case 'force_update':
      const sessionId = data.sessionId;
      if (!sessionId) {
        return NextResponse.json({
          success: false,
          error: 'Session ID required',
        }, { status: 400 });
      }
      await realtimeUpdateService.forceUpdate(sessionId);
      return NextResponse.json({
        success: true,
        message: 'Force update completed',
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: subscribe, unsubscribe, force_update',
      }, { status: 400 });
  }
}

async function handleAnalyticsRequest(action: string, data: any) {
  switch (action) {
    case 'track':
      const eventData = AnalyticsRequestSchema.parse(data);
      await analyticsService.trackEvent(eventData);
      return NextResponse.json({
        success: true,
        message: 'Event tracked successfully',
      });

    case 'get_metrics':
      const startDate = data.startDate ? new Date(data.startDate) : undefined;
      const endDate = data.endDate ? new Date(data.endDate) : undefined;
      const filters = data.filters || {};
      const metrics = await analyticsService.getMetrics(startDate, endDate, filters);
      return NextResponse.json({
        success: true,
        data: metrics,
      });

    case 'get_performance':
      const performanceMetrics = await analyticsService.getPerformanceMetrics();
      return NextResponse.json({
        success: true,
        data: performanceMetrics,
      });

    case 'get_business':
      const businessMetrics = await analyticsService.getBusinessMetrics();
      return NextResponse.json({
        success: true,
        data: businessMetrics,
      });

    case 'export':
      const exportStartDate = new Date(data.startDate);
      const exportEndDate = new Date(data.endDate);
      const format = data.format || 'json';
      const exportData = await analyticsService.exportData(exportStartDate, exportEndDate, format);
      return NextResponse.json({
        success: true,
        data: exportData,
        format,
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: track, get_metrics, get_performance, get_business, export',
      }, { status: 400 });
  }
}

async function handleMobileRequest(action: string, data: any) {
  switch (action) {
    case 'optimize':
      const mobileData = MobileOptimizationRequestSchema.parse(data);
      const optimizedData = await mobileOptimizationService.optimizeResponse(
        mobileData.data,
        mobileData.deviceInfo,
        mobileData.responseType
      );
      return NextResponse.json({
        success: true,
        data: optimizedData,
      });

    case 'get_offline':
      const userId = data.userId;
      const deviceInfo = data.deviceInfo;
      if (!userId || !deviceInfo) {
        return NextResponse.json({
          success: false,
          error: 'User ID and device info required',
        }, { status: 400 });
      }
      const offlineData = await mobileOptimizationService.getOfflineData(userId, deviceInfo);
      return NextResponse.json({
        success: true,
        data: offlineData,
      });

    case 'sync_offline':
      const syncUserId = data.userId;
      const syncDeviceInfo = data.deviceInfo;
      const syncData = data.data;
      if (!syncUserId || !syncDeviceInfo || !syncData) {
        return NextResponse.json({
          success: false,
          error: 'User ID, device info, and data required',
        }, { status: 400 });
      }
      await mobileOptimizationService.syncOfflineData(syncUserId, syncDeviceInfo, syncData);
      return NextResponse.json({
        success: true,
        message: 'Offline data synced successfully',
      });

    case 'send_notification':
      const notifUserId = data.userId;
      const notifDeviceInfo = data.deviceInfo;
      const title = data.title;
      const body = data.body;
      const notifData = data.data || {};
      if (!notifUserId || !notifDeviceInfo || !title || !body) {
        return NextResponse.json({
          success: false,
          error: 'User ID, device info, title, and body required',
        }, { status: 400 });
      }
      const sent = await mobileOptimizationService.sendPushNotification(
        notifUserId,
        title,
        body,
        notifData,
        notifDeviceInfo
      );
      return NextResponse.json({
        success: sent,
        message: sent ? 'Notification sent successfully' : 'Failed to send notification',
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: optimize, get_offline, sync_offline, send_notification',
      }, { status: 400 });
  }
}

async function handleAIRequest(action: string, data: any) {
  switch (action) {
    case 'generate_insights':
      const insightsData = AIRequestSchema.parse(data);
      const insights = await aiIntegrationService.generateInsights(
        insightsData.userId,
        insightsData.horoscopeData,
        insightsData.userBehavior
      );
      return NextResponse.json({
        success: true,
        data: insights,
      });

    case 'generate_predictions':
      const predictionsData = AIRequestSchema.parse(data);
      if (!predictionsData.timeframe) {
        return NextResponse.json({
          success: false,
          error: 'Timeframe required for predictions',
        }, { status: 400 });
      }
      const predictions = await aiIntegrationService.generatePredictions(
        predictionsData.userId,
        predictionsData.horoscopeData,
        {
          start: new Date(predictionsData.timeframe.start),
          end: new Date(predictionsData.timeframe.end),
        }
      );
      return NextResponse.json({
        success: true,
        data: predictions,
      });

    case 'get_recommendations':
      const recData = AIRequestSchema.parse(data);
      const recommendations = await aiIntegrationService.getPersonalizedRecommendations(
        recData.userId,
        recData.horoscopeData,
        recData.userPreferences
      );
      return NextResponse.json({
        success: true,
        data: recommendations,
      });

    case 'get_personalization':
      const userId = data.userId;
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'User ID required',
        }, { status: 400 });
      }
      const personalization = await aiIntegrationService.getPersonalizationProfile(userId);
      return NextResponse.json({
        success: true,
        data: personalization,
      });

    case 'update_personalization':
      const updateData = AIRequestSchema.parse(data);
      await aiIntegrationService.updatePersonalization(
        updateData.userId,
        updateData.userPreferences
      );
      return NextResponse.json({
        success: true,
        message: 'Personalization updated successfully',
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: generate_insights, generate_predictions, get_recommendations, get_personalization, update_personalization',
      }, { status: 400 });
  }
}

async function handleSecurityRequest(action: string, data: any) {
  switch (action) {
    case 'create_session':
      const sessionData = SecurityRequestSchema.parse(data);
      if (!sessionData.userId || !sessionData.deviceId) {
        return NextResponse.json({
          success: false,
          error: 'User ID and device ID required',
        }, { status: 400 });
      }
      const session = await advancedSecurityService.createSession(
        sessionData.userId,
        sessionData.deviceId,
        sessionData.ipAddress,
        sessionData.userAgent,
        sessionData.location,
        sessionData.permissions || []
      );
      return NextResponse.json({
        success: true,
        data: session,
      });

    case 'validate_session':
      const sessionId = data.sessionId;
      if (!sessionId) {
        return NextResponse.json({
          success: false,
          error: 'Session ID required',
        }, { status: 400 });
      }
      const validatedSession = await advancedSecurityService.validateSession(sessionId);
      return NextResponse.json({
        success: true,
        data: validatedSession,
      });

    case 'invalidate_session':
      const invSessionId = data.sessionId;
      const invUserId = data.userId;
      if (!invSessionId) {
        return NextResponse.json({
          success: false,
          error: 'Session ID required',
        }, { status: 400 });
      }
      await advancedSecurityService.invalidateSession(invSessionId, invUserId);
      return NextResponse.json({
        success: true,
        message: 'Session invalidated successfully',
      });

    case 'check_rate_limit':
      const rateLimitKey = data.key;
      const rateLimitConfig = data.config;
      if (!rateLimitKey || !rateLimitConfig) {
        return NextResponse.json({
          success: false,
          error: 'Key and config required',
        }, { status: 400 });
      }
      const rateLimitResult = await advancedSecurityService.checkRateLimit(rateLimitKey, rateLimitConfig);
      return NextResponse.json({
        success: true,
        data: rateLimitResult,
      });

    case 'get_metrics':
      const securityMetrics = await advancedSecurityService.getSecurityMetrics();
      return NextResponse.json({
        success: true,
        data: securityMetrics,
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: create_session, validate_session, invalidate_session, check_rate_limit, get_metrics',
      }, { status: 400 });
  }
}

async function handlePerformanceRequest(action: string, data: any) {
  switch (action) {
    case 'optimize':
      const perfData = PerformanceRequestSchema.parse(data);
      const optimizedData = await performanceOptimizationService.optimizeResponse(
        perfData.data,
        perfData.requestType,
        perfData.userLocation
      );
      return NextResponse.json({
        success: true,
        data: optimizedData,
      });

    case 'get_metrics':
      const metrics = await performanceOptimizationService.getPerformanceMetrics();
      return NextResponse.json({
        success: true,
        data: metrics,
      });

    case 'get_trends':
      const hours = data.hours || 24;
      const trends = performanceOptimizationService.getPerformanceTrends(hours);
      return NextResponse.json({
        success: true,
        data: trends,
      });

    case 'optimize_database':
      await performanceOptimizationService.optimizeDatabaseQueries();
      return NextResponse.json({
        success: true,
        message: 'Database optimization completed',
      });

    case 'optimize_cache':
      await performanceOptimizationService.optimizeCacheStrategy();
      return NextResponse.json({
        success: true,
        message: 'Cache optimization completed',
      });

    case 'get_cdn_status':
      const cdnStatus = await performanceOptimizationService.getCDNStatus();
      return NextResponse.json({
        success: true,
        data: cdnStatus,
      });

    case 'get_edge_status':
      const edgeStatus = await performanceOptimizationService.getEdgeStatus();
      return NextResponse.json({
        success: true,
        data: edgeStatus,
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: optimize, get_metrics, get_trends, optimize_database, optimize_cache, get_cdn_status, get_edge_status',
      }, { status: 400 });
  }
}

async function handleMonitoringRequest(action: string, data: any) {
  switch (action) {
    case 'get_dashboard':
      const dashboardData = await monitoringAlertsService.getDashboardData();
      return NextResponse.json({
        success: true,
        data: dashboardData,
      });

    case 'get_alerts':
      const alerts = monitoringAlertsService.getAllAlerts();
      return NextResponse.json({
        success: true,
        data: alerts,
      });

    case 'acknowledge_alert':
      const alertId = data.alertId;
      const acknowledgedBy = data.acknowledgedBy;
      if (!alertId || !acknowledgedBy) {
        return NextResponse.json({
          success: false,
          error: 'Alert ID and acknowledged by required',
        }, { status: 400 });
      }
      const acknowledged = await monitoringAlertsService.acknowledgeAlert(alertId, acknowledgedBy);
      return NextResponse.json({
        success: acknowledged,
        message: acknowledged ? 'Alert acknowledged successfully' : 'Failed to acknowledge alert',
      });

    case 'resolve_alert':
      const resolveAlertId = data.alertId;
      const resolvedBy = data.resolvedBy;
      if (!resolveAlertId || !resolvedBy) {
        return NextResponse.json({
          success: false,
          error: 'Alert ID and resolved by required',
        }, { status: 400 });
      }
      const resolved = await monitoringAlertsService.resolveAlert(resolveAlertId, resolvedBy);
      return NextResponse.json({
        success: resolved,
        message: resolved ? 'Alert resolved successfully' : 'Failed to resolve alert',
      });

    case 'get_uptime':
      const service = data.service;
      if (!service) {
        return NextResponse.json({
          success: false,
          error: 'Service name required',
        }, { status: 400 });
      }
      const uptime = await monitoringAlertsService.getUptimeReport(service);
      return NextResponse.json({
        success: true,
        data: uptime,
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be: get_dashboard, get_alerts, acknowledge_alert, resolve_alert, get_uptime',
      }, { status: 400 });
  }
}

async function handleHealthCheck() {
  try {
    const healthChecks = await Promise.allSettled([
      analyticsService.getHealthStatus(),
      aiIntegrationService.getHealthStatus(),
      performanceOptimizationService.getHealthStatus(),
      monitoringAlertsService.getHealthStatus(),
    ]);

    const results = healthChecks.map((result, index) => ({
      service: ['analytics', 'ai', 'performance', 'monitoring'][index],
      status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      details: result.status === 'fulfilled' ? result.value : result.reason,
    }));

    const allHealthy = results.every(r => r.status === 'healthy');

    return NextResponse.json({
      success: allHealthy,
      status: allHealthy ? 'healthy' : 'unhealthy',
      services: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

async function handleStatusCheck() {
  try {
    const status = {
      services: {
        analytics: 'running',
        ai: 'running',
        performance: 'running',
        monitoring: 'running',
        security: 'running',
        mobile: 'running',
        realtime: 'running',
        batch: 'running',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json({
      success: true,
      data: status,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleMetricsRequest() {
  try {
    const metrics = await Promise.allSettled([
      analyticsService.getMetrics(),
      performanceOptimizationService.getPerformanceMetrics(),
      monitoringAlertsService.getDashboardData(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        analytics: metrics[0].status === 'fulfilled' ? metrics[0].value : null,
        performance: metrics[1].status === 'fulfilled' ? metrics[1].value : null,
        monitoring: metrics[2].status === 'fulfilled' ? metrics[2].value : null,
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
