import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { z } from 'zod';
import { caches, cacheKeys, withCache } from '@/server/services/cache';
import { createError, mapProkeralaError, withRetry } from '@/server/lib/errors';

// Prokerala API Configuration
const PROKERALA_BASE_URL = 'https://api.prokerala.com/v2/astrology';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

// Zod Schemas for Prokerala API responses
export const KundliChartSchema = z.object({
  chartId: z.string(),
  chartName: z.string(),
  chartType: z.string(),
  positions: z.array(z.object({
    planet: z.string(),
    sign: z.string(),
    signName: z.string(),
    degree: z.number(),
    nakshatra: z.string(),
    nakshatraName: z.string(),
    nakshatraLord: z.string(),
    house: z.number(),
    houseName: z.string(),
  })),
  houses: z.array(z.object({
    house: z.number(),
    houseName: z.string(),
    sign: z.string(),
    signName: z.string(),
    lord: z.string(),
    lordName: z.string(),
  })),
});

export const DashaSchema = z.object({
  dashaType: z.string(),
  currentDasha: z.object({
    planet: z.string(),
    planetName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    duration: z.number(),
  }),
  antardasha: z.object({
    planet: z.string(),
    planetName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    duration: z.number(),
  }),
  pratyantardasha: z.object({
    planet: z.string(),
    planetName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    duration: z.number(),
  }),
  sookshmaDasha: z.object({
    planet: z.string(),
    planetName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    duration: z.number(),
  }),
  yoginiDasha: z.object({
    planet: z.string(),
    planetName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    duration: z.number(),
  }),
});

export const YogaSchema = z.object({
  yogaName: z.string(),
  yogaType: z.string(),
  description: z.string(),
  planets: z.array(z.string()),
  strength: z.number(),
  effects: z.array(z.string()),
});

export const KundliResponseSchema = z.object({
  charts: z.array(KundliChartSchema),
  ascendant: z.object({
    sign: z.string(),
    signName: z.string(),
    degree: z.number(),
    nakshatra: z.string(),
    nakshatraName: z.string(),
  }),
  moonSign: z.object({
    sign: z.string(),
    signName: z.string(),
    degree: z.number(),
    nakshatra: z.string(),
    nakshatraName: z.string(),
  }),
  sunSign: z.object({
    sign: z.string(),
    signName: z.string(),
    degree: z.number(),
    nakshatra: z.string(),
    nakshatraName: z.string(),
  }),
  yogas: z.array(YogaSchema),
  basicInfo: z.object({
    name: z.string(),
    birthDate: z.string(),
    birthTime: z.string(),
    birthPlace: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }),
});

export const DashasResponseSchema = z.object({
  vimshottari: DashaSchema,
  antardasha: DashaSchema,
  pratyantardasha: DashaSchema,
  sookshmaDasha: DashaSchema,
  yoginiDasha: DashaSchema,
  currentPeriod: z.object({
    vimshottari: z.string(),
    antardasha: z.string(),
    pratyantardasha: z.string(),
    sookshmaDasha: z.string(),
    yoginiDasha: z.string(),
  }),
});

