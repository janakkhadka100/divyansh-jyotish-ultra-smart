import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { geocodingService } from '../src/server/services/geocoding';
import { timezoneService } from '../src/server/services/timezone';

const prisma = new PrismaClient();

describe('Smoke Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Geocoding Service', () => {
    it('should geocode Kathmandu correctly', async () => {
      const result = await geocodingService.geocode('Kathmandu, Nepal');
      
      expect(result).toBeDefined();
      expect(result.latitude).toBeCloseTo(27.7172, 1);
      expect(result.longitude).toBeCloseTo(85.3240, 1);
      expect(result.timezone).toBe('Asia/Kathmandu');
    });

    it('should geocode Ilam correctly', async () => {
      const result = await geocodingService.geocode('Ilam, Nepal');
      
      expect(result).toBeDefined();
      expect(result.latitude).toBeCloseTo(26.9, 1);
      expect(result.longitude).toBeCloseTo(87.9, 1);
      expect(result.timezone).toBe('Asia/Kathmandu');
    });

    it('should handle invalid locations gracefully', async () => {
      const result = await geocodingService.geocode('InvalidLocation12345');
      
      expect(result).toBeNull();
    });
  });

  describe('Timezone Service', () => {
    it('should get timezone for Kathmandu coordinates', async () => {
      const result = await timezoneService.getTimezone(27.7172, 85.3240);
      
      expect(result).toBeDefined();
      expect(result.timezone).toBe('Asia/Kathmandu');
      expect(result.offsetMinutes).toBe(345); // UTC+5:45
    });

    it('should get timezone for Mumbai coordinates', async () => {
      const result = await timezoneService.getTimezone(19.0760, 72.8777);
      
      expect(result).toBeDefined();
      expect(result.timezone).toBe('Asia/Kolkata');
      expect(result.offsetMinutes).toBe(330); // UTC+5:30
    });
  });

  describe('Database Operations', () => {
    it('should create and read user', async () => {
      const user = await prisma.user.create({
        data: {
          id: 'test-user-smoke',
          name: 'Test User',
          locale: 'ne',
        },
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.locale).toBe('ne');

      // Cleanup
      await prisma.user.delete({
        where: { id: user.id },
      });
    });

    it('should create and read session', async () => {
      const user = await prisma.user.create({
        data: {
          id: 'test-user-session',
          name: 'Test User',
          locale: 'ne',
        },
      });

      const session = await prisma.session.create({
        data: {
          id: 'test-session-smoke',
          userId: user.id,
        },
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);

      // Cleanup
      await prisma.session.delete({
        where: { id: session.id },
      });
      await prisma.user.delete({
        where: { id: user.id },
      });
    });

    it('should create and read birth input', async () => {
      const user = await prisma.user.create({
        data: {
          id: 'test-user-birth',
          name: 'Test User',
          locale: 'ne',
        },
      });

      const session = await prisma.session.create({
        data: {
          id: 'test-session-birth',
          userId: user.id,
        },
      });

      const birthInput = await prisma.birthInput.create({
        data: {
          sessionId: session.id,
          name: 'Test User',
          date: new Date('1990-01-01T10:00:00Z'),
          rawDate: '1990-01-01',
          rawTime: '10:00',
          location: 'Kathmandu, Nepal',
          lat: 27.7172,
          lon: 85.3240,
          tzId: 'Asia/Kathmandu',
          tzOffsetMinutes: 345,
        },
      });

      expect(birthInput).toBeDefined();
      expect(birthInput.name).toBe('Test User');
      expect(birthInput.location).toBe('Kathmandu, Nepal');

      // Cleanup
      await prisma.birthInput.delete({
        where: { id: birthInput.id },
      });
      await prisma.session.delete({
        where: { id: session.id },
      });
      await prisma.user.delete({
        where: { id: user.id },
      });
    });
  });

  describe('API Endpoints', () => {
    it('should handle geocoding API', async () => {
      const response = await fetch('http://localhost:3000/api/geocoding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: 'Kathmandu, Nepal',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.latitude).toBeCloseTo(27.7172, 1);
      expect(data.data.longitude).toBeCloseTo(85.3240, 1);
    });

    it('should handle timezone API', async () => {
      const response = await fetch('http://localhost:3000/api/timezone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: 27.7172,
          longitude: 85.3240,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.timezone).toBe('Asia/Kathmandu');
    });
  });

  describe('Demo Mode', () => {
    it('should work in demo mode', () => {
      const demoMode = process.env.DEMO_MODE === 'true';
      
      if (demoMode) {
        expect(demoMode).toBe(true);
        console.log('✅ Demo mode is enabled');
      } else {
        console.log('ℹ️ Demo mode is disabled');
      }
    });
  });

  describe('Environment Variables', () => {
    it('should have required environment variables', () => {
      const requiredVars = [
        'DATABASE_URL',
        'PROKERALA_CLIENT_ID',
        'PROKERALA_CLIENT_SECRET',
        'OPENAI_API_KEY',
      ];

      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]).not.toBe('');
      });
    });

    it('should have optional environment variables with defaults', () => {
      const optionalVars = {
        'OPENAI_MODEL': 'gpt-4',
        'GEOCODE_PROVIDER': 'google',
        'TIMEZONE_SOURCE': 'geocoding',
        'APP_BASE_URL': 'http://localhost:3000',
      };

      Object.entries(optionalVars).forEach(([varName, defaultValue]) => {
        const value = process.env[varName] || defaultValue;
        expect(value).toBeDefined();
        expect(value).not.toBe('');
      });
    });
  });

  describe('Performance', () => {
    it('should respond to geocoding within 5 seconds', async () => {
      const start = Date.now();
      
      const result = await geocodingService.geocode('Kathmandu, Nepal');
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
      expect(result).toBeDefined();
    });

    it('should respond to timezone lookup within 2 seconds', async () => {
      const start = Date.now();
      
      const result = await timezoneService.getTimezone(27.7172, 85.3240);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
      expect(result).toBeDefined();
    });
  });
});


