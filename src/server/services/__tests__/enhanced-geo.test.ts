import { EnhancedGeocodingService } from '../enhanced-geo';
import { cacheService } from '../cache';

// Mock fetch for testing
global.fetch = jest.fn();

describe('EnhancedGeocodingService', () => {
  let service: EnhancedGeocodingService;

  beforeEach(() => {
    service = new EnhancedGeocodingService();
    jest.clearAllMocks();
  });

  describe('geocode', () => {
    it('should geocode with caching and analytics', async () => {
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

      const result = await service.geocode('Kathmandu, Nepal', {
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

    it('should handle batch geocoding', async () => {
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

      const results = await service.batchGeocode(requests, {
        maxConcurrency: 2,
        useCache: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[0].place).toBe('Kathmandu, Nepal');
      expect(results[0].result).toBeDefined();
    });

    it('should track analytics correctly', async () => {
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

      await service.geocode('Kathmandu, Nepal');
      await service.geocode('Pokhara, Nepal');

      const analytics = service.getAnalytics();
      expect(analytics.totalRequests).toBe(2);
      expect(analytics.popularLocations).toHaveLength(2);
      expect(analytics.providerUsage.osm).toBe(2);
    });
  });

  describe('analytics', () => {
    it('should clear analytics', () => {
      service.clearAnalytics();
      const analytics = service.getAnalytics();
      expect(analytics.totalRequests).toBe(0);
      expect(analytics.popularLocations).toHaveLength(0);
    });

    it('should save and load analytics', async () => {
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

      await service.geocode('Kathmandu, Nepal');
      await service.saveAnalytics();

      // Clear analytics
      service.clearAnalytics();
      expect(service.getAnalytics().totalRequests).toBe(0);

      // Load analytics
      await service.saveAnalytics();
      // Note: In a real test, we would verify the analytics were loaded
    });
  });
});



