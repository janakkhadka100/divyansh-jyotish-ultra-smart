import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';
import { advancedAIIntelligence } from '@/server/ai/advanced-intelligence';
import { realTimeLearningSystem } from '@/server/ai/real-time-learning';
import { predictiveResponseSystem } from '@/server/ai/predictive-response';
import { rateLimiters, withRateLimit } from '@/server/middleware/rateLimit';
import { createError, createErrorResponse } from '@/server/lib/errors';

const UltraSmartChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(1000),
  language: z.enum(['ne', 'hi', 'en']).default('ne'),
  enableLearning: z.boolean().default(true),
  enablePrediction: z.boolean().default(true),
  enableEmotionRecognition: z.boolean().default(true),
  enableMultiModal: z.boolean().default(true),
  userContext: z.any().optional(),
});

// Apply rate limiting
const rateLimitedHandler = withRateLimit(rateLimiters.chat);

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      sessionId, 
      message, 
      language, 
      enableLearning,
      enablePrediction,
      enableEmotionRecognition,
      enableMultiModal,
      userContext
    } = UltraSmartChatRequestSchema.parse(body);

    // Get session and horoscope data
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        birth: true,
        result: true,
        chats: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!session || !session.result) {
      return createErrorResponse(createError.notFound('Session not found or no horoscope data available'));
    }

    const horoscopeData = session.result.payload as any;
    const horoscopeSummary = session.result.summary as any;

    // Get ultra-intelligent response
    const ultraResponse = await advancedAIIntelligence.getUltraIntelligentResponse(
      message,
      sessionId,
      language,
      horoscopeData,
      userContext
    );

    // Get predictive responses if enabled
    let predictions = [];
    if (enablePrediction) {
      try {
        const predictionResponse = await predictiveResponseSystem.getPredictiveResponses({
          sessionId,
          query: message,
          context: userContext,
          userProfile: ultraResponse.metadata,
          horoscopeData,
          language,
        });
        predictions = predictionResponse.predictions;
      } catch (error) {
        console.warn('Prediction failed:', error);
      }
    }

    // Learn from interaction if enabled
    if (enableLearning) {
      try {
        await realTimeLearningSystem.learnFromInteraction(
          sessionId,
          session.userId,
          message,
          ultraResponse.response,
          ultraResponse.metadata.responseTime,
          userContext,
          ultraResponse.metadata
        );
      } catch (error) {
        console.warn('Learning failed:', error);
      }
    }

    // Save chat message to database
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: ultraResponse.response,
        lang: language,
      },
    });

    // Track analytics
    await analyticsService.trackEvent({
      type: 'performance',
      category: 'ultra_smart_chat',
      action: 'ultra_intelligent_response',
      userId: session.userId,
      sessionId,
      metadata: {
        message,
        language,
        responseTime: ultraResponse.metadata.responseTime,
        emotionalContext: ultraResponse.emotionalContext.emotion,
        predictionCount: predictions.length,
        learningEnabled: enableLearning,
        predictionEnabled: enablePrediction,
        emotionRecognitionEnabled: enableEmotionRecognition,
        multiModalEnabled: enableMultiModal,
      },
      success: true,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        response: ultraResponse.response,
        metadata: {
          ...ultraResponse.metadata,
          predictions: predictions.length,
          learningInsights: ultraResponse.learningInsights,
          emotionalContext: ultraResponse.emotionalContext,
        },
        predictions: predictions.map(p => ({
          response: p.response,
          confidence: p.confidence,
          reasoning: p.reasoning,
        })),
        emotionalContext: ultraResponse.emotionalContext,
        learningInsights: ultraResponse.learningInsights,
      },
    });

  } catch (error) {
    console.error('Ultra Smart Chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(createError.validation('Invalid request data'));
    }

    return createErrorResponse(createError.internal('Failed to process ultra smart chat request'));
  }
}

// Get ultra smart chat analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type') || 'stats';

    if (!sessionId) {
      return createErrorResponse(createError.validation('Session ID required'));
    }

    switch (type) {
      case 'stats':
        const stats = await getUltraSmartStats(sessionId);
        return NextResponse.json({
          success: true,
          data: stats,
        });

      case 'learning':
        const learningInsights = await realTimeLearningSystem.getLearningInsights(sessionId);
        return NextResponse.json({
          success: true,
          data: learningInsights,
        });

      case 'predictions':
        const predictionStats = predictiveResponseSystem.getPredictionStats();
        return NextResponse.json({
          success: true,
          data: predictionStats,
        });

      case 'intelligence':
        const intelligenceStats = advancedAIIntelligence.getCacheStats();
        return NextResponse.json({
          success: true,
          data: intelligenceStats,
        });

      default:
        return createErrorResponse(createError.validation('Invalid type parameter'));
    }

  } catch (error) {
    console.error('Ultra Smart Chat GET error:', error);
    return createErrorResponse(createError.internal('Failed to get ultra smart chat data'));
  }
}

// Helper function to get ultra smart stats
async function getUltraSmartStats(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      chats: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const learningInsights = await realTimeLearningSystem.getLearningInsights(sessionId);
  const predictionStats = predictiveResponseSystem.getPredictionStats();
  const intelligenceStats = advancedAIIntelligence.getCacheStats();

  return {
    session: {
      id: session.id,
      createdAt: session.createdAt,
      chatCount: session.chats.length,
    },
    learning: learningInsights,
    predictions: predictionStats,
    intelligence: intelligenceStats,
    performance: {
      averageResponseTime: learningInsights.averageSatisfaction * 1000,
      userSatisfaction: learningInsights.averageSatisfaction,
      learningProgress: learningInsights.learningProgress,
      predictionAccuracy: predictionStats.averageAccuracy,
    },
  };
}
