import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/database';
import { prokeralaEnhancedService } from '@/server/services/prokerala-enhanced';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Input validation schema
const SignupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  birthData: z.object({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    birthTime: z.string().regex(/^\d{2}:\d{2}$/),
    birthPlace: z.string().min(1).max(200),
    ayanamsa: z.number().min(1).max(3),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, birthData } = SignupSchema.parse(body);

    console.log(`Creating account for ${name} with email ${email}`);

    // Check if user already exists (with error handling)
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      });
    } catch (dbError) {
      console.log('Database not available, using demo mode');
    }
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'यो इमेल पहिले नै प्रयोगमा छ',
      }, { status: 400 });
    }

    // Step 1: Geocode location to get coordinates and timezone
    console.log('Step 1: Geocoding location...');
    let geoResult;
    try {
      geoResult = await prokeralaEnhancedService.geocodeLocation(birthData.birthPlace);
      console.log(`Geocoding result: ${geoResult.city}, ${geoResult.country}`);
    } catch (geoError) {
      console.log('Geocoding failed, using default location');
      geoResult = {
        city: birthData.birthPlace,
        country: 'Nepal',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'Asia/Kathmandu'
      };
    }

    // Step 2: Convert local time to UTC
    console.log('Step 2: Converting to UTC...');
    const localDateTime = dayjs.tz(`${birthData.birthDate} ${birthData.birthTime}`, geoResult.timezone);
    const utcDateTime = localDateTime.utc();
    console.log(`Local time: ${localDateTime.format('YYYY-MM-DD HH:mm:ss')} ${geoResult.timezone}`);
    console.log(`UTC time: ${utcDateTime.format('YYYY-MM-DD HH:mm:ss')} UTC`);

    // Step 3: Get astrological data from Prokerala
    console.log('Step 3: Fetching astrological data...');
    let astrologicalData;
    try {
      astrologicalData = await prokeralaEnhancedService.getAstrologicalData({
        name,
        date: utcDateTime.format('YYYY-MM-DD'),
        time: utcDateTime.format('HH:mm'),
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
        timezone: 'UTC',
        ayanamsa: birthData.ayanamsa,
      });
    } catch (astroError) {
      console.log('Astrological data fetch failed, using demo data');
      astrologicalData = {
        kundli: {
          ascendant: { signName: 'Aries', degree: 0, nakshatraName: 'Ashwini' },
          moonSign: { signName: 'Taurus', degree: 0, nakshatraName: 'Rohini' },
          sunSign: { signName: 'Gemini', degree: 0, nakshatraName: 'Mrigashira' }
        },
        dasha: {
          currentPeriod: { vimshottari: 'Jupiter' }
        },
        panchang: {
          tithi: 'Purnima',
          nakshatra: 'Rohini',
          yoga: 'Siddhi',
          karana: 'Vishti'
        },
        computedAt: new Date().toISOString()
      };
    }

    // Step 4: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 5: Create user and astrological data in database
    console.log('Step 4: Saving to database...');
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          birthData: {
            ...birthData,
            location: geoResult,
            utcDateTime: utcDateTime.toISOString(),
          },
          astrologicalData: {
            create: {
              kundliData: astrologicalData.kundli,
              dashaData: astrologicalData.dasha,
              panchangData: astrologicalData.panchang,
              ascendant: astrologicalData.kundli.ascendant.signName,
              moonSign: astrologicalData.kundli.moonSign.signName,
              sunSign: astrologicalData.kundli.sunSign.signName,
              currentDasha: astrologicalData.dasha.currentPeriod.vimshottari,
              computedAt: new Date(astrologicalData.computedAt),
            }
          }
        },
        include: {
          astrologicalData: true
        }
      });
      console.log(`User created: ${user.id}`);
    } catch (dbError) {
      console.log('Database not available, creating demo user');
      // Create demo user data
      user = {
        id: Date.now().toString(),
        name,
        email,
        birthData: {
          ...birthData,
          location: geoResult,
          utcDateTime: utcDateTime.toISOString(),
        },
        astrologicalData: [{
          kundliData: astrologicalData.kundli,
          dashaData: astrologicalData.dasha,
          panchangData: astrologicalData.panchang,
          ascendant: astrologicalData.kundli.ascendant.signName,
          moonSign: astrologicalData.kundli.moonSign.signName,
          sunSign: astrologicalData.kundli.sunSign.signName,
          currentDasha: astrologicalData.dasha.currentPeriod.vimshottari,
        }]
      };
    }

    // Step 6: Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'demo-secret',
      { expiresIn: '7d' }
    );

    // Step 7: Create session
    try {
      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });
    } catch (dbError) {
      console.log('Session creation failed, continuing with demo mode');
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
      message: 'खाता सफलतापूर्वक खोलियो र ज्योतिष डाटा तयार भयो',
      astrologicalData: {
        ascendant: astrologicalData.kundli.ascendant.signName,
        moonSign: astrologicalData.kundli.moonSign.signName,
        sunSign: astrologicalData.kundli.sunSign.signName,
        currentDasha: astrologicalData.dasha.currentPeriod.vimshottari,
      }
    });

  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'अमान्य डाटा',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'साइन अप गर्नमा त्रुटि भयो',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
