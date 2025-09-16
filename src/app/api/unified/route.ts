import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { integratedAPIService } from '@/server/services/integrated-api';

// Unified API request schema
const UnifiedRequestSchema = z.object({
  action: z.enum(['compute', 'chat', 'geocode']),
  data: z.any(),
});

// Compute action schema
const ComputeDataSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(1),
  language: z.enum(['ne', 'hi', 'en']).default('ne'),
  ayanamsa: z.number().default(1),
});

// Chat action schema
const ChatDataSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.enum(['ne', 'hi', 'en']).default('ne'),
  astrologicalData: z.any().optional(),
});

// Geocode action schema
const GeocodeDataSchema = z.object({
  location: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = UnifiedRequestSchema.parse(body);

    switch (action) {
      case 'compute':
        return await handleCompute(data);
      case 'chat':
        return await handleChat(data);
      case 'geocode':
        return await handleGeocode(data);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Unified API error:', error);

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

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

async function handleCompute(data: any) {
  try {
    const validatedData = ComputeDataSchema.parse(data);

    // Get geocoding data first
    const geoData = await integratedAPIService.getGeocodingData(validatedData.location);

    // Prepare birth data for ProKerala
    const birthData = {
      name: validatedData.name,
      date: validatedData.date,
      time: validatedData.time,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      timezone: geoData.timezone,
      ayanamsa: validatedData.ayanamsa,
    };

    // Get astrological data
    const astrologicalData = await integratedAPIService.getAstrologicalData(birthData);

    // Create session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        astrologicalData,
        geoData,
        language: validatedData.language,
        computedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Compute error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to compute horoscope',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleChat(data: any) {
  try {
    const validatedData = ChatDataSchema.parse(data);

    // Get AI response
    const aiResponse = await integratedAPIService.getAIResponse(validatedData, validatedData.astrologicalData);

    return NextResponse.json({
      success: true,
      data: {
        ...aiResponse,
        sessionId: validatedData.sessionId,
        userId: validatedData.userId,
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI response',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleGeocode(data: any) {
  try {
    const validatedData = GeocodeDataSchema.parse(data);

    // Get geocoding data
    const geoData = await integratedAPIService.getGeocodingData(validatedData.location);

    return NextResponse.json({
      success: true,
      data: geoData,
    });

  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get geocoding data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const health = await integratedAPIService.healthCheck();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}
