import { OfflineGeocodingService } from '../offline-geo';
import fs from 'fs';
import path from 'path';

describe('OfflineGeocodingService', () => {
  let service: OfflineGeocodingService;
  const testDbPath = path.join(process.cwd(), 'test-offline-geo.db');

  beforeEach(() => {
    service = new OfflineGeocodingService();
    // Mock the database path for testing
    (service as any).dbPath = testDbPath;
  });

  afterEach(async () => {
    await service.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('initialization', () => {
    it('should initialize database and load seed data', async () => {
      await service.initialize();
      
      const count = await service.getLocationCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should search for Kathmandu', async () => {
      const results = await service.search('Kathmandu');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        place: 'Kathmandu, Nepal',
        lat: 27.7172,
        lon: 85.3240,
        tzId: 'Asia/Kathmandu',
        city: 'Kathmandu',
        country: 'Nepal',
      });
    });

    it('should search for Nepal locations', async () => {
      const results = await service.search('Nepal');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.country === 'Nepal')).toBe(true);
    });

    it('should search by coordinates', async () => {
      const results = await service.searchByCoordinates(27.7172, 85.3240, 10);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].distance).toBeDefined();
    });
  });

  describe('location management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should add new location', async () => {
      const newLocation = {
        place: 'Test City, Test Country',
        lat: 0.0,
        lon: 0.0,
        tzId: 'UTC',
        tzOffsetMinutes: 0,
        city: 'Test City',
        country: 'Test Country',
        countryCode: 'TC',
        state: 'Test State',
      };

      await service.addLocation(newLocation);
      
      const results = await service.search('Test City');
      expect(results).toHaveLength(1);
      expect(results[0].place).toBe('Test City, Test Country');
    });

    it('should get locations by country', async () => {
      const nepalLocations = await service.getLocationsByCountry('Nepal');
      
      expect(nepalLocations.length).toBeGreaterThan(0);
      expect(nepalLocations.every(loc => loc.country === 'Nepal')).toBe(true);
    });
  });
});



