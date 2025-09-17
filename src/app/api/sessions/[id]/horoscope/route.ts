import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { prokeralaService } from '@/server/services/prokerala';
import { z } from 'zod';

const generateHoroscopeSchema = z.object({
  sessionId: z.string(),
  provider: z.string().default('prokerala'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = generateHoroscopeSchema.parse(body);

    // Get session with birth data
    const session = await prisma.session.findUnique({
      where: { id },
      include: { birth: true },
    });

    if (!session || !session.birth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session or birth data not found',
        },
        { status: 404 }
      );
    }

    // Generate horoscope using Prokerala API
    const horoscopeData = await prokeralaService.getBirthChart({
      latitude: session.birth.lat,
      longitude: session.birth.lon,
      datetime: session.birth.date.toISOString(),
      timezone: session.birth.tzId,
    });

    // Create horoscope result
    const result = await prisma.horoscopeResult.create({
      data: {
        sessionId: id,
        provider: validatedData.provider,
        payload: horoscopeData,
        summary: {
          // Extract key information for UI
          sunSign: horoscopeData.data?.kundli?.sun?.sign || 'Unknown',
          moonSign: horoscopeData.data?.kundli?.moon?.sign || 'Unknown',
          ascendant: horoscopeData.data?.kundli?.ascendant?.sign || 'Unknown',
          currentDasha: horoscopeData.data?.dasha?.current || 'Unknown',
          yogas: horoscopeData.data?.yogas || [],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Horoscope generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate horoscope',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await prisma.horoscopeResult.findUnique({
      where: { sessionId: id },
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Horoscope result not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Horoscope fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch horoscope',
      },
      { status: 500 }
    );
  }
}




