import { GeocodingService } from '../geo';

// Mock fetch for testing
global.fetch = jest.fn();

describe('GeocodingService', () => {
  let geocodingService: GeocodingService;

  beforeEach(() => {
    geocodingService = new GeocodingService();
    jest.clearAllMocks();
  });

  describe('geocode', () => {
    it('should geocode Kathmandu correctly using Nominatim', async () => {
      // Mock Nominatim response for Kathmandu
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
              state: 'Bagmati Province',
            },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await geocodingService.geocode('Kathmandu, Nepal', { provider: 'osm' });

      expect(result).toEqual({
        lat: 27.7172,
        lon: 85.3240,
        tzId: 'Asia/Kathmandu',
        tzOffsetMinutes: 345, // UTC+5:45
        city: 'Kathmandu',
        country: 'Nepal',
        displayName: 'Kathmandu, Bagmati Province, Nepal',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('nominatim.openstreetmap.org'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('DivyanshJyotish'),
          }),
        })
      );
    });

    it('should geocode Ilam correctly using Nominatim', async () => {
      // Mock Nominatim response for Ilam
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '26.9094',
            lon: '87.9282',
            display_name: 'Ilam, Province No. 1, Nepal',
            address: {
              city: 'Ilam',
              country: 'Nepal',
              state: 'Province No. 1',
            },
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await geocodingService.geocode('Ilam, Nepal', { provider: 'osm' });

      expect(result).toEqual({
        lat: 26.9094,
        lon: 87.9282,
        tzId: 'Asia/Kathmandu',
        tzOffsetMinutes: 345, // UTC+5:45
        city: 'Ilam',
        country: 'Nepal',
        displayName: 'Ilam, Province No. 1, Nepal',
      });
    });

    it('should handle geocoding errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(geocodingService.geocode('Invalid Place')).rejects.toThrow(
        'Geocoding failed: Nominatim API error: 500 Internal Server Error'
      );
    });

    it('should handle no results found', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(geocodingService.geocode('NonExistentPlace12345')).rejects.toThrow(
        'Geocoding failed: No results found for place: NonExistentPlace12345'
      );
    });

    it('should handle invalid coordinates', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: 'invalid',
            lon: 'invalid',
            display_name: 'Invalid Place',
          },
        ]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(geocodingService.geocode('Invalid Place')).rejects.toThrow(
        'Geocoding failed: Invalid coordinates: invalid, invalid'
      );
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode Kathmandu coordinates correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          display_name: 'Kathmandu, Bagmati Province, Nepal',
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await geocodingService.reverseGeocode(27.7172, 85.3240, { provider: 'osm' });

      expect(result).toBe('Kathmandu, Bagmati Province, Nepal');
    });

    it('should reverse geocode Ilam coordinates correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          display_name: 'Ilam, Province No. 1, Nepal',
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await geocodingService.reverseGeocode(26.9094, 87.9282, { provider: 'osm' });

      expect(result).toBe('Ilam, Province No. 1, Nepal');
    });
  });

  describe('getTimezoneInfo', () => {
    it('should return correct timezone info for Kathmandu', () => {
      const result = geocodingService.getTimezoneInfo(27.7172, 85.3240);

      expect(result.tzId).toBe('Asia/Kathmandu');
      expect(result.tzOffsetMinutes).toBe(345); // UTC+5:45
    });

    it('should return correct timezone info for Ilam', () => {
      const result = geocodingService.getTimezoneInfo(26.9094, 87.9282);

      expect(result.tzId).toBe('Asia/Kathmandu');
      expect(result.tzOffsetMinutes).toBe(345); // UTC+5:45
    });

    it('should handle invalid coordinates', () => {
      expect(() => geocodingService.getTimezoneInfo(999, 999)).toThrow(
        'invalid coordinates'
      );
    });
  });

  describe('timezone offset calculation', () => {
    it('should calculate correct offset for Asia/Kathmandu', () => {
      const service = new GeocodingService();
      const offset = (service as any).getTimezoneOffset('Asia/Kathmandu');
      
      // Nepal is UTC+5:45, so offset should be 345 minutes
      expect(offset).toBe(345);
    });

    it('should calculate correct offset for America/New_York', () => {
      const service = new GeocodingService();
      const offset = (service as any).getTimezoneOffset('America/New_York');
      
      // New York is UTC-5 (EST) or UTC-4 (EDT)
      // We expect either -300 or -240 minutes
      expect([-300, -240]).toContain(offset);
    });

    it('should calculate correct offset for Europe/London', () => {
      const service = new GeocodingService();
      const offset = (service as any).getTimezoneOffset('Europe/London');
      
      // London is UTC+0 (GMT) or UTC+1 (BST)
      // We expect either 0 or 60 minutes
      expect([0, 60]).toContain(offset);
    });
  });

  describe('Google Maps integration', () => {
    beforeEach(() => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      delete process.env.GOOGLE_MAPS_API_KEY;
    });

    it('should geocode using Google Maps when provider is google', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'OK',
          results: [
            {
              geometry: {
                location: {
                  lat: 27.7172,
                  lng: 85.3240,
                },
              },
              formatted_address: 'Kathmandu, Nepal',
              address_components: [
                {
                  long_name: 'Kathmandu',
                  types: ['locality'],
                },
                {
                  long_name: 'Nepal',
                  types: ['country'],
                },
              ],
            },
          ],
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await geocodingService.geocode('Kathmandu, Nepal', { provider: 'google' });

      expect(result).toEqual({
        lat: 27.7172,
        lon: 85.3240,
        tzId: 'Asia/Kathmandu',
        tzOffsetMinutes: 345,
        city: 'Kathmandu',
        country: 'Nepal',
        displayName: 'Kathmandu, Nepal',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should throw error when Google API key is missing', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;

      await expect(geocodingService.geocode('Kathmandu', { provider: 'google' })).rejects.toThrow(
        'Google Maps API key not found. Set GOOGLE_MAPS_API_KEY environment variable.'
      );
    });
  });
});
