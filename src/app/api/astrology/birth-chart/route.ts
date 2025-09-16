import { NextRequest, NextResponse } from 'next/server';
import { prokeralaService } from '@/server/services/prokerala';
import { z } from 'zod';

const birthDataSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  datetime: z.string(),
  timezone: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = birthDataSchema.parse(body);

    const birthChart = await prokeralaService.getBirthChart(validatedData);

    return NextResponse.json({
      success: true,
      data: birthChart,
    });
  } catch (error) {
    console.error('Birth chart API error:', error);
    
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
        error: 'Failed to generate birth chart',
      },
      { status: 500 }
    );
  }
}

