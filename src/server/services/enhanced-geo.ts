import { geocodingService as baseGeoService, GeocodingResult } from './geo';
import { cacheService } from './cache';
import crypto from 'crypto';

export interface BatchGeocodingRequest {
  id: string;
  place: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface BatchGeocodingResponse {
  id: string;
  place: string;
  result?: GeocodingResult;
  error?: string;
  cached: boolean;
  processingTime: number;
}

export interface GeocodingAnalytics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  popularLocations: Array<{
    place: string;
    count: number;
    lastAccessed: Date;
  }>;
  errorRate: number;
  providerUsage: {
    osm: number;
    google: number;
  };
}

export interface LocationIntelligence {
  populationDensity?: number;
  economicIndicators?: {
    gdpPerCapita?: number;
    costOfLiving?: number;
    developmentIndex?: number;
  };
  culturalContext?: {
    language: string;
    religion: string;
    timezone: string;
    currency: string;
  };
  administrativeInfo?: {
    country: string;
    state: string;
    city: string;
    postalCode?: string;
    countryCode: string;
  };
}

export interface AdvancedGeocodingResult extends GeocodingResult {
  intelligence?: LocationIntelligence;
  confidence: number;
  source: 'cache' | 'osm' | 'google' | 'fallback';
  processingTime: number;
  cached: boolean;
}

