import tzLookup from 'tz-lookup';

export interface GeocodingResult {
  lat: number;
  lon: number;
  tzId: string;
  tzOffsetMinutes: number;
  city?: string;
  country?: string;
  displayName?: string;
}

export interface GeocodingOptions {
  provider?: 'osm' | 'google';
  userAgent?: string;
  timeout?: number;
}

class GeocodingService {
  private readonly userAgent: string;
  private readonly timeout: number;

  constructor(options: GeocodingOptions = {}) {
    this.userAgent = options.userAgent || 'DivyanshJyotish/1.0 (https://divyansh-jyotish.com)';
    this.timeout = options.timeout || 10000;
  }

  /**
   * Geocode a place name to coordinates and timezone
   */
  async geocode(place: string, options: GeocodingOptions = {}): Promise<GeocodingResult> {
    const provider = options.provider || process.env.GEOCODE_PROVIDER || 'osm';
    
    if (provider === 'osm') {
      return this.geocodeWithNominatim(place);
    } else if (provider === 'google') {
      return this.geocodeWithGoogle(place);
    } else {
      throw new Error(`Unsupported geocoding provider: ${provider}`);
    }
  }

  /**
   * Geocode using OpenStreetMap Nominatim (free, no API key required)
   */
  private async geocodeWithNominatim(place: string): Promise<GeocodingResult> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', place);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('extratags', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No results found for place: ${place}`);
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lon)) {
        throw new Error(`Invalid coordinates: ${result.lat}, ${result.lon}`);
      }

      // Get timezone using tz-lookup
      const tzId = tzLookup(lat, lon);
      if (!tzId) {
        throw new Error(`Could not determine timezone for coordinates: ${lat}, ${lon}`);
      }

      // Calculate timezone offset for current date
      const tzOffsetMinutes = this.getTimezoneOffset(tzId);

      return {
        lat,
        lon,
        tzId,
        tzOffsetMinutes,
        city: result.address?.city || result.address?.town || result.address?.village || '',
        country: result.address?.country || '',
        displayName: result.display_name || place,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Geocoding failed: ${error.message}`);
      }
      throw new Error('Geocoding failed: Unknown error');
    }
  }

  /**
   * Geocode using Google Maps API (requires API key)
   */
  private async geocodeWithGoogle(place: string): Promise<GeocodingResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found. Set GOOGLE_MAPS_API_KEY environment variable.');
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', place);
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`No results found for place: ${place}. Status: ${data.status}`);
      }

      const result = data.results[0];
      const location = result.geometry.location;
      const lat = location.lat;
      const lon = location.lng;

      // Get timezone using tz-lookup
      const tzId = tzLookup(lat, lon);
      if (!tzId) {
        throw new Error(`Could not determine timezone for coordinates: ${lat}, ${lon}`);
      }

      // Calculate timezone offset for current date
      const tzOffsetMinutes = this.getTimezoneOffset(tzId);

      // Extract city and country from address components
      let city = '';
      let country = '';

      for (const component of result.address_components) {
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      return {
        lat,
        lon,
        tzId,
        tzOffsetMinutes,
        city,
        country,
        displayName: result.formatted_address || place,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Google Geocoding failed: ${error.message}`);
      }
      throw new Error('Google Geocoding failed: Unknown error');
    }
  }

  /**
   * Get timezone offset in minutes for a given timezone ID
   */
  private getTimezoneOffset(tzId: string): number {
    try {
      // Create a date object in the target timezone
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      
      // Use Intl.DateTimeFormat to get the offset
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: tzId,
        timeZoneName: 'longOffset',
      });
      
      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find(part => part.type === 'timeZoneName');
      
      if (offsetPart && offsetPart.value) {
        // Parse offset string like "GMT+05:45" or "GMT-08:00"
        const offsetMatch = offsetPart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
        if (offsetMatch) {
          const sign = offsetMatch[1] === '+' ? 1 : -1;
          const hours = parseInt(offsetMatch[2], 10);
          const minutes = parseInt(offsetMatch[3], 10);
          return sign * (hours * 60 + minutes);
        }
      }
      
      // Fallback: use a known date to calculate offset
      const testDate = new Date('2024-01-01T12:00:00Z');
      const utcTime = testDate.getTime();
      const localTime = new Date(testDate.toLocaleString('en-US', { timeZone: tzId })).getTime();
      const offset = (localTime - utcTime) / (1000 * 60);
      
      return Math.round(offset);
    } catch (error) {
      console.warn(`Could not calculate timezone offset for ${tzId}, using 0`);
      return 0;
    }
  }

  /**
   * Reverse geocode coordinates to place name
   */
  async reverseGeocode(lat: number, lon: number, options: GeocodingOptions = {}): Promise<string> {
    const provider = options.provider || process.env.GEOCODE_PROVIDER || 'osm';
    
    if (provider === 'osm') {
      return this.reverseGeocodeWithNominatim(lat, lon);
    } else if (provider === 'google') {
      return this.reverseGeocodeWithGoogle(lat, lon);
    } else {
      throw new Error(`Unsupported geocoding provider: ${provider}`);
    }
  }

  /**
   * Reverse geocode using Nominatim
   */
  private async reverseGeocodeWithNominatim(lat: number, lon: number): Promise<string> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('lat', lat.toString());
      url.searchParams.set('lon', lon.toString());
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse geocoding error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.display_name || `${lat}, ${lon}`;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Reverse geocoding failed: ${error.message}`);
      }
      throw new Error('Reverse geocoding failed: Unknown error');
    }
  }

  /**
   * Reverse geocode using Google Maps
   */
  private async reverseGeocodeWithGoogle(lat: number, lon: number): Promise<string> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found');
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${lat},${lon}`);
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Google reverse geocoding error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`No results found for coordinates: ${lat}, ${lon}`);
      }

      return data.results[0].formatted_address || `${lat}, ${lon}`;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Google reverse geocoding failed: ${error.message}`);
      }
      throw new Error('Google reverse geocoding failed: Unknown error');
    }
  }

  /**
   * Get timezone information for coordinates
   */
  getTimezoneInfo(lat: number, lon: number): { tzId: string; tzOffsetMinutes: number } {
    const tzId = tzLookup(lat, lon);
    if (!tzId) {
      throw new Error(`Could not determine timezone for coordinates: ${lat}, ${lon}`);
    }

    const tzOffsetMinutes = this.getTimezoneOffset(tzId);
    return { tzId, tzOffsetMinutes };
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();

// Export class for testing
export { GeocodingService };