export const PanchangSchema = z.object({
  date: z.string(),
  tithi: z.object({
    name: z.string(),
    paksha: z.string(),
    endTime: z.string(),
  }),
  nakshatra: z.object({
    name: z.string(),
    lord: z.string(),
    endTime: z.string(),
  }),
  yoga: z.object({
    name: z.string(),
    endTime: z.string(),
  }),
  karana: z.object({
    name: z.string(),
    endTime: z.string(),
  }),
  sunrise: z.string(),
  sunset: z.string(),
  moonrise: z.string(),
  moonset: z.string(),
  auspiciousTimes: z.array(z.object({
    name: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

export const PanchangResponseSchema = z.object({
  panchang: PanchangSchema,
  location: z.object({
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }),
});

// Input schemas
export const BirthDataSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string(),
  ayanamsa: z.number().default(1), // 1 = Lahiri, 2 = Raman, 3 = Krishnamurti
});

export type KundliResponse = z.infer<typeof KundliResponseSchema>;
export type DashasResponse = z.infer<typeof DashasResponseSchema>;
export type PanchangResponse = z.infer<typeof PanchangResponseSchema>;
export type BirthData = z.infer<typeof BirthDataSchema>;

class ProkeralaService {
  private client: AxiosInstance;
  private apiKey: string;
  private lastRequestTime: number = 0;

  constructor() {
    this.apiKey = process.env.PROKERALA_API_KEY || 'demo-key';
    
    // Allow demo mode without API key
    if (!this.apiKey || this.apiKey === 'demo-key') {
      console.warn('Running in demo mode - PROKERALA_API_KEY not provided');
    }

    this.client = axios.create({
      baseURL: PROKERALA_BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DivyanshJyotish/1.0',
      },
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await this.delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
      }
      
      this.lastRequestTime = Date.now();
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Prokerala API Error:', error.response?.data || error.message);
        throw new Error(`Prokerala API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get Kundli (Birth Chart) with D1, D9, and other divisional charts
   * 
   * Prokerala API Endpoint: POST /v2/astrology/kundli
   * Documentation: https://www.prokerala.com/astrology/api/kundli
   */
  async getKundli(birthData: BirthData): Promise<KundliResponse> {
    try {
      const response: AxiosResponse = await this.client.post('/kundli', {
        name: birthData.name,
        datetime: `${birthData.date}T${birthData.time}:00`,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        ayanamsa: birthData.ayanamsa,
        chart_type: 'd1,d9,d10,d12', // D1 (Rashi), D9 (Navamsha), D10 (Dasamsha), D12 (Dwadashamsha)
        include_yogas: true,
        include_ascendant: true,
        include_moon_sign: true,
        include_sun_sign: true,
      });

      // Transform Prokerala response to our normalized format
      const transformedData = this.transformKundliResponse(response.data, birthData);
      
      // Validate with Zod schema
      return KundliResponseSchema.parse(transformedData);
    } catch (error) {
      console.error('Error getting Kundli:', error);
      throw error;
    }
  }

  /**
   * Get Dashas (Planetary Periods) including Vimshottari, Antardasha, etc.
   * 
   * Prokerala API Endpoint: POST /v2/astrology/dasha
   * Documentation: https://www.prokerala.com/astrology/api/dasha
   */
  async getDashas(birthData: BirthData): Promise<DashasResponse> {
    try {
      const response: AxiosResponse = await this.client.post('/dasha', {
        datetime: `${birthData.date}T${birthData.time}:00`,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        ayanamsa: birthData.ayanamsa,
        dasha_type: 'vimshottari,antardasha,pratyantardasha,sookshma,yogini',
        include_current_period: true,
      });

      // Transform Prokerala response to our normalized format
      const transformedData = this.transformDashasResponse(response.data);
      
      // Validate with Zod schema
      return DashasResponseSchema.parse(transformedData);
    } catch (error) {
      console.error('Error getting Dashas:', error);
      throw error;
    }
  }

  /**
   * Get Panchang (Hindu Calendar) for a specific date and location
   * 
   * Prokerala API Endpoint: GET /v2/astrology/panchang
   * Documentation: https://www.prokerala.com/astrology/api/panchang
   */
  async getPanchang(
    date?: string, 
    latitude?: number, 
    longitude?: number, 
    timezone?: string
  ): Promise<PanchangResponse> {
    try {
      const params = new URLSearchParams();
      
      if (date) params.append('date', date);
      if (latitude !== undefined) params.append('latitude', latitude.toString());
      if (longitude !== undefined) params.append('longitude', longitude.toString());
      if (timezone) params.append('timezone', timezone);

      const response: AxiosResponse = await this.client.get(`/panchang?${params.toString()}`);

      // Transform Prokerala response to our normalized format
      const transformedData = this.transformPanchangResponse(response.data);
      
      // Validate with Zod schema
      return PanchangResponseSchema.parse(transformedData);
    } catch (error) {
      console.error('Error getting Panchang:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive horoscope data (Kundli + Dashas + Panchang)
   */
  async getCompleteHoroscope(birthData: BirthData): Promise<{
    kundli: KundliResponse;
    dashas: DashasResponse;
    panchang: PanchangResponse;
  }> {
    try {
      const [kundli, dashas, panchang] = await Promise.all([
        this.getKundli(birthData),
        this.getDashas(birthData),
        this.getPanchang(
          birthData.date,
          birthData.latitude,
          birthData.longitude,
          birthData.timezone
        ),
      ]);

      return { kundli, dashas, panchang };
    } catch (error) {
      console.error('Error getting complete horoscope:', error);
      throw error;
    }
  }

  /**
   * Transform Prokerala Kundli response to normalized format
   */
  private transformKundliResponse(data: any, birthData: BirthData): any {
    return {
      charts: data.charts?.map((chart: any) => ({
        chartId: chart.chart_id || chart.chartId,
        chartName: chart.chart_name || chart.chartName,
        chartType: chart.chart_type || chart.chartType,
        positions: chart.positions?.map((pos: any) => ({
          planet: pos.planet,
          sign: pos.sign,
          signName: pos.sign_name || pos.signName,
          degree: pos.degree,
          nakshatra: pos.nakshatra,
          nakshatraName: pos.nakshatra_name || pos.nakshatraName,
          nakshatraLord: pos.nakshatra_lord || pos.nakshatraLord,
          house: pos.house,
          houseName: pos.house_name || pos.houseName,
        })) || [],
        houses: chart.houses?.map((house: any) => ({
          house: house.house,
          houseName: house.house_name || house.houseName,
          sign: house.sign,
          signName: house.sign_name || house.signName,
          lord: house.lord,
          lordName: house.lord_name || house.lordName,
        })) || [],
      })) || [],
      ascendant: {
        sign: data.ascendant?.sign || '',
        signName: data.ascendant?.sign_name || data.ascendant?.signName || '',
        degree: data.ascendant?.degree || 0,
        nakshatra: data.ascendant?.nakshatra || '',
        nakshatraName: data.ascendant?.nakshatra_name || data.ascendant?.nakshatraName || '',
      },
      moonSign: {
        sign: data.moon_sign?.sign || data.moonSign?.sign || '',
        signName: data.moon_sign?.sign_name || data.moon_sign?.signName || data.moonSign?.signName || '',
        degree: data.moon_sign?.degree || data.moonSign?.degree || 0,
        nakshatra: data.moon_sign?.nakshatra || data.moonSign?.nakshatra || '',
        nakshatraName: data.moon_sign?.nakshatra_name || data.moon_sign?.nakshatraName || data.moonSign?.nakshatraName || '',
      },
      sunSign: {
        sign: data.sun_sign?.sign || data.sunSign?.sign || '',
        signName: data.sun_sign?.sign_name || data.sun_sign?.signName || data.sunSign?.signName || '',
        degree: data.sun_sign?.degree || data.sunSign?.degree || 0,
        nakshatra: data.sun_sign?.nakshatra || data.sunSign?.nakshatra || '',
        nakshatraName: data.sun_sign?.nakshatra_name || data.sun_sign?.nakshatraName || data.sunSign?.nakshatraName || '',
      },
      yogas: data.yogas?.map((yoga: any) => ({
        yogaName: yoga.yoga_name || yoga.yogaName,
        yogaType: yoga.yoga_type || yoga.yogaType,
        description: yoga.description,
        planets: yoga.planets || [],
        strength: yoga.strength || 0,
        effects: yoga.effects || [],
      })) || [],
      basicInfo: {
        name: birthData.name,
        birthDate: birthData.date,
        birthTime: birthData.time,
        birthPlace: '', // Will be filled by geocoding
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
      },
    };
  }

  /**
   * Transform Prokerala Dashas response to normalized format
   */
  private transformDashasResponse(data: any): any {
    return {
      vimshottari: this.transformDashaData(data.vimshottari || data.vimshottari_dasha),
      antardasha: this.transformDashaData(data.antardasha || data.antardasha_dasha),
      pratyantardasha: this.transformDashaData(data.pratyantardasha || data.pratyantardasha_dasha),
      sookshmaDasha: this.transformDashaData(data.sookshma_dasha || data.sookshmaDasha),
      yoginiDasha: this.transformDashaData(data.yogini_dasha || data.yoginiDasha),
      currentPeriod: {
        vimshottari: data.current_period?.vimshottari || data.currentPeriod?.vimshottari || '',
        antardasha: data.current_period?.antardasha || data.currentPeriod?.antardasha || '',
        pratyantardasha: data.current_period?.pratyantardasha || data.currentPeriod?.pratyantardasha || '',
        sookshmaDasha: data.current_period?.sookshma_dasha || data.currentPeriod?.sookshmaDasha || '',
        yoginiDasha: data.current_period?.yogini_dasha || data.currentPeriod?.yoginiDasha || '',
      },
    };
  }

  /**
   * Transform individual dasha data
   */
  private transformDashaData(dashaData: any): any {
    if (!dashaData) return {};
    
    return {
      dashaType: dashaData.dasha_type || dashaData.dashaType || '',
      currentDasha: {
        planet: dashaData.current_dasha?.planet || dashaData.currentDasha?.planet || '',
        planetName: dashaData.current_dasha?.planet_name || dashaData.currentDasha?.planetName || '',
        startDate: dashaData.current_dasha?.start_date || dashaData.currentDasha?.startDate || '',
        endDate: dashaData.current_dasha?.end_date || dashaData.currentDasha?.endDate || '',
        duration: dashaData.current_dasha?.duration || dashaData.currentDasha?.duration || 0,
      },
      antardasha: {
        planet: dashaData.antardasha?.planet || '',
        planetName: dashaData.antardasha?.planet_name || dashaData.antardasha?.planetName || '',
        startDate: dashaData.antardasha?.start_date || dashaData.antardasha?.startDate || '',
        endDate: dashaData.antardasha?.end_date || dashaData.antardasha?.endDate || '',
        duration: dashaData.antardasha?.duration || 0,
      },
      pratyantardasha: {
        planet: dashaData.pratyantardasha?.planet || '',
        planetName: dashaData.pratyantardasha?.planet_name || dashaData.pratyantardasha?.planetName || '',
        startDate: dashaData.pratyantardasha?.start_date || dashaData.pratyantardasha?.startDate || '',
        endDate: dashaData.pratyantardasha?.end_date || dashaData.pratyantardasha?.endDate || '',
        duration: dashaData.pratyantardasha?.duration || 0,
      },
      sookshmaDasha: {
        planet: dashaData.sookshma_dasha?.planet || dashaData.sookshmaDasha?.planet || '',
        planetName: dashaData.sookshma_dasha?.planet_name || dashaData.sookshma_dasha?.planetName || dashaData.sookshmaDasha?.planetName || '',
        startDate: dashaData.sookshma_dasha?.start_date || dashaData.sookshma_dasha?.startDate || dashaData.sookshmaDasha?.startDate || '',
        endDate: dashaData.sookshma_dasha?.end_date || dashaData.sookshma_dasha?.endDate || dashaData.sookshmaDasha?.endDate || '',
        duration: dashaData.sookshma_dasha?.duration || dashaData.sookshmaDasha?.duration || 0,
      },
      yoginiDasha: {
        planet: dashaData.yogini_dasha?.planet || dashaData.yoginiDasha?.planet || '',
        planetName: dashaData.yogini_dasha?.planet_name || dashaData.yogini_dasha?.planetName || dashaData.yoginiDasha?.planetName || '',
        startDate: dashaData.yogini_dasha?.start_date || dashaData.yogini_dasha?.startDate || dashaData.yoginiDasha?.startDate || '',
        endDate: dashaData.yogini_dasha?.end_date || dashaData.yogini_dasha?.endDate || dashaData.yoginiDasha?.endDate || '',
        duration: dashaData.yogini_dasha?.duration || dashaData.yoginiDasha?.duration || 0,
      },
    };
  }

  /**
   * Transform Prokerala Panchang response to normalized format
   */
  private transformPanchangResponse(data: any): any {
    return {
      panchang: {
        date: data.panchang?.date || data.date || '',
        tithi: {
          name: data.panchang?.tithi?.name || data.tithi?.name || '',
          paksha: data.panchang?.tithi?.paksha || data.tithi?.paksha || '',
          endTime: data.panchang?.tithi?.end_time || data.tithi?.endTime || '',
        },
        nakshatra: {
          name: data.panchang?.nakshatra?.name || data.nakshatra?.name || '',
          lord: data.panchang?.nakshatra?.lord || data.nakshatra?.lord || '',
          endTime: data.panchang?.nakshatra?.end_time || data.nakshatra?.endTime || '',
        },
        yoga: {
          name: data.panchang?.yoga?.name || data.yoga?.name || '',
          endTime: data.panchang?.yoga?.end_time || data.yoga?.endTime || '',
        },
        karana: {
          name: data.panchang?.karana?.name || data.karana?.name || '',
          endTime: data.panchang?.karana?.end_time || data.karana?.endTime || '',
        },
        sunrise: data.panchang?.sunrise || data.sunrise || '',
        sunset: data.panchang?.sunset || data.sunset || '',
        moonrise: data.panchang?.moonrise || data.moonrise || '',
        moonset: data.panchang?.moonset || data.moonset || '',
        auspiciousTimes: data.panchang?.auspicious_times?.map((time: any) => ({
          name: time.name,
          startTime: time.start_time || time.startTime,
          endTime: time.end_time || time.endTime,
        })) || data.auspiciousTimes || [],
      },
      location: {
        name: data.location?.name || '',
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        timezone: data.location?.timezone || '',
      },
    };
  }

  /**
   * Validate birth data
   */
  validateBirthData(data: any): BirthData {
    return BirthDataSchema.parse(data);
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      // Simple health check by calling a lightweight endpoint
      await this.client.get('/panchang?date=2024-01-01&latitude=27.7172&longitude=85.3240');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const prokeralaService = new ProkeralaService();

// Export class for testing
export { ProkeralaService };