import { NextRequest, NextResponse } from 'next/server';
import { offlineGeocodingService } from '@/server/services/offline-geo';
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
  tzOffsetMinutes: z.number(),
  city: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  population: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { place, limit } = searchSchema.parse(body);

    await offlineGeocodingService.initialize();
    const results = await offlineGeocodingService.search(place, limit);

    return NextResponse.json({
      success: true,
      data: results,
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
      error: error instanceof Error ? error.message : 'Offline geocoding failed',
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, radiusKm } = coordinateSearchSchema.parse(body);

    await offlineGeocodingService.initialize();
    const results = await offlineGeocodingService.searchByCoordinates(lat, lon, radiusKm);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Coordinate search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Coordinate search failed',
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const locationData = addLocationSchema.parse(body);

    await offlineGeocodingService.initialize();
    await offlineGeocodingService.addLocation(locationData);

    return NextResponse.json({
      success: true,
      message: 'Location added successfully',
    });
  } catch (error) {
    console.error('Add location error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add location',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const action = searchParams.get('action');

    await offlineGeocodingService.initialize();

    if (action === 'count') {
      const count = await offlineGeocodingService.getLocationCount();
      return NextResponse.json({
        success: true,
        data: { count },
      });
    }

    if (country) {
      const locations = await offlineGeocodingService.getLocationsByCountry(country);
      return NextResponse.json({
        success: true,
        data: locations,
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
      error: error instanceof Error ? error.message : 'Failed to get data',
    }, { status: 500 });
  }
}
