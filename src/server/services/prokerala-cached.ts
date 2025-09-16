import { prisma } from '@/server/lib/prisma';
import { caches, cacheKeys, withCache } from '@/server/services/cache';
import { createError, mapProkeralaError, withRetry } from '@/server/lib/errors';
import { ProkeralaService } from './prokerala';
import { BirthData, KundliResponse, DashaResponse, YogaResponse, PanchangResponse } from './prokerala';

export class CachedProkeralaService {
  private prokeralaService: ProkeralaService;

  constructor() {
    this.prokeralaService = new ProkeralaService();
  }

  // Cached Kundli with retry and error handling
  async getKundli(birthData: BirthData): Promise<KundliResponse> {
    const cacheKey = cacheKeys.prokerala(
      birthData.latitude,
      birthData.longitude,
      `${birthData.date}T${birthData.time}`,
      birthData.ayanamsa,
      'placidus' // Default house system
    );

    return withRetry(
      async () => {
        // Check cache first
        const cached = await caches.prokerala.get<KundliResponse>(cacheKey);
        if (cached) {
          return cached;
        }

        // Call Prokerala API
        const result = await this.prokeralaService.getKundli(birthData);
        
        // Cache the result
        await caches.prokerala.set(cacheKey, result);
        
        return result;
      },
      3, // max retries
      1000, // base delay
      10000 // max delay
    );
  }

  // Cached Dasha with retry and error handling
  async getDasha(birthData: BirthData): Promise<DashaResponse> {
    const cacheKey = `dasha:${cacheKeys.prokerala(
      birthData.latitude,
      birthData.longitude,
      `${birthData.date}T${birthData.time}`,
      birthData.ayanamsa,
      'placidus'
    )}`;

    return withRetry(
      async () => {
        // Check cache first
        const cached = await caches.prokerala.get<DashaResponse>(cacheKey);
        if (cached) {
          return cached;
        }

        // Call Prokerala API
        const result = await this.prokeralaService.getDasha(birthData);
        
        // Cache the result
        await caches.prokerala.set(cacheKey, result);
        
        return result;
      },
      3,
      1000,
      10000
    );
  }

  // Cached Yoga with retry and error handling
  async getYoga(birthData: BirthData): Promise<YogaResponse> {
    const cacheKey = `yoga:${cacheKeys.prokerala(
      birthData.latitude,
      birthData.longitude,
      `${birthData.date}T${birthData.time}`,
      birthData.ayanamsa,
      'placidus'
    )}`;

    return withRetry(
      async () => {
        // Check cache first
        const cached = await caches.prokerala.get<YogaResponse>(cacheKey);
        if (cached) {
          return cached;
        }

        // Call Prokerala API
        const result = await this.prokeralaService.getYoga(birthData);
        
        // Cache the result
        await caches.prokerala.set(cacheKey, result);
        
        return result;
      },
      3,
      1000,
      10000
    );
  }

  // Cached Panchang with retry and error handling
  async getPanchang(birthData: BirthData): Promise<PanchangResponse> {
    const cacheKey = `panchang:${cacheKeys.prokerala(
      birthData.latitude,
      birthData.longitude,
      `${birthData.date}T${birthData.time}`,
      birthData.ayanamsa,
      'placidus'
    )}`;

    return withRetry(
      async () => {
        // Check cache first
        const cached = await caches.prokerala.get<PanchangResponse>(cacheKey);
        if (cached) {
          return cached;
        }

        // Call Prokerala API
        const result = await this.prokeralaService.getPanchang(birthData);
        
        // Cache the result
        await caches.prokerala.set(cacheKey, result);
        
        return result;
      },
      3,
      1000,
      10000
    );
  }

  // Get all horoscope data with caching
  async getAllHoroscopeData(birthData: BirthData): Promise<{
    kundli: KundliResponse;
    dasha: DashaResponse;
    yoga: YogaResponse;
    panchang: PanchangResponse;
  }> {
    try {
      // Check if we already have this data in the database
      const existingResult = await prisma.horoscopeResult.findFirst({
        where: {
          session: {
            birth: {
              lat: birthData.latitude,
              lon: birthData.longitude,
              date: new Date(`${birthData.date}T${birthData.time}:00`),
            },
          },
        },
        include: {
          session: {
            include: {
              birth: true,
            },
          },
        },
      });

      if (existingResult) {
        // Return cached data from database
        return {
          kundli: existingResult.payload as KundliResponse,
          dasha: (existingResult.payload as any).dasha,
          yoga: (existingResult.payload as any).yoga,
          panchang: (existingResult.payload as any).panchang,
        };
      }

      // Fetch all data in parallel with caching
      const [kundli, dasha, yoga, panchang] = await Promise.all([
        this.getKundli(birthData),
        this.getDasha(birthData),
        this.getYoga(birthData),
        this.getPanchang(birthData),
      ]);

      return {
        kundli,
        dasha,
        yoga,
        panchang,
      };
    } catch (error) {
      console.error('Error fetching horoscope data:', error);
      throw mapProkeralaError(error);
    }
  }

  // Clear cache for specific birth data
  async clearCache(birthData: BirthData): Promise<void> {
    const baseKey = cacheKeys.prokerala(
      birthData.latitude,
      birthData.longitude,
      `${birthData.date}T${birthData.time}`,
      birthData.ayanamsa,
      'placidus'
    );

    const keys = [
      baseKey,
      `dasha:${baseKey}`,
      `yoga:${baseKey}`,
      `panchang:${baseKey}`,
    ];

    await Promise.all(keys.map(key => caches.prokerala.delete(key)));
  }

  // Get cache statistics
  getCacheStats() {
    return caches.prokerala.getStats();
  }
}

export const cachedProkeralaService = new CachedProkeralaService();



