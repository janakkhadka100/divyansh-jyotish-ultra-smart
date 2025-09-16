import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { createError, createErrorResponse } from '@/server/lib/errors';
import { analyticsService } from '@/server/services/analytics';

// DELETE /api/session/[id] - Delete session and all associated data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return createErrorResponse(createError.validation('Session ID is required'));
    }

    // Get session details for analytics
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        birth: true,
        result: true,
        chats: true,
      },
    });

    if (!session) {
      return createErrorResponse(createError.notFound('Session not found'));
    }

    // Delete all associated data in the correct order
    await prisma.$transaction(async (tx) => {
      // Delete chat messages
      await tx.chatMessage.deleteMany({
        where: { sessionId },
      });

      // Delete horoscope result
      await tx.horoscopeResult.deleteMany({
        where: { sessionId },
      });

      // Delete birth input
      await tx.birthInput.deleteMany({
        where: { sessionId },
      });

      // Delete session
      await tx.session.delete({
        where: { id: sessionId },
      });
    });

    // Track data deletion event
    await analyticsService.trackEvent({
      type: 'user_action',
      category: 'data_privacy',
      action: 'session_deleted',
      userId: session.userId,
      sessionId,
      metadata: {
        birthDataDeleted: !!session.birth,
        horoscopeDataDeleted: !!session.result,
        chatMessagesDeleted: session.chats.length,
        deletionTimestamp: new Date().toISOString(),
      },
      success: true,
      duration: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Session and all associated data deleted successfully',
      deletedData: {
        sessionId,
        birthData: !!session.birth,
        horoscopeData: !!session.result,
        chatMessages: session.chats.length,
      },
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    
    await analyticsService.trackEvent({
      type: 'error',
      category: 'data_privacy',
      action: 'session_deletion_failed',
      sessionId: params.id,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      success: false,
      duration: 0,
    });

    return createErrorResponse(createError.internal('Failed to delete session'));
  }
}

// GET /api/session/[id] - Get session details (for user verification)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return createErrorResponse(createError.validation('Session ID is required'));
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        birth: {
          select: {
            name: true,
            location: true,
            // Don't expose exact coordinates or birth time
          },
        },
        result: {
          select: {
            provider: true,
            // Don't expose full payload, just metadata
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    if (!session) {
      return createErrorResponse(createError.notFound('Session not found'));
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        createdAt: session.createdAt,
        birth: session.birth ? {
          name: session.birth.name,
          location: session.birth.location,
        } : null,
        result: session.result ? {
          provider: session.result.provider,
          hasData: true,
        } : null,
        chatCount: session._count.chats,
      },
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return createErrorResponse(createError.internal('Failed to fetch session'));
  }
}



