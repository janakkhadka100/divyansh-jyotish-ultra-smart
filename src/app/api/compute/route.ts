import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prokeralaService, BirthDataSchema } from '@/server/services/prokerala';
import { geocodingService } from '@/server/services/geocoding';
import { prisma } from '@/server/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Input validation schema
const ComputeRequestSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(1).max(200),
  lang: z.enum(['ne', 'hi', 'en']).default('ne'),
  ayanamsa: z.number().min(1).max(3).default(1), // 1=Lahiri, 2=Raman, 3=Krishnamurti
});

type ComputeRequest = z.infer<typeof ComputeRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both direct birthData and nested birthData
    const requestData = body.birthData || body;
    const { name, date, time, location, lang, ayanamsa } = ComputeRequestSchema.parse(requestData);

    console.log(`Computing horoscope for ${name} born on ${date} at ${time} in ${location}`);

    // Step 1: Geocode location to get coordinates and timezone
    console.log('Step 1: Geocoding location...');
    const geoResult = await geocodingService.getCoordinates(location);
    
    console.log(`Geocoding result: ${geoResult.city}, ${geoResult.country} (${geoResult.latitude}, ${geoResult.longitude})`);

    // Step 2: Convert local time to UTC
    console.log('Step 2: Converting to UTC...');
    const localDateTime = dayjs.tz(`${date} ${time}`, geoResult.timezone);
    const utcDateTime = localDateTime.utc();
    
    console.log(`Local time: ${localDateTime.format('YYYY-MM-DD HH:mm:ss')} ${geoResult.timezone}`);
    console.log(`UTC time: ${utcDateTime.format('YYYY-MM-DD HH:mm:ss')} UTC`);

    // Step 3: Create birth data for Prokerala API
    const birthData = {
      name,
      date: utcDateTime.format('YYYY-MM-DD'),
      time: utcDateTime.format('HH:mm'),
      latitude: geoResult.latitude,
      longitude: geoResult.longitude,
      timezone: 'UTC', // Prokerala expects UTC
      ayanamsa,
    };

    // Validate birth data
    const validatedBirthData = prokeralaService.validateBirthData(birthData);

    // Step 4: Create session in database
    console.log('Step 3: Creating session...');
    const session = await prisma.session.create({
      data: {
        userId: 'anonymous', // TODO: Get from authentication
        birth: {
          create: {
            name,
            date: utcDateTime.toDate(),
            rawDate: date,
            rawTime: time,
            location: `${geoResult.city}, ${geoResult.country}`,
            lat: geoResult.latitude,
            lon: geoResult.longitude,
            tzId: geoResult.timezone,
            tzOffsetMinutes: Math.round(utcDateTime.utcOffset()),
          },
        },
      },
      include: {
        birth: true,
      },
    });

    console.log(`Session created: ${session.id}`);

    // Step 5: Call Prokerala APIs sequentially with rate limiting
    console.log('Step 4: Calling Prokerala APIs...');
    
    let kundliResult, dashasResult, panchangResult;
    
    try {
      // Get Kundli (Birth Chart)
      console.log('Getting Kundli...');
      kundliResult = await prokeralaService.getKundli(validatedBirthData);
      console.log('Kundli received successfully');

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get Dashas (Planetary Periods)
      console.log('Getting Dashas...');
      dashasResult = await prokeralaService.getDashas(validatedBirthData);
      console.log('Dashas received successfully');

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get Panchang (Hindu Calendar)
      console.log('Getting Panchang...');
      panchangResult = await prokeralaService.getPanchang(
        utcDateTime.format('YYYY-MM-DD'),
        geoResult.latitude,
        geoResult.longitude,
        geoResult.timezone
      );
      console.log('Panchang received successfully');

    } catch (prokeralaError) {
      console.error('Prokerala API error:', prokeralaError);
      
      // Update session with error
      await prisma.session.update({
        where: { id: session.id },
        data: {
          result: {
            create: {
              provider: 'prokerala',
              payload: { error: prokeralaError instanceof Error ? prokeralaError.message : 'Unknown error' },
              summary: { error: true, message: 'Failed to compute horoscope' },
            },
          },
        },
      });

      return NextResponse.json({
        success: false,
        error: 'Failed to compute horoscope',
        details: prokeralaError instanceof Error ? prokeralaError.message : 'Unknown error',
        sessionId: session.id,
      }, { status: 500 });
    }

    // Step 6: Create comprehensive horoscope result
    const horoscopeData = {
      kundli: kundliResult,
      dashas: dashasResult,
      panchang: panchangResult,
      computedAt: new Date().toISOString(),
      provider: 'prokerala',
      version: '1.0',
    };

    // Step 7: Extract summary fields for quick access
    const summary = {
      ascendant: {
        sign: kundliResult.ascendant.signName,
        degree: kundliResult.ascendant.degree,
        nakshatra: kundliResult.ascendant.nakshatraName,
      },
      moonSign: {
        sign: kundliResult.moonSign.signName,
        degree: kundliResult.moonSign.degree,
        nakshatra: kundliResult.moonSign.nakshatraName,
      },
      sunSign: {
        sign: kundliResult.sunSign.signName,
        degree: kundliResult.sunSign.degree,
        nakshatra: kundliResult.sunSign.nakshatraName,
      },
      currentDasha: {
        vimshottari: dashasResult.currentPeriod.vimshottari,
        antardasha: dashasResult.currentPeriod.antardasha,
        pratyantardasha: dashasResult.currentPeriod.pratyantardasha,
        sookshmaDasha: dashasResult.currentPeriod.sookshmaDasha,
        yoginiDasha: dashasResult.currentPeriod.yoginiDasha,
      },
      keyYogas: kundliResult.yogas.slice(0, 5).map(yoga => ({
        name: yoga.yogaName,
        type: yoga.yogaType,
        strength: yoga.strength,
      })),
      charts: kundliResult.charts.map(chart => ({
        type: chart.chartType,
        name: chart.chartName,
        planetCount: chart.positions.length,
      })),
      panchang: {
        tithi: panchangResult.panchang.tithi.name,
        nakshatra: panchangResult.panchang.nakshatra.name,
        yoga: panchangResult.panchang.yoga.name,
        karana: panchangResult.panchang.karana.name,
      },
    };

    // Step 8: Save horoscope result to database
    console.log('Step 5: Saving horoscope result...');
    const horoscopeResult = await prisma.horoscopeResult.create({
      data: {
        sessionId: session.id,
        provider: 'prokerala',
        payload: horoscopeData,
        summary: summary,
      },
    });

    console.log(`Horoscope result saved: ${horoscopeResult.id}`);

    // Step 9: Return success response with summary
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        summary: {
          name,
          birthDate: date,
          birthTime: time,
          location: `${geoResult.city}, ${geoResult.country}`,
          ascendant: summary.ascendant,
          moonSign: summary.moonSign,
          sunSign: summary.sunSign,
          currentDasha: summary.currentDasha,
          keyYogas: summary.keyYogas,
          charts: summary.charts,
          panchang: summary.panchang,
        },
        computedAt: horoscopeData.computedAt,
        provider: 'prokerala',
        chatUrl: `/chat?sessionId=${session.id}`,
      },
    });

  } catch (error) {
    console.error('Compute API error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    // Handle geocoding errors
    if (error instanceof Error && error.message.includes('geocoding')) {
      return NextResponse.json({
        success: false,
        error: 'Location not found',
        details: 'Could not find the specified location. Please check the spelling and try again.',
      }, { status: 400 });
    }

    // Handle Prokerala API errors
    if (error instanceof Error && error.message.includes('Prokerala')) {
      return NextResponse.json({
        success: false,
        error: 'Astrology calculation failed',
        details: 'Unable to compute horoscope. Please try again later.',
      }, { status: 500 });
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: 'Unable to save data. Please try again later.',
      }, { status: 500 });
    }

    // Generic error
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check Prokerala API health
    const prokeralaHealth = await prokeralaService.getHealthStatus();
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      services: {
        prokerala: prokeralaHealth.status,
        database: 'healthy',
        geocoding: 'healthy',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
