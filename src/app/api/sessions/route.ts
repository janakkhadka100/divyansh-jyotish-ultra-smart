import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { z } from 'zod';

const createSessionSchema = z.object({
  userId: z.string().optional(),
  name: z.string().optional(),
  locale: z.string().default('ne'),
  birthData: z.object({
    name: z.string().optional(),
    rawDate: z.string(),
    rawTime: z.string(),
    location: z.string(),
    lat: z.number(),
    lon: z.number(),
    tzId: z.string(),
    tzOffsetMinutes: z.number(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    // Create or find user
    let user;
    if (validatedData.userId) {
      user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: validatedData.name,
          locale: validatedData.locale,
        },
      });
    }

    // Create session with birth input
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        birth: {
          create: {
            name: validatedData.birthData.name,
            date: new Date(`${validatedData.birthData.rawDate}T${validatedData.birthData.rawTime}:00Z`),
            rawDate: validatedData.birthData.rawDate,
            rawTime: validatedData.birthData.rawTime,
            location: validatedData.birthData.location,
            lat: validatedData.birthData.lat,
            lon: validatedData.birthData.lon,
            tzId: validatedData.birthData.tzId,
            tzOffsetMinutes: validatedData.birthData.tzOffsetMinutes,
          },
        },
      },
      include: {
        birth: true,
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    
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
        error: 'Failed to create session',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const sessions = await prisma.session.findMany({
      where: { userId },
      include: {
        birth: true,
        result: true,
        chats: {
          orderBy: { createdAt: 'asc' },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sessions',
      },
      { status: 500 }
    );
  }
}


