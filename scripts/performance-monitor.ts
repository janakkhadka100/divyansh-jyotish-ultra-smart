#!/usr/bin/env tsx

import { performanceGeocodingService } from '../src/server/services/performance-geo';
import { cacheService } from '../src/server/services/cache';

async function monitorPerformance() {
  console.log('🔍 Starting performance monitoring...');
  
  try {
    // Get performance metrics
    const metrics = performanceGeocodingService.getPerformanceMetrics();
    
    // Get health check
    const health = await performanceGeocodingService.getHealthCheck();
    
    // Get cache stats
    const cacheStats = cacheService.getStats();
    
    // Get system info
    const systemInfo = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };
    
    console.log('\n📊 Performance Metrics:');
    console.log(`  Total Requests: ${metrics.totalRequests}`);
    console.log(`  Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`  Cache Hit Rate: ${metrics.cacheHitRate.toFixed(2)}%`);
    console.log(`  Error Rate: ${metrics.errorRate.toFixed(2)}%`);
    console.log(`  Throughput: ${metrics.throughput.toFixed(2)} req/s`);
    console.log(`  Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🏥 Health Status:');
    console.log(`  Status: ${health.status.toUpperCase()}`);
    console.log(`  Recommendations: ${health.recommendations.length}`);
    health.recommendations.forEach((rec, index) => {
      console.log(`    ${index + 1}. ${rec}`);
    });
    
    console.log('\n💾 Cache Statistics:');
    console.log(`  Hits: ${cacheStats.hits}`);
    console.log(`  Misses: ${cacheStats.misses}`);
    console.log(`  Sets: ${cacheStats.sets}`);
    console.log(`  Deletes: ${cacheStats.deletes}`);
    console.log(`  Errors: ${cacheStats.errors}`);
    
    console.log('\n🖥️ System Information:');
    console.log(`  Node Version: ${systemInfo.nodeVersion}`);
    console.log(`  Platform: ${systemInfo.platform}`);
    console.log(`  Uptime: ${Math.floor(systemInfo.uptime / 60)} minutes`);
    console.log(`  Memory Usage: ${(systemInfo.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Memory Total: ${(systemInfo.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    
    // Performance alerts
    const alerts = [];
    
    if (metrics.averageResponseTime > 2000) {
      alerts.push('⚠️  High response time detected');
    }
    
    if (metrics.cacheHitRate < 50) {
      alerts.push('⚠️  Low cache hit rate');
    }
    
    if (metrics.errorRate > 5) {
      alerts.push('⚠️  High error rate');
    }
    
    if (metrics.memoryUsage > 100 * 1024 * 1024) {
      alerts.push('⚠️  High memory usage');
    }
    
    if (alerts.length > 0) {
      console.log('\n🚨 Performance Alerts:');
      alerts.forEach(alert => console.log(`  ${alert}`));
    } else {
      console.log('\n✅ All performance metrics are healthy');
    }
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    if (metrics.cacheHitRate < 70) {
      console.log('  • Consider increasing cache TTL');
      console.log('  • Review cache strategy');
    }
    
    if (metrics.averageResponseTime > 1000) {
      console.log('  • Enable CDN for better performance');
      console.log('  • Consider edge computing');
      console.log('  • Optimize database queries');
    }
    
    if (metrics.errorRate > 2) {
      console.log('  • Investigate error sources');
      console.log('  • Improve error handling');
      console.log('  • Add retry mechanisms');
    }
    
    if (metrics.throughput < 100) {
      console.log('  • Consider horizontal scaling');
      console.log('  • Optimize connection pooling');
      console.log('  • Review resource allocation');
    }
    
  } catch (error) {
    console.error('❌ Error monitoring performance:', error);
    process.exit(1);
  } finally {
    await cacheService.disconnect();
  }
}

monitorPerformance();




