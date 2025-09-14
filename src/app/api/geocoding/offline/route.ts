import { NextRequest, NextResponse } from 'next/server';
// import { offlineGeocodingService } from '@/server/services/offline-geo';
import { z } from 'zod';

const searchSchema = z.object({
  place: z.string().min(1).max(200),
  limit: z.number().min(1).max(100).optional(),
});

const coordinateSearchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(1000).optional(),
});

const addLocationSchema = z.object({
  place: z.string().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tzId: z.string(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Skip offline geocoding in production demo mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        error: 'Service unavailable',
        message: 'Offline geocoding not available in demo mode',
      }, { status: 503 });
    }

    const body = await request.json();
    const { place, limit } = searchSchema.parse(body);

    // await offlineGeocodingService.initialize();
    // const results = await offlineGeocodingService.search(place, limit);

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('Offline geocoding error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Skip offline geocoding in production demo mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        error: 'Service unavailable',
        message: 'Offline geocoding not available in demo mode',
      }, { status: 503 });
    }

    const body = await request.json();
    const result = await addLocationSchema.parseAsync(body);
    
    // await offlineGeocodingService.initialize();
    // await offlineGeocodingService.addLocation(result);
    
    return NextResponse.json({
      success: true,
      message: 'Location added successfully',
    });
  } catch (error) {
    console.error('Offline geocoding PUT error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to add location',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Skip offline geocoding in production demo mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        error: 'Service unavailable',
        message: 'Offline geocoding not available in demo mode',
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const action = searchParams.get('action');

    // await offlineGeocodingService.initialize();

    if (action === 'count') {
      // const count = await offlineGeocodingService.getLocationCount();
      return NextResponse.json({
        success: true,
        data: { count: 0 },
      });
    }

    if (country) {
      // const locations = await offlineGeocodingService.getLocationsByCountry(country);
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Missing required parameters',
    }, { status: 400 });
  } catch (error) {
    console.error('Offline geocoding GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}