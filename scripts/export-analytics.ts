#!/usr/bin/env tsx

import { enhancedGeocodingService } from '../src/server/services/enhanced-geo';
import { performanceGeocodingService } from '../src/server/services/performance-geo';
import { privacyGeocodingService } from '../src/server/services/privacy-geo';
import fs from 'fs';
import path from 'path';

async function exportAnalytics() {
  console.log('📊 Exporting analytics data...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(process.cwd(), 'exports');
    
    // Create exports directory if it doesn't exist
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Export enhanced geocoding analytics
    const enhancedAnalytics = enhancedGeocodingService.getAnalytics();
    const enhancedFile = path.join(exportDir, `enhanced-analytics-${timestamp}.json`);
    fs.writeFileSync(enhancedFile, JSON.stringify(enhancedAnalytics, null, 2));
    console.log(`✅ Enhanced analytics exported to: ${enhancedFile}`);
    
    // Export performance metrics
    const performanceMetrics = performanceGeocodingService.getPerformanceMetrics();
    const performanceFile = path.join(exportDir, `performance-metrics-${timestamp}.json`);
    fs.writeFileSync(performanceFile, JSON.stringify(performanceMetrics, null, 2));
    console.log(`✅ Performance metrics exported to: ${performanceFile}`);
    
    // Export privacy compliance report
    const privacyReport = await privacyGeocodingService.getPrivacyComplianceReport();
    const privacyFile = path.join(exportDir, `privacy-compliance-${timestamp}.json`);
    fs.writeFileSync(privacyFile, JSON.stringify(privacyReport, null, 2));
    console.log(`✅ Privacy compliance report exported to: ${privacyFile}`);
    
    // Create summary report
    const summary = {
      timestamp: new Date().toISOString(),
      enhancedAnalytics: {
        totalRequests: enhancedAnalytics.totalRequests,
        cacheHitRate: enhancedAnalytics.cacheHitRate,
        averageResponseTime: enhancedAnalytics.averageResponseTime,
        errorRate: enhancedAnalytics.errorRate,
      },
      performanceMetrics: {
        totalRequests: performanceMetrics.totalRequests,
        averageResponseTime: performanceMetrics.averageResponseTime,
        cacheHitRate: performanceMetrics.cacheHitRate,
        throughput: performanceMetrics.throughput,
      },
      privacyCompliance: {
        totalRequests: privacyReport.totalRequests,
        anonymizedRequests: privacyReport.anonymizedRequests,
        gdprCompliance: privacyReport.gdprCompliance,
        dataRetentionCompliance: privacyReport.dataRetentionCompliance,
      },
    };
    
    const summaryFile = path.join(exportDir, `analytics-summary-${timestamp}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✅ Summary report exported to: ${summaryFile}`);
    
    console.log('\n📈 Analytics Export Summary:');
    console.log(`  Total Requests: ${enhancedAnalytics.totalRequests}`);
    console.log(`  Cache Hit Rate: ${enhancedAnalytics.cacheHitRate.toFixed(2)}%`);
    console.log(`  Average Response Time: ${enhancedAnalytics.averageResponseTime.toFixed(2)}ms`);
    console.log(`  Error Rate: ${enhancedAnalytics.errorRate.toFixed(2)}%`);
    console.log(`  Throughput: ${performanceMetrics.throughput.toFixed(2)} req/s`);
    console.log(`  GDPR Compliance: ${privacyReport.gdprCompliance.toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Error exporting analytics:', error);
    process.exit(1);
  }
}

exportAnalytics();