class EnhancedGeocodingService {
  private analytics: GeocodingAnalytics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    popularLocations: [],
    errorRate: 0,
    providerUsage: { osm: 0, google: 0 },
  };

  private responseTimes: number[] = [];
  private errors: number = 0;

  constructor() {
    this.loadAnalytics();
  }

  /**
   * Enhanced geocoding with caching, analytics, and intelligence
   */
  async geocode(
    place: string, 
    options: {
      provider?: 'osm' | 'google';
      useCache?: boolean;
      includeIntelligence?: boolean;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<AdvancedGeocodingResult> {
    const startTime = Date.now();
    const {
      provider = 'osm',
      useCache = true,
      includeIntelligence = false,
      priority = 'normal'
    } = options;

    this.analytics.totalRequests++;

    // Generate cache key
    const cacheKey = this.generateCacheKey(place, provider, includeIntelligence);

    // Try cache first
    if (useCache) {
      const cachedResult = await cacheService.get<AdvancedGeocodingResult>(cacheKey);
      if (cachedResult) {
        this.analytics.cacheHits++;
        this.updatePopularLocations(place);
        return {
          ...cachedResult,
          cached: true,
          processingTime: Date.now() - startTime,
        };
      }
    }

    this.analytics.cacheMisses++;

    try {
      // Get base geocoding result
      const baseResult = await baseGeoService.geocode(place, { provider });
      
      // Calculate confidence based on provider and result quality
      const confidence = this.calculateConfidence(baseResult, provider);

      // Get location intelligence if requested
      let intelligence: LocationIntelligence | undefined;
      if (includeIntelligence) {
        intelligence = await this.getLocationIntelligence(baseResult);
      }

      const result: AdvancedGeocodingResult = {
        ...baseResult,
        intelligence,
        confidence,
        source: provider,
        processingTime: Date.now() - startTime,
        cached: false,
      };

      // Cache the result
      if (useCache) {
        const ttl = this.getCacheTTL(priority);
        await cacheService.set(cacheKey, result, { ttl });
      }

      // Update analytics
      this.updateAnalytics(place, provider, Date.now() - startTime, false);
      this.updatePopularLocations(place);

      return result;
    } catch (error) {
      this.errors++;
      this.updateAnalytics(place, provider, Date.now() - startTime, true);
      
      // Try fallback if primary provider fails
      if (provider === 'google') {
        try {
          const fallbackResult = await baseGeoService.geocode(place, { provider: 'osm' });
          return {
            ...fallbackResult,
            confidence: 0.7,
            source: 'fallback',
            processingTime: Date.now() - startTime,
            cached: false,
          };
        } catch (fallbackError) {
          throw new Error(`Geocoding failed for both providers: ${error}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Batch geocoding for multiple locations
   */
  async batchGeocode(
    requests: BatchGeocodingRequest[],
    options: {
      maxConcurrency?: number;
      useCache?: boolean;
      includeIntelligence?: boolean;
    } = {}
  ): Promise<BatchGeocodingResponse[]> {
    const {
      maxConcurrency = 5,
      useCache = true,
      includeIntelligence = false
    } = options;

    const results: BatchGeocodingResponse[] = [];
    const semaphore = new Semaphore(maxConcurrency);

    const processRequest = async (request: BatchGeocodingRequest): Promise<BatchGeocodingResponse> => {
      const startTime = Date.now();
      
      try {
        await semaphore.acquire();
        
        const result = await this.geocode(request.place, {
          useCache,
          includeIntelligence,
          priority: request.priority,
        });

        return {
          id: request.id,
          place: request.place,
          result,
          cached: result.cached,
          processingTime: Date.now() - startTime,
        };
      } catch (error) {
        return {
          id: request.id,
          place: request.place,
          error: error instanceof Error ? error.message : 'Unknown error',
          cached: false,
          processingTime: Date.now() - startTime,
        };
      } finally {
        semaphore.release();
      }
    };

    // Process all requests
    const promises = requests.map(processRequest);
    const batchResults = await Promise.all(promises);

    return batchResults;
  }

  /**
   * Get location intelligence data
   */
  private async getLocationIntelligence(result: GeocodingResult): Promise<LocationIntelligence> {
    // This would integrate with external APIs for real data
    // For now, we'll return mock data based on location
    const intelligence: LocationIntelligence = {
      culturalContext: {
        language: this.getLanguageByCountry(result.country || ''),
        religion: this.getReligionByCountry(result.country || ''),
        timezone: result.tzId,
        currency: this.getCurrencyByCountry(result.country || ''),
      },
      administrativeInfo: {
        country: result.country || '',
        state: result.city || '',
        city: result.city || '',
        countryCode: this.getCountryCode(result.country || ''),
      },
    };

    // Add population density if available
    if (result.city) {
      intelligence.populationDensity = await this.getPopulationDensity(result.city, result.country || '');
    }

    return intelligence;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(result: GeocodingResult, provider: string): number {
    let confidence = 0.5; // Base confidence

    // Provider confidence
    if (provider === 'google') confidence += 0.3;
    else if (provider === 'osm') confidence += 0.2;

    // Result quality indicators
    if (result.city && result.country) confidence += 0.2;
    if (result.displayName && result.displayName.length > 10) confidence += 0.1;

    // Coordinate precision
    const latPrecision = result.lat.toString().split('.')[1]?.length || 0;
    const lonPrecision = result.lon.toString().split('.')[1]?.length || 0;
    if (latPrecision >= 4 && lonPrecision >= 4) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(place: string, provider: string, includeIntelligence: boolean): string {
    const hash = crypto.createHash('md5').update(`${place}:${provider}:${includeIntelligence}`).digest('hex');
    return `geocoding:${hash}`;
  }

  /**
   * Get cache TTL based on priority
   */
  private getCacheTTL(priority: string): number {
    switch (priority) {
      case 'high': return 1800; // 30 minutes
      case 'normal': return 3600; // 1 hour
      case 'low': return 7200; // 2 hours
      default: return 3600;
    }
  }

  /**
   * Update analytics
   */
  private updateAnalytics(place: string, provider: string, responseTime: number, isError: boolean): void {
    this.responseTimes.push(responseTime);
    this.analytics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    
    if (isError) {
      this.errors++;
    }

    this.analytics.errorRate = this.errors / this.analytics.totalRequests;
    this.analytics.providerUsage[provider as keyof typeof this.analytics.providerUsage]++;
  }

  /**
   * Update popular locations
   */
  private updatePopularLocations(place: string): void {
    const existing = this.analytics.popularLocations.find(loc => loc.place === place);
    if (existing) {
      existing.count++;
      existing.lastAccessed = new Date();
    } else {
      this.analytics.popularLocations.push({
        place,
        count: 1,
        lastAccessed: new Date(),
      });
    }

    // Keep only top 100 locations
    this.analytics.popularLocations.sort((a, b) => b.count - a.count);
    this.analytics.popularLocations = this.analytics.popularLocations.slice(0, 100);
  }

  /**
   * Get analytics data
   */
  getAnalytics(): GeocodingAnalytics {
    return { ...this.analytics };
  }

  /**
   * Clear analytics
   */
  clearAnalytics(): void {
    this.analytics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      popularLocations: [],
      errorRate: 0,
      providerUsage: { osm: 0, google: 0 },
    };
    this.responseTimes = [];
    this.errors = 0;
  }

  /**
   * Load analytics from cache
   */
  private async loadAnalytics(): Promise<void> {
    try {
      const cached = await cacheService.get<GeocodingAnalytics>('analytics');
      if (cached) {
        this.analytics = cached;
      }
    } catch (error) {
      console.warn('Failed to load analytics from cache:', error);
    }
  }

  /**
   * Save analytics to cache
   */
  async saveAnalytics(): Promise<void> {
    try {
      await cacheService.set('analytics', this.analytics, { ttl: 86400 }); // 24 hours
    } catch (error) {
      console.warn('Failed to save analytics to cache:', error);
    }
  }

  // Helper methods for location intelligence
  private getLanguageByCountry(country: string): string {
    const languageMap: Record<string, string> = {
      'Nepal': 'ne',
      'India': 'hi',
      'United States': 'en',
      'United Kingdom': 'en',
      'China': 'zh',
      'Japan': 'ja',
    };
    return languageMap[country] || 'en';
  }

  private getReligionByCountry(country: string): string {
    const religionMap: Record<string, string> = {
      'Nepal': 'Hinduism',
      'India': 'Hinduism',
      'United States': 'Christianity',
      'United Kingdom': 'Christianity',
      'China': 'Buddhism',
      'Japan': 'Buddhism',
    };
    return religionMap[country] || 'Unknown';
  }

  private getCurrencyByCountry(country: string): string {
    const currencyMap: Record<string, string> = {
      'Nepal': 'NPR',
      'India': 'INR',
      'United States': 'USD',
      'United Kingdom': 'GBP',
      'China': 'CNY',
      'Japan': 'JPY',
    };
    return currencyMap[country] || 'USD';
  }

  private getCountryCode(country: string): string {
    const codeMap: Record<string, string> = {
      'Nepal': 'NP',
      'India': 'IN',
      'United States': 'US',
      'United Kingdom': 'GB',
      'China': 'CN',
      'Japan': 'JP',
    };
    return codeMap[country] || 'XX';
  }

  private async getPopulationDensity(city: string, country: string): Promise<number> {
    // Mock implementation - would integrate with real population data API
    return Math.floor(Math.random() * 10000) + 1000;
  }
}

// Semaphore class for concurrency control
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

// Export singleton instance
export const enhancedGeocodingService = new EnhancedGeocodingService();

// Export class for testing
export { EnhancedGeocodingService };



