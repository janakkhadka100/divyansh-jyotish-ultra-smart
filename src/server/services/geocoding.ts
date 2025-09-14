import { geocodingService as geoService, GeocodingResult } from './geo';

interface LegacyGeocodingResult {
  latitude: number;
  longitude: number;
  timezone: string;
  city: string;
  country: string;
}

class LegacyGeocodingService {
  async getCoordinates(place: string): Promise<LegacyGeocodingResult> {
    try {
      const result = await geoService.geocode(place);
      
      return {
        latitude: result.lat,
        longitude: result.lon,
        timezone: result.tzId,
        city: result.city || '',
        country: result.country || '',
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to get coordinates for the place');
    }
  }

  async getPlaceName(latitude: number, longitude: number): Promise<string> {
    try {
      return await geoService.reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown Location';
    }
  }
}

export const geocodingService = new LegacyGeocodingService();
