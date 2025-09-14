// Mock environment variable before importing
process.env.PROKERALA_API_KEY = 'test-api-key';

import { ProkeralaService, BirthDataSchema } from '../prokerala';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

describe('ProkeralaService', () => {
  let service: ProkeralaService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios before creating service
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      post: jest.fn(),
      get: jest.fn(),
    });
    
    // Create service instance
    service = new ProkeralaService();
  });

  describe('getKundli', () => {
    it('should get Kundli data successfully', async () => {
      const mockResponse = {
        data: {
          charts: [
            {
              chart_id: 'd1',
              chart_name: 'Rashi Chart',
              chart_type: 'd1',
              positions: [
                {
                  planet: 'sun',
                  sign: 'aries',
                  sign_name: 'Aries',
                  degree: 15.5,
                  nakshatra: 'bharani',
                  nakshatra_name: 'Bharani',
                  nakshatra_lord: 'venus',
                  house: 1,
                  house_name: 'First House',
                },
              ],
              houses: [
                {
                  house: 1,
                  house_name: 'First House',
                  sign: 'aries',
                  sign_name: 'Aries',
                  lord: 'mars',
                  lord_name: 'Mars',
                },
              ],
            },
          ],
          ascendant: {
            sign: 'aries',
            sign_name: 'Aries',
            degree: 15.5,
            nakshatra: 'bharani',
            nakshatra_name: 'Bharani',
          },
          moon_sign: {
            sign: 'cancer',
            sign_name: 'Cancer',
            degree: 20.3,
            nakshatra: 'pushya',
            nakshatra_name: 'Pushya',
          },
          sun_sign: {
            sign: 'leo',
            sign_name: 'Leo',
            degree: 10.7,
            nakshatra: 'magha',
            nakshatra_name: 'Magha',
          },
          yogas: [
            {
              yoga_name: 'Gajakesari Yoga',
              yoga_type: 'beneficial',
              description: 'Jupiter in Kendra from Moon',
              planets: ['jupiter', 'moon'],
              strength: 8.5,
              effects: ['Intelligence', 'Wealth', 'Fame'],
            },
          ],
        },
      };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const birthData = {
        name: 'Test User',
        date: '1990-01-01',
        time: '10:30',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'UTC',
        ayanamsa: 1,
      };

      const result = await service.getKundli(birthData);

      expect(result).toMatchObject({
        charts: expect.any(Array),
        ascendant: expect.any(Object),
        moonSign: expect.any(Object),
        sunSign: expect.any(Object),
        yogas: expect.any(Array),
        basicInfo: expect.any(Object),
      });

      expect(result.charts[0]).toMatchObject({
        chartId: 'd1',
        chartName: 'Rashi Chart',
        chartType: 'd1',
        positions: expect.any(Array),
        houses: expect.any(Array),
      });

      expect(result.ascendant).toMatchObject({
        sign: 'aries',
        signName: 'Aries',
        degree: 15.5,
        nakshatra: 'bharani',
        nakshatraName: 'Bharani',
      });
    });

    it('should handle API errors', async () => {
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      const birthData = {
        name: 'Test User',
        date: '1990-01-01',
        time: '10:30',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'UTC',
        ayanamsa: 1,
      };

      await expect(service.getKundli(birthData)).rejects.toThrow('Prokerala API Error');
    });
  });

  describe('getDashas', () => {
    it('should get Dashas data successfully', async () => {
      const mockResponse = {
        data: {
          vimshottari_dasha: {
            dasha_type: 'vimshottari',
            current_dasha: {
              planet: 'jupiter',
              planet_name: 'Jupiter',
              start_date: '2020-01-01',
              end_date: '2036-01-01',
              duration: 16,
            },
            antardasha: {
              planet: 'saturn',
              planet_name: 'Saturn',
              start_date: '2023-01-01',
              end_date: '2026-01-01',
              duration: 3,
            },
          },
          current_period: {
            vimshottari: 'Jupiter',
            antardasha: 'Saturn',
            pratyantardasha: 'Mercury',
            sookshma_dasha: 'Venus',
            yogini_dasha: 'Kakini',
          },
        },
      };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const birthData = {
        name: 'Test User',
        date: '1990-01-01',
        time: '10:30',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'UTC',
        ayanamsa: 1,
      };

      const result = await service.getDashas(birthData);

      expect(result).toMatchObject({
        vimshottari: expect.any(Object),
        currentPeriod: expect.any(Object),
      });

      expect(result.vimshottari).toMatchObject({
        dashaType: 'vimshottari',
        currentDasha: expect.any(Object),
        antardasha: expect.any(Object),
      });
    });
  });

  describe('getPanchang', () => {
    it('should get Panchang data successfully', async () => {
      const mockResponse = {
        data: {
          panchang: {
            date: '2024-01-01',
            tithi: {
              name: 'Purnima',
              paksha: 'Shukla',
              end_time: '2024-01-02T10:30:00Z',
            },
            nakshatra: {
              name: 'Pushya',
              lord: 'Saturn',
              end_time: '2024-01-01T15:30:00Z',
            },
            yoga: {
              name: 'Siddhi',
              end_time: '2024-01-01T12:00:00Z',
            },
            karana: {
              name: 'Vishti',
              end_time: '2024-01-01T18:00:00Z',
            },
            sunrise: '2024-01-01T06:30:00Z',
            sunset: '2024-01-01T18:30:00Z',
            moonrise: '2024-01-01T19:00:00Z',
            moonset: '2024-01-02T07:00:00Z',
            auspicious_times: [
              {
                name: 'Abhijit',
                start_time: '2024-01-01T12:00:00Z',
                end_time: '2024-01-01T12:45:00Z',
              },
            ],
          },
          location: {
            name: 'Kathmandu, Nepal',
            latitude: 27.7172,
            longitude: 85.3240,
            timezone: 'Asia/Kathmandu',
          },
        },
      };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.getPanchang(
        '2024-01-01',
        27.7172,
        85.3240,
        'Asia/Kathmandu'
      );

      expect(result).toMatchObject({
        panchang: expect.any(Object),
        location: expect.any(Object),
      });

      expect(result.panchang).toMatchObject({
        date: '2024-01-01',
        tithi: expect.any(Object),
        nakshatra: expect.any(Object),
        yoga: expect.any(Object),
        karana: expect.any(Object),
      });
    });
  });

  describe('getCompleteHoroscope', () => {
    it('should get complete horoscope data', async () => {
      const mockKundliResponse = {
        data: {
          charts: [],
          ascendant: { sign: 'aries', sign_name: 'Aries', degree: 15.5, nakshatra: 'bharani', nakshatra_name: 'Bharani' },
          moon_sign: { sign: 'cancer', sign_name: 'Cancer', degree: 20.3, nakshatra: 'pushya', nakshatra_name: 'Pushya' },
          sun_sign: { sign: 'leo', sign_name: 'Leo', degree: 10.7, nakshatra: 'magha', nakshatra_name: 'Magha' },
          yogas: [],
        },
      };

      const mockDashasResponse = {
        data: {
          vimshottari_dasha: {
            dasha_type: 'vimshottari',
            current_dasha: { planet: 'jupiter', planet_name: 'Jupiter', start_date: '2020-01-01', end_date: '2036-01-01', duration: 16 },
            antardasha: { planet: 'saturn', planet_name: 'Saturn', start_date: '2023-01-01', end_date: '2026-01-01', duration: 3 },
          },
          current_period: { vimshottari: 'Jupiter', antardasha: 'Saturn', pratyantardasha: 'Mercury', sookshma_dasha: 'Venus', yogini_dasha: 'Kakini' },
        },
      };

      const mockPanchangResponse = {
        data: {
          panchang: {
            date: '2024-01-01',
            tithi: { name: 'Purnima', paksha: 'Shukla', end_time: '2024-01-02T10:30:00Z' },
            nakshatra: { name: 'Pushya', lord: 'Saturn', end_time: '2024-01-01T15:30:00Z' },
            yoga: { name: 'Siddhi', end_time: '2024-01-01T12:00:00Z' },
            karana: { name: 'Vishti', end_time: '2024-01-01T18:00:00Z' },
            sunrise: '2024-01-01T06:30:00Z',
            sunset: '2024-01-01T18:30:00Z',
            moonrise: '2024-01-01T19:00:00Z',
            moonset: '2024-01-02T07:00:00Z',
            auspicious_times: [],
          },
          location: { name: 'Kathmandu, Nepal', latitude: 27.7172, longitude: 85.3240, timezone: 'Asia/Kathmandu' },
        },
      };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn()
          .mockResolvedValueOnce(mockKundliResponse)
          .mockResolvedValueOnce(mockDashasResponse),
        get: jest.fn().mockResolvedValue(mockPanchangResponse),
      });

      const birthData = {
        name: 'Test User',
        date: '1990-01-01',
        time: '10:30',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'UTC',
        ayanamsa: 1,
      };

      const result = await service.getCompleteHoroscope(birthData);

      expect(result).toMatchObject({
        kundli: expect.any(Object),
        dashas: expect.any(Object),
        panchang: expect.any(Object),
      });
    });
  });

  describe('validateBirthData', () => {
    it('should validate correct birth data', () => {
      const validData = {
        name: 'Test User',
        date: '1990-01-01',
        time: '10:30',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'UTC',
        ayanamsa: 1,
      };

      const result = service.validateBirthData(validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid birth data', () => {
      const invalidData = {
        name: '',
        date: 'invalid-date',
        time: '25:70',
        latitude: 200,
        longitude: 300,
        timezone: 'UTC',
        ayanamsa: 5,
      };

      expect(() => service.validateBirthData(invalidData)).toThrow();
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when API is working', async () => {
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn().mockResolvedValue({ data: {} }),
      });

      const result = await service.getHealthStatus();
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy status when API fails', async () => {
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      const result = await service.getHealthStatus();
      expect(result.status).toBe('unhealthy');
    });
  });
});
