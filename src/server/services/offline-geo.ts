import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { GeocodingResult } from './geo';
import path from 'path';
import fs from 'fs';

export interface OfflineLocationData {
  id: number;
  place: string;
  lat: number;
  lon: number;
  tzId: string;
  tzOffsetMinutes: number;
  city: string;
  country: string;
  countryCode: string;
  state: string;
  postalCode?: string;
  population?: number;
  lastUpdated: Date;
}

export interface OfflineSearchResult {
  place: string;
  lat: number;
  lon: number;
  tzId: string;
  tzOffsetMinutes: number;
  city: string;
  country: string;
  distance?: number;
  confidence: number;
}

class OfflineGeocodingService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isInitialized = false;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'offline-geocoding.db');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Skip SQLite3 in production demo mode
      if (process.env.NODE_ENV === 'production') {
        console.warn('Skipping SQLite3 offline geocoding in production demo mode');
        this.isInitialized = true;
        return;
      }

      this.db = new sqlite3.Database(this.dbPath);
      await this.createTables();
      await this.loadSeedData();
      this.isInitialized = true;
      console.log('Offline geocoding database initialized');
    } catch (error) {
      console.warn('Failed to initialize offline geocoding database, using fallback:', error);
      this.isInitialized = true; // Allow service to work without SQLite3
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    await run(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        tzId TEXT NOT NULL,
        tzOffsetMinutes INTEGER NOT NULL,
        city TEXT,
        country TEXT,
        countryCode TEXT,
        state TEXT,
        postalCode TEXT,
        population INTEGER,
        lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(place, lat, lon)
      )
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_place ON locations(place);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_coordinates ON locations(lat, lon);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_country ON locations(country);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_city ON locations(city);
    `);
  }

  private async loadSeedData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    // Check if data already exists
    const count = await get('SELECT COUNT(*) as count FROM locations');
    if (count.count > 0) return;

    // Load major cities and locations
    const seedData: Omit<OfflineLocationData, 'id' | 'lastUpdated'>[] = [
      // Nepal
      { place: 'Kathmandu, Nepal', lat: 27.7172, lon: 85.3240, tzId: 'Asia/Kathmandu', tzOffsetMinutes: 345, city: 'Kathmandu', country: 'Nepal', countryCode: 'NP', state: 'Bagmati Province' },
      { place: 'Pokhara, Nepal', lat: 28.2096, lon: 83.9856, tzId: 'Asia/Kathmandu', tzOffsetMinutes: 345, city: 'Pokhara', country: 'Nepal', countryCode: 'NP', state: 'Gandaki Province' },
      { place: 'Ilam, Nepal', lat: 26.9094, lon: 87.9282, tzId: 'Asia/Kathmandu', tzOffsetMinutes: 345, city: 'Ilam', country: 'Nepal', countryCode: 'NP', state: 'Province No. 1' },
      { place: 'Biratnagar, Nepal', lat: 26.4521, lon: 87.2717, tzId: 'Asia/Kathmandu', tzOffsetMinutes: 345, city: 'Biratnagar', country: 'Nepal', countryCode: 'NP', state: 'Province No. 1' },
      { place: 'Lalitpur, Nepal', lat: 27.6710, lon: 85.3250, tzId: 'Asia/Kathmandu', tzOffsetMinutes: 345, city: 'Lalitpur', country: 'Nepal', countryCode: 'NP', state: 'Bagmati Province' },
      
      // India
      { place: 'New Delhi, India', lat: 28.6139, lon: 77.2090, tzId: 'Asia/Kolkata', tzOffsetMinutes: 330, city: 'New Delhi', country: 'India', countryCode: 'IN', state: 'Delhi' },
      { place: 'Mumbai, India', lat: 19.0760, lon: 72.8777, tzId: 'Asia/Kolkata', tzOffsetMinutes: 330, city: 'Mumbai', country: 'India', countryCode: 'IN', state: 'Maharashtra' },
      { place: 'Bangalore, India', lat: 12.9716, lon: 77.5946, tzId: 'Asia/Kolkata', tzOffsetMinutes: 330, city: 'Bangalore', country: 'India', countryCode: 'IN', state: 'Karnataka' },
      { place: 'Kolkata, India', lat: 22.5726, lon: 88.3639, tzId: 'Asia/Kolkata', tzOffsetMinutes: 330, city: 'Kolkata', country: 'India', countryCode: 'IN', state: 'West Bengal' },
      { place: 'Chennai, India', lat: 13.0827, lon: 80.2707, tzId: 'Asia/Kolkata', tzOffsetMinutes: 330, city: 'Chennai', country: 'India', countryCode: 'IN', state: 'Tamil Nadu' },
      
      // Major world cities
      { place: 'New York, USA', lat: 40.7128, lon: -74.0060, tzId: 'America/New_York', tzOffsetMinutes: -300, city: 'New York', country: 'United States', countryCode: 'US', state: 'New York' },
      { place: 'London, UK', lat: 51.5074, lon: -0.1278, tzId: 'Europe/London', tzOffsetMinutes: 0, city: 'London', country: 'United Kingdom', countryCode: 'GB', state: 'England' },
      { place: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, tzId: 'Asia/Tokyo', tzOffsetMinutes: 540, city: 'Tokyo', country: 'Japan', countryCode: 'JP', state: 'Tokyo' },
      { place: 'Beijing, China', lat: 39.9042, lon: 116.4074, tzId: 'Asia/Shanghai', tzOffsetMinutes: 480, city: 'Beijing', country: 'China', countryCode: 'CN', state: 'Beijing' },
      { place: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, tzId: 'Australia/Sydney', tzOffsetMinutes: 660, city: 'Sydney', country: 'Australia', countryCode: 'AU', state: 'New South Wales' },
    ];

    for (const location of seedData) {
      await run(`
        INSERT OR IGNORE INTO locations (place, lat, lon, tzId, tzOffsetMinutes, city, country, countryCode, state, postalCode, population)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        location.place,
        location.lat,
        location.lon,
        location.tzId,
        location.tzOffsetMinutes,
        location.city,
        location.country,
        location.countryCode,
        location.state,
        location.postalCode,
        location.population
      ]);
    }
  }

  async search(place: string, limit = 10): Promise<OfflineSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));

    const results = await all(`
      SELECT 
        place,
        lat,
        lon,
        tzId,
        tzOffsetMinutes,
        city,
        country,
        (CASE 
          WHEN place LIKE ? THEN 1.0
          WHEN city LIKE ? THEN 0.9
          WHEN country LIKE ? THEN 0.8
          ELSE 0.7
        END) as confidence
      FROM locations 
      WHERE place LIKE ? OR city LIKE ? OR country LIKE ?
      ORDER BY confidence DESC, place ASC
      LIMIT ?
    `, [
      `%${place}%`,
      `%${place}%`,
      `%${place}%`,
      `%${place}%`,
      `%${place}%`,
      `%${place}%`,
      limit
    ]);

    return results.map((row: any) => ({
      place: row.place,
      lat: row.lat,
      lon: row.lon,
      tzId: row.tzId,
      tzOffsetMinutes: row.tzOffsetMinutes,
      city: row.city,
      country: row.country,
      confidence: row.confidence,
    }));
  }

  async searchByCoordinates(lat: number, lon: number, radiusKm = 50): Promise<OfflineSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));

    // Simple distance calculation (not perfectly accurate but good enough for offline)
    const results = await all(`
      SELECT 
        place,
        lat,
        lon,
        tzId,
        tzOffsetMinutes,
        city,
        country,
        (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lon) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance
      FROM locations 
      WHERE (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lon) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) <= ?
      ORDER BY distance ASC
      LIMIT 10
    `, [lat, lon, lat, lat, lon, lat, radiusKm]);

    return results.map((row: any) => ({
      place: row.place,
      lat: row.lat,
      lon: row.lon,
      tzId: row.tzId,
      tzOffsetMinutes: row.tzOffsetMinutes,
      city: row.city,
      country: row.country,
      distance: row.distance,
      confidence: Math.max(0.1, 1.0 - (row.distance / radiusKm)),
    }));
  }

  async addLocation(location: Omit<OfflineLocationData, 'id' | 'lastUpdated'>): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    await run(`
      INSERT OR REPLACE INTO locations (place, lat, lon, tzId, tzOffsetMinutes, city, country, countryCode, state, postalCode, population)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      location.place,
      location.lat,
      location.lon,
      location.tzId,
      location.tzOffsetMinutes,
      location.city,
      location.country,
      location.countryCode,
      location.state,
      location.postalCode,
      location.population
    ]);
  }

  async getLocationCount(): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT COUNT(*) as count FROM locations');
    return result.count;
  }

  async getLocationsByCountry(country: string): Promise<OfflineLocationData[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));

    const results = await all(`
      SELECT * FROM locations WHERE country = ? ORDER BY city
    `, [country]);

    return results.map((row: any) => ({
      id: row.id,
      place: row.place,
      lat: row.lat,
      lon: row.lon,
      tzId: row.tzId,
      tzOffsetMinutes: row.tzOffsetMinutes,
      city: row.city,
      country: row.country,
      countryCode: row.countryCode,
      state: row.state,
      postalCode: row.postalCode,
      population: row.population,
      lastUpdated: new Date(row.lastUpdated),
    }));
  }

  async close(): Promise<void> {
    if (this.db) {
      const close = promisify(this.db.close.bind(this.db));
      await close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const offlineGeocodingService = new OfflineGeocodingService();

// Export class for testing
export { OfflineGeocodingService };
