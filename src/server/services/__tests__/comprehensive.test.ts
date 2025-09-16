import { enhancedGeocodingService } from '../enhanced-geo';
import { offlineGeocodingService } from '../offline-geo';
import { multiLanguageGeocodingService } from '../multilang-geo';
import { realTimeGeocodingService } from '../realtime-geo';
import { privacyGeocodingService } from '../privacy-geo';
import { performanceGeocodingService } from '../performance-geo';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Comprehensive Geocoding System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Geocoding Service', () => {
    it('should handle complete geocoding workflow', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Bagmati Province, Nepal',
            address: {
              city: 'Kathmandu',
              country: 'Nepal',
            },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await enhancedGeocodingService.geocode('Kathmandu, Nepal', {
        useCache: true,
        includeIntelligence: true,
        priority: 'high',
      });

      expect(result).toMatchObject({
        lat: 27.7172,
        lon: 85.3240,
        tzId: 'Asia/Kathmandu',
        city: 'Kathmandu',
        country: 'Nepal',
        confidence: expect.any(Number),
        source: 'osm',
        cached: false,
      });

      expect(result.intelligence).toBeDefined();
      expect(result.intelligence?.culturalContext).toBeDefined();
    });

    it('should handle batch processing', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Nepal',
            address: { city: 'Kathmandu', country: 'Nepal' },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const requests = [
        { id: '1', place: 'Kathmandu, Nepal', priority: 'high' as const },
        { id: '2', place: 'Pokhara, Nepal', priority: 'normal' as const },
      ];

      const results = await enhancedGeocodingService.batchGeocode(requests, {
        maxConcurrency: 2,
        useCache: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[0].place).toBe('Kathmandu, Nepal');
      expect(results[0].result).toBeDefined();
    });
  });

  describe('Offline Geocoding Service', () => {
    it('should initialize and search offline', async () => {
      await offlineGeocodingService.initialize();
      
      const results = await offlineGeocodingService.search('Kathmandu');
      expect(results.length).toBeGreaterThan(0);
      
      const count = await offlineGeocodingService.getLocationCount();
      expect(count).toBeGreaterThan(0);
    });

    it('should search by coordinates', async () => {
      await offlineGeocodingService.initialize();
      
      const results = await offlineGeocodingService.searchByCoordinates(27.7172, 85.3240, 10);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].distance).toBeDefined();
    });
  });

  describe('Multi-language Geocoding Service', () => {
    it('should support multiple languages', async () => {
      const languages = await multiLanguageGeocodingService.getSupportedLanguages();
      expect(languages.length).toBeGreaterThan(0);
      expect(languages.some(lang => lang.code === 'ne')).toBe(true);
    });

    it('should format addresses in different languages', async () => {
      const result = {
        lat: 27.7172,
        lon: 85.3240,
        city: 'Kathmandu',
        country: 'Nepal',
        tzId: 'Asia/Kathmandu',
        tzOffsetMinutes: 345,
      };

      const formatted = await multiLanguageGeocodingService.formatAddress(result, 'ne', 'medium');
      expect(formatted).toContain('Kathmandu');
    });
  });

  describe('Real-time Geocoding Service', () => {
    it('should handle real-time updates', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Nepal',
            address: { city: 'Kathmandu', country: 'Nepal' },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await realTimeGeocodingService.geocode('Kathmandu, Nepal', {
        includeWeather: false,
        includeTraffic: false,
      });

      expect(result).toMatchObject({
        lat: 27.7172,
        lon: 85.3240,
        lastUpdated: expect.any(Date),
        dataSource: 'live',
      });
    });
  });

  describe('Privacy Geocoding Service', () => {
    it('should handle privacy settings', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Nepal',
            address: { city: 'Kathmandu', country: 'Nepal' },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await privacyGeocodingService.geocode('Kathmandu, Nepal', {
        userId: 'test-user',
        privacyLevel: 'high',
      });

      expect(result).toMatchObject({
        lat: expect.any(Number),
        lon: expect.any(Number),
        anonymized: expect.any(Boolean),
        dataHash: expect.any(String),
        privacyLevel: 'high',
      });
    });

    it('should generate compliance report', async () => {
      const report = await privacyGeocodingService.getPrivacyComplianceReport();
      expect(report).toMatchObject({
        totalRequests: expect.any(Number),
        anonymizedRequests: expect.any(Number),
        dataRetentionCompliance: expect.any(Number),
        gdprCompliance: expect.any(Number),
        auditLogs: expect.any(Array),
      });
    });
  });

  describe('Performance Geocoding Service', () => {
    it('should track performance metrics', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Nepal',
            address: { city: 'Kathmandu', country: 'Nepal' },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await performanceGeocodingService.geocode('Kathmandu, Nepal', {
        optimizationLevel: 'basic',
        useCache: true,
      });

      expect(result).toMatchObject({
        lat: 27.7172,
        lon: 85.3240,
        performanceMetrics: {
          responseTime: expect.any(Number),
          cacheHit: expect.any(Boolean),
          optimizationLevel: 'basic',
          memoryUsed: expect.any(Number),
          cpuTime: expect.any(Number),
        },
      });
    });

    it('should provide health check', async () => {
      const health = await performanceGeocodingService.getHealthCheck();
      expect(health).toMatchObject({
        status: expect.stringMatching(/healthy|degraded|unhealthy/),
        metrics: expect.any(Object),
        recommendations: expect.any(Array),
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with all services together', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Nepal',
            address: { city: 'Kathmandu', country: 'Nepal' },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Test enhanced geocoding
      const enhancedResult = await enhancedGeocodingService.geocode('Kathmandu, Nepal');
      expect(enhancedResult).toBeDefined();

      // Test offline geocoding
      await offlineGeocodingService.initialize();
      const offlineResult = await offlineGeocodingService.search('Kathmandu');
      expect(offlineResult.length).toBeGreaterThan(0);

      // Test multi-language
      const languages = await multiLanguageGeocodingService.getSupportedLanguages();
      expect(languages.length).toBeGreaterThan(0);

      // Test privacy
      const privacyResult = await privacyGeocodingService.geocode('Kathmandu, Nepal');
      expect(privacyResult).toBeDefined();

      // Test performance
      const performanceResult = await performanceGeocodingService.geocode('Kathmandu, Nepal');
      expect(performanceResult).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(enhancedGeocodingService.geocode('Invalid Place')).rejects.toThrow();
    });

    it('should handle offline service errors', async () => {
      await expect(offlineGeocodingService.search('')).rejects.toThrow();
    });

    it('should handle privacy service errors', async () => {
      await expect(privacyGeocodingService.geocode('')).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Nepal',
            address: { city: 'Kathmandu', country: 'Nepal' },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const promises = Array(10).fill(null).map(() => 
        enhancedGeocodingService.geocode('Kathmandu, Nepal')
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(result => result.lat === 27.7172)).toBe(true);
    });

    it('should track performance metrics correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '27.7172',
            lon: '85.3240',
            display_name: 'Kathmandu, Nepal',
            address: { city: 'Kathmandu', country: 'Nepal' },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await performanceGeocodingService.geocode('Kathmandu, Nepal');
      await performanceGeocodingService.geocode('Pokhara, Nepal');

      const metrics = performanceGeocodingService.getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });
});



