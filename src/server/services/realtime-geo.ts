import { geocodingService as baseGeoService, GeocodingResult } from './geo';
import { cacheService } from './cache';
import EventEmitter from 'events';

export interface RealTimeLocationData {
  place: string;
  lat: number;
  lon: number;
  tzId: string;
  tzOffsetMinutes: number;
  city: string;
  country: string;
  lastUpdated: Date;
  dataSource: 'live' | 'cached' | 'offline';
  confidence: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
  lastUpdated: Date;
}

export interface TrafficData {
  congestionLevel: 'low' | 'medium' | 'high' | 'severe';
  averageSpeed: number;
  delayMinutes: number;
  lastUpdated: Date;
}

export interface RealTimeGeocodingResult extends GeocodingResult {
  weather?: WeatherData;
  traffic?: TrafficData;
  lastUpdated: Date;
  dataSource: 'live' | 'cached' | 'offline';
  realTimeConfidence: number;
}

export interface RealTimeUpdateOptions {
  includeWeather?: boolean;
  includeTraffic?: boolean;
  updateInterval?: number; // in minutes
  maxAge?: number; // in minutes
}

class RealTimeGeocodingService extends EventEmitter {
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activeLocations: Map<string, RealTimeLocationData> = new Map();
  private weatherApiKey: string | null = null;
  private trafficApiKey: string | null = null;

  constructor() {
    super();
    this.weatherApiKey = process.env.WEATHER_API_KEY || null;
    this.trafficApiKey = process.env.TRAFFIC_API_KEY || null;
  }

  async geocode(
    place: string,
    options: RealTimeUpdateOptions = {}
  ): Promise<RealTimeGeocodingResult> {
    const {
      includeWeather = false,
      includeTraffic = false,
      updateInterval = 30,
      maxAge = 60
    } = options;

    // Check if we have recent cached data
    const cacheKey = `realtime:${place}`;
    const cached = await cacheService.get<RealTimeGeocodingResult>(cacheKey);
    
    if (cached && this.isDataFresh(cached.lastUpdated, maxAge)) {
      this.emit('cacheHit', { place, data: cached });
      return cached;
    }

    // Get base geocoding result
    const baseResult = await baseGeoService.geocode(place);

    // Get real-time data
    const realTimeData: RealTimeGeocodingResult = {
      ...baseResult,
      lastUpdated: new Date(),
      dataSource: 'live',
      realTimeConfidence: 1.0,
    };

    // Add weather data if requested
    if (includeWeather && this.weatherApiKey) {
      try {
        realTimeData.weather = await this.getWeatherData(baseResult.lat, baseResult.lon);
      } catch (error) {
        console.warn('Weather data unavailable:', error);
      }
    }

    // Add traffic data if requested
    if (includeTraffic && this.trafficApiKey) {
      try {
        realTimeData.traffic = await this.getTrafficData(baseResult.lat, baseResult.lon);
      } catch (error) {
        console.warn('Traffic data unavailable:', error);
      }
    }

    // Cache the result
    await cacheService.set(cacheKey, realTimeData, { ttl: updateInterval * 60 });

    // Start real-time updates if requested
    if (updateInterval > 0) {
      this.startRealTimeUpdates(place, options);
    }

    this.emit('geocodingComplete', { place, data: realTimeData });
    return realTimeData;
  }

  private isDataFresh(lastUpdated: Date, maxAgeMinutes: number): boolean {
    const now = new Date();
    const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }

  private async getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    if (!this.weatherApiKey) {
      throw new Error('Weather API key not configured');
    }

