import { POST, GET } from '../compute/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/server/services/prokerala');
jest.mock('@/server/services/geocoding');
jest.mock('@/server/lib/prisma');
jest.mock('dayjs');

const mockProkeralaService = {
  getKundli: jest.fn(),
  getDashas: jest.fn(),
  getPanchang: jest.fn(),
  validateBirthData: jest.fn(),
  getHealthStatus: jest.fn(),
};

const mockGeocodingService = {
  getCoordinates: jest.fn(),
};

const mockPrisma = {
  session: {
    create: jest.fn(),
    update: jest.fn(),
  },
  horoscopeResult: {
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

// Mock modules
jest.mock('@/server/services/prokerala', () => ({
  prokeralaService: mockProkeralaService,
  BirthDataSchema: jest.fn(),
}));

jest.mock('@/server/services/geocoding', () => ({
  geocodingService: mockGeocodingService,
}));

jest.mock('@/server/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('dayjs', () => {
  const mockDayjs = jest.fn(() => ({
    tz: jest.fn().mockReturnThis(),
    utc: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnValue('2024-01-01 10:30:00'),
    toDate: jest.fn().mockReturnValue(new Date('2024-01-01T10:30:00Z')),
    utcOffset: jest.fn().mockReturnValue(345),
  }));
  
  mockDayjs.extend = jest.fn();
  mockDayjs.tz = jest.fn().mockReturnValue(mockDayjs());
  mockDayjs.utc = jest.fn().mockReturnValue(mockDayjs());
  
  return mockDayjs;
});

describe('/api/compute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should compute horoscope successfully', async () => {
      // Mock geocoding response
      mockGeocodingService.getCoordinates.mockResolvedValue({
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'Asia/Kathmandu',
        city: 'Kathmandu',
        country: 'Nepal',
      });

      // Mock Prokerala responses
      mockProkeralaService.validateBirthData.mockReturnValue({
        name: 'Test User',
        date: '1990-01-01',
        time: '10:30',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'UTC',
        ayanamsa: 1,
      });

      mockProkeralaService.getKundli.mockResolvedValue({
        charts: [],
        ascendant: {
          sign: 'aries',
          signName: 'Aries',
          degree: 15.5,
          nakshatra: 'bharani',
          nakshatraName: 'Bharani',
        },
        moonSign: {
          sign: 'cancer',
          signName: 'Cancer',
          degree: 20.3,
          nakshatra: 'pushya',
          nakshatraName: 'Pushya',
        },
        sunSign: {
          sign: 'leo',
          signName: 'Leo',
          degree: 10.7,
          nakshatra: 'magha',
          nakshatraName: 'Magha',
        },
        yogas: [
          {
            yogaName: 'Gajakesari Yoga',
            yogaType: 'beneficial',
            strength: 8.5,
          },
        ],
        basicInfo: {
          name: 'Test User',
          birthDate: '1990-01-01',
          birthTime: '10:30',
          birthPlace: 'Kathmandu, Nepal',
          latitude: 27.7172,
          longitude: 85.3240,
          timezone: 'UTC',
        },
      });

      mockProkeralaService.getDashas.mockResolvedValue({
        vimshottari: {
          dashaType: 'vimshottari',
          currentDasha: {
            planet: 'jupiter',
            planetName: 'Jupiter',
            startDate: '2020-01-01',
            endDate: '2036-01-01',
            duration: 16,
          },
          antardasha: {
            planet: 'saturn',
            planetName: 'Saturn',
            startDate: '2023-01-01',
            endDate: '2026-01-01',
            duration: 3,
          },
        },
        currentPeriod: {
          vimshottari: 'Jupiter',
          antardasha: 'Saturn',
          pratyantardasha: 'Mercury',
          sookshmaDasha: 'Venus',
          yoginiDasha: 'Kakini',
        },
      });

      mockProkeralaService.getPanchang.mockResolvedValue({
        panchang: {
          date: '2024-01-01',
          tithi: { name: 'Purnima', paksha: 'Shukla', endTime: '2024-01-02T10:30:00Z' },
          nakshatra: { name: 'Pushya', lord: 'Saturn', endTime: '2024-01-01T15:30:00Z' },
          yoga: { name: 'Siddhi', endTime: '2024-01-01T12:00:00Z' },
          karana: { name: 'Vishti', endTime: '2024-01-01T18:00:00Z' },
          sunrise: '2024-01-01T06:30:00Z',
          sunset: '2024-01-01T18:30:00Z',
          moonrise: '2024-01-01T19:00:00Z',
          moonset: '2024-01-02T07:00:00Z',
          auspiciousTimes: [],
        },
        location: {
          name: 'Kathmandu, Nepal',
          latitude: 27.7172,
          longitude: 85.3240,
          timezone: 'Asia/Kathmandu',
        },
      });

      // Mock database operations
      mockPrisma.session.create.mockResolvedValue({
        id: 'session-123',
        birth: {
          id: 'birth-123',
          name: 'Test User',
          date: new Date('1990-01-01T10:30:00Z'),
          rawDate: '1990-01-01',
          rawTime: '10:30',
          location: 'Kathmandu, Nepal',
          lat: 27.7172,
          lon: 85.3240,
          tzId: 'Asia/Kathmandu',
          tzOffsetMinutes: 345,
        },
      });

      mockPrisma.horoscopeResult.create.mockResolvedValue({
        id: 'result-123',
        sessionId: 'session-123',
        provider: 'prokerala',
        payload: {},
        summary: {},
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/compute', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          date: '1990-01-01',
          time: '10:30',
          location: 'Kathmandu, Nepal',
          lang: 'ne',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.sessionId).toBe('session-123');
      expect(data.data.summary).toMatchObject({
        name: 'Test User',
        birthDate: '1990-01-01',
        birthTime: '10:30',
        location: 'Kathmandu, Nepal',
        ascendant: expect.any(Object),
        moonSign: expect.any(Object),
        sunSign: expect.any(Object),
        currentDasha: expect.any(Object),
        keyYogas: expect.any(Array),
        charts: expect.any(Array),
        panchang: expect.any(Object),
      });
    });

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/compute', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          date: 'invalid-date',
          time: '25:70',
          location: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
    });

    it('should handle geocoding errors', async () => {
      mockGeocodingService.getCoordinates.mockRejectedValue(
        new Error('Location not found')
      );

      const request = new NextRequest('http://localhost:3000/api/compute', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          date: '1990-01-01',
          time: '10:30',
          location: 'Invalid Location',
          lang: 'ne',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Location not found');
    });

    it('should handle Prokerala API errors', async () => {
      mockGeocodingService.getCoordinates.mockResolvedValue({
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'Asia/Kathmandu',
        city: 'Kathmandu',
        country: 'Nepal',
      });

      mockProkeralaService.validateBirthData.mockReturnValue({
        name: 'Test User',
        date: '1990-01-01',
        time: '10:30',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'UTC',
        ayanamsa: 1,
      });

      mockProkeralaService.getKundli.mockRejectedValue(
        new Error('Prokerala API Error')
      );

      mockPrisma.session.create.mockResolvedValue({
        id: 'session-123',
        birth: {
          id: 'birth-123',
          name: 'Test User',
          date: new Date('1990-01-01T10:30:00Z'),
          rawDate: '1990-01-01',
          rawTime: '10:30',
          location: 'Kathmandu, Nepal',
          lat: 27.7172,
          lon: 85.3240,
          tzId: 'Asia/Kathmandu',
          tzOffsetMinutes: 345,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/compute', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          date: '1990-01-01',
          time: '10:30',
          location: 'Kathmandu, Nepal',
          lang: 'ne',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to compute horoscope');
    });
  });

  describe('GET', () => {
    it('should return health status when all services are healthy', async () => {
      mockProkeralaService.getHealthStatus.mockResolvedValue({
        status: 'healthy',
        timestamp: '2024-01-01T10:30:00Z',
      });

      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const request = new NextRequest('http://localhost:3000/api/compute');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('healthy');
      expect(data.services).toMatchObject({
        prokerala: 'healthy',
        database: 'healthy',
        geocoding: 'healthy',
      });
    });

    it('should return unhealthy status when services fail', async () => {
      mockProkeralaService.getHealthStatus.mockRejectedValue(
        new Error('Service unavailable')
      );

      const request = new NextRequest('http://localhost:3000/api/compute');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.status).toBe('unhealthy');
    });
  });
});
