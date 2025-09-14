import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { z } from 'zod';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  lang: z.string().default('ne'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = chatMessageSchema.parse(body);

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    // Create chat message
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: id,
        role: validatedData.role,
        content: validatedData.content,
        lang: validatedData.lang,
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Chat message creation error:', error);
    
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
        error: 'Failed to create chat message',
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

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Chat messages fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chat messages',
      },
      { status: 500 }
    );
  }
}