    try {
      // Using OpenWeatherMap API as an example
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  private async getTrafficData(lat: number, lon: number): Promise<TrafficData> {
    if (!this.trafficApiKey) {
      throw new Error('Traffic API key not configured');
    }

    try {
      // Using Google Maps Traffic API as an example
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lon}&destinations=${lat},${lon}&key=${this.trafficApiKey}&departure_time=now&traffic_model=best_guess`
      );

      if (!response.ok) {
        throw new Error(`Traffic API error: ${response.status}`);
      }

      const data = await response.json();

      // Mock traffic data since the actual API response structure varies
      const congestionLevel = this.calculateCongestionLevel(lat, lon);
      const averageSpeed = this.calculateAverageSpeed(congestionLevel);
      const delayMinutes = this.calculateDelayMinutes(congestionLevel);

      return {
        congestionLevel,
        averageSpeed,
        delayMinutes,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Traffic API error:', error);
      throw error;
    }
  }

  private calculateCongestionLevel(lat: number, lon: number): 'low' | 'medium' | 'high' | 'severe' {
    // Mock calculation based on location and time
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    
    if (isWeekend) return 'low';
    if (isRushHour) return 'high';
    return 'medium';
  }

  private calculateAverageSpeed(congestionLevel: string): number {
    const speeds = {
      low: 60,
      medium: 40,
      high: 20,
      severe: 10,
    };
    return speeds[congestionLevel as keyof typeof speeds] || 40;
  }

  private calculateDelayMinutes(congestionLevel: string): number {
    const delays = {
      low: 0,
      medium: 5,
      high: 15,
      severe: 30,
    };
    return delays[congestionLevel as keyof typeof delays] || 5;
  }

  private startRealTimeUpdates(place: string, options: RealTimeUpdateOptions): void {
    const intervalKey = `updates:${place}`;
    
    // Clear existing interval if any
    if (this.updateIntervals.has(intervalKey)) {
      clearInterval(this.updateIntervals.get(intervalKey)!);
    }

    const interval = setInterval(async () => {
      try {
        const updatedData = await this.geocode(place, {
          ...options,
          updateInterval: 0, // Prevent recursive updates
        });
        
        this.emit('locationUpdated', { place, data: updatedData });
      } catch (error) {
        this.emit('updateError', { place, error });
      }
    }, (options.updateInterval || 30) * 60 * 1000);

    this.updateIntervals.set(intervalKey, interval);
  }

  stopRealTimeUpdates(place: string): void {
    const intervalKey = `updates:${place}`;
    const interval = this.updateIntervals.get(intervalKey);
    
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(intervalKey);
      this.emit('updatesStopped', { place });
    }
  }

  stopAllUpdates(): void {
    this.updateIntervals.forEach((interval, key) => {
      clearInterval(interval);
    });
    this.updateIntervals.clear();
    this.emit('allUpdatesStopped');
  }

  getActiveLocations(): string[] {
    return Array.from(this.updateIntervals.keys()).map(key => key.replace('updates:', ''));
  }

  async getLocationStatus(place: string): Promise<{
    isActive: boolean;
    lastUpdate?: Date;
    nextUpdate?: Date;
  }> {
    const intervalKey = `updates:${place}`;
    const isActive = this.updateIntervals.has(intervalKey);
    
    const cacheKey = `realtime:${place}`;
    const cached = await cacheService.get<RealTimeGeocodingResult>(cacheKey);
    
    return {
      isActive,
      lastUpdate: cached?.lastUpdated,
      nextUpdate: isActive ? new Date(Date.now() + 30 * 60 * 1000) : undefined,
    };
  }

  async clearRealTimeCache(): Promise<void> {
    await cacheService.clear('realtime');
  }

  // Event listeners for real-time updates
  onLocationUpdate(callback: (data: { place: string; data: RealTimeGeocodingResult }) => void): void {
    this.on('locationUpdated', callback);
  }

  onGeocodingComplete(callback: (data: { place: string; data: RealTimeGeocodingResult }) => void): void {
    this.on('geocodingComplete', callback);
  }

  onUpdateError(callback: (data: { place: string; error: any }) => void): void {
    this.on('updateError', callback);
  }

  onCacheHit(callback: (data: { place: string; data: RealTimeGeocodingResult }) => void): void {
    this.on('cacheHit', callback);
  }
}

// Export singleton instance
export const realTimeGeocodingService = new RealTimeGeocodingService();

// Export class for testing
export { RealTimeGeocodingService };
