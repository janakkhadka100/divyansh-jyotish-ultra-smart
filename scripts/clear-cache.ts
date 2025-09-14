#!/usr/bin/env tsx

import { cacheService } from '../src/server/services/cache';

async function clearCache() {
  console.log('🧹 Clearing all caches...');
  
  try {
    // Clear all cache types
    await cacheService.clear('geocoding');
    await cacheService.clear('privacy');
    await cacheService.clear('realtime');
    await cacheService.clear('translation');
    await cacheService.clear('analytics');
    
    console.log('✅ All caches cleared successfully');
    
    // Show cache stats
    const stats = cacheService.getStats();
    console.log('📊 Cache Statistics:');
    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Sets: ${stats.sets}`);
    console.log(`  Deletes: ${stats.deletes}`);
    console.log(`  Errors: ${stats.errors}`);
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  } finally {
    await cacheService.disconnect();
  }
}

clearCache();
