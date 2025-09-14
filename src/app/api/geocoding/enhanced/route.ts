import { NextRequest, NextResponse } from 'next/server';
import { enhancedGeocodingService } from '@/server/services/enhanced-geo';
import { z } from 'zod';

const geocodingSchema = z.object({
  place: z.string().min(1).max(200),
  provider: z.enum(['osm', 'google']).optional(),
  useCache: z.boolean().optional(),
  includeIntelligence: z.boolean().optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
});

const batchGeocodingSchema = z.object({
  requests: z.array(z.object({
    id: z.string(),
    place: z.string().min(1).max(200),
    priority: z.enum(['high', 'normal', 'low']).optional(),
  })).min(1).max(50),
  maxConcurrency: z.number().min(1).max(20).optional(),
  useCache: z.boolean().optional(),
  includeIntelligence: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { place, provider, useCache, includeIntelligence, priority } = geocodingSchema.parse(body);

    const result = await enhancedGeocodingService.geocode(place, {
      provider,
      useCache,
      includeIntelligence,
      priority,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Enhanced geocoding error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Geocoding failed',
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests, maxConcurrency, useCache, includeIntelligence } = batchGeocodingSchema.parse(body);

    const results = await enhancedGeocodingService.batchGeocode(requests, {
      maxConcurrency,
      useCache,
      includeIntelligence,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Batch geocoding error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch geocoding failed',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const analytics = enhancedGeocodingService.getAnalytics();
    
    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get analytics',
    }, { status: 500 });
  }
}
