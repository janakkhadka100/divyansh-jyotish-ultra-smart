import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';
import { aiOptimizationService } from '@/server/services/ai-optimization';

const SmartChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(1000),
  language: z.enum(['ne', 'hi', 'en']).default('ne'),
  cardData: z.any().optional(),
  enableOptimization: z.boolean().default(true),
  enablePrediction: z.boolean().default(true),
  enableCaching: z.boolean().default(true),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      sessionId, 
      message, 
      language, 
      cardData, 
      enableOptimization,
      enablePrediction,
      enableCaching 
    } = SmartChatRequestSchema.parse(body);

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
      return NextResponse.json({
        success: false,
        error: 'Session not found or no horoscope data available',
      }, { status: 404 });
    }

    const horoscopeData = session.result.payload as any;
    const horoscopeSummary = session.result.summary as any;

    // Use AI optimization service if enabled
    if (enableOptimization) {
      try {
        const optimizedResponse = await aiOptimizationService.getOptimizedResponse(
          message,
          sessionId,
          language,
          horoscopeData
        );

        if (optimizedResponse.fromCache) {
          // Return cached response immediately
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                response: optimizedResponse.response,
                fromCache: true,
                confidence: optimizedResponse.confidence,
                metadata: optimizedResponse.metadata,
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Response-Source': 'cache',
                'X-Response-Time': `${Date.now() - startTime}ms`,
              },
            }
          );
        }
      } catch (error) {
        console.warn('AI Optimization failed, falling back to standard response:', error);
      }
    }

    // Build smart system prompt
    const systemPrompt = buildSmartSystemPrompt(language, horoscopeSummary, horoscopeData, session.chats);
    
    // Build conversation context
    const conversationContext = buildSmartConversationContext(session.chats, language);
    
    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationContext,
      {
        role: 'user',
        content: cardData ? `Explain this card data: ${JSON.stringify(cardData)}` : message,
      },
    ];

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    // Create response stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        let tokenCount = 0;
        const startStreamTime = Date.now();
        
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              tokenCount++;
              
              // Send streaming data
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                content, 
                done: false,
                tokenCount,
                streamTime: Date.now() - startStreamTime
              })}\n\n`));
            }
          }
          
          // Send final message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            content: '', 
            done: true,
            totalTokens: tokenCount,
            totalTime: Date.now() - startTime
          })}\n\n`));
          
          // Save chat message to database
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'assistant',
              content: fullResponse,
              lang: language,
            },
          });

          // Track analytics
          await analyticsService.trackEvent({
            type: 'user_action',
            category: 'smart_chat',
            action: 'message_sent',
            userId: session.userId,
            sessionId,
            metadata: {
              language,
              messageLength: message.length,
              responseLength: fullResponse.length,
              tokenCount,
              responseTime: Date.now() - startTime,
              hasCardData: !!cardData,
              optimizationEnabled: enableOptimization,
            },
            success: true,
            duration: Date.now() - startTime,
          });

          // Update AI optimization context
          if (enableOptimization) {
            try {
              await aiOptimizationService.getOptimizedResponse(
                message,
                sessionId,
                language,
                horoscopeData
              );
            } catch (error) {
              console.warn('Failed to update AI optimization context:', error);
            }
          }

        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Response-Source': 'ai_generated',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });

  } catch (error) {
    console.error('Smart Chat API error:', error);
    
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

// Get smart chat analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type') || 'stats';

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID required',
      }, { status: 400 });
    }

    switch (type) {
      case 'stats':
        const stats = await getChatStats(sessionId);
        return NextResponse.json({
          success: true,
          data: stats,
        });

      case 'cache':
        const cacheStats = aiOptimizationService.getCacheStats();
        return NextResponse.json({
          success: true,
          data: cacheStats,
        });

      case 'context':
        const context = await getSmartContext(sessionId);
        return NextResponse.json({
          success: true,
          data: context,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Smart Chat GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get smart chat data',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Helper functions
function buildSmartSystemPrompt(
  language: string, 
  horoscopeSummary: any, 
  horoscopeData: any, 
  recentChats: any[]
): string {
  const languageConfig = {
    ne: {
      language: 'Nepali',
      examples: [
        'मेरो वर्तमान दशा के हो?',
        'पेसा/व्यवसायतर्फ कुन अवधि राम्रो?',
        'शुभ दिन कहिले?',
        'मेरो जन्मकुण्डलीमा के के छ?',
        'आजको पञ्चाङ्ग के छ?',
        'मेरो लग्न के हो?',
        'चन्द्र राशि के हो?',
        'मुख्य योगहरू के के छन्?',
      ],
    },
    hi: {
      language: 'Hindi',
      examples: [
        'मेरी वर्तमान दशा क्या है?',
        'धन/व्यापार के लिए कौन सा समय अच्छा है?',
        'शुभ दिन कब है?',
        'मेरी जन्मकुंडली में क्या क्या है?',
        'आज का पंचांग क्या है?',
        'मेरा लग्न क्या है?',
        'चंद्र राशि क्या है?',
        'मुख्य योग क्या हैं?',
      ],
    },
    en: {
      language: 'English',
      examples: [
        'What is my current dasha?',
        'Which period is good for money/business?',
        'When are the auspicious days?',
        'What is in my birth chart?',
        'What is today\'s panchang?',
        'What is my ascendant?',
        'What is my moon sign?',
        'What are the key yogas?',
      ],
    },
  };

  const config = languageConfig[language as keyof typeof languageConfig] || languageConfig.en;

  // Extract recent topics from chat history
  const recentTopics = extractRecentTopics(recentChats);
  
  return `You are an intelligent, wise, and fast Vedic astrology assistant speaking in ${config.language}.

PERSONALITY & INTELLIGENCE:
- Be extremely smart and insightful
- Respond quickly and efficiently
- Anticipate user needs and provide comprehensive answers
- Use your knowledge to give the most helpful responses
- Be wise, patient, and deeply knowledgeable about Vedic astrology
- Always respond in ${config.language}

CURRENT ASTROLOGICAL CONTEXT:
${JSON.stringify(horoscopeSummary, null, 2)}

RECENT CONVERSATION TOPICS:
${recentTopics.join(', ')}

IMPORTANT GUIDELINES:
1. Always respond in ${config.language}
2. Be cautious and never make medical or financial guarantees
3. Base your responses on the provided horoscope data
4. Use the saved horoscope summary and payload data
5. Offer helpful insights but remind users that astrology is for guidance only
6. Be concise but comprehensive - provide the most valuable information
7. Anticipate follow-up questions and provide related insights
8. Use your intelligence to provide the best possible guidance

EXAMPLE QUESTIONS YOU CAN ANSWER:
${config.examples.map(ex => `- ${ex}`).join('\n')}

HOROSCOPE DATA:
${JSON.stringify(horoscopeData, null, 2)}

Be intelligent, fast, and provide the most helpful response possible. Use your wisdom to guide the user effectively.`;
}

function buildSmartConversationContext(chats: any[], language: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return chats
    .reverse() // Reverse to get chronological order
    .slice(0, 5) // Only last 5 messages for context
    .map(chat => ({
      role: chat.role as 'user' | 'assistant',
      content: chat.content,
    }));
}

function extractRecentTopics(chats: any[]): string[] {
  const topics = new Set<string>();
  
  chats.forEach(chat => {
    const content = chat.content.toLowerCase();
    
    if (content.includes('दशा') || content.includes('dasha')) topics.add('दशा/दशा');
    if (content.includes('योग') || content.includes('yoga')) topics.add('योग/योग');
    if (content.includes('ग्रह') || content.includes('planet')) topics.add('ग्रह/ग्रह');
    if (content.includes('राशि') || content.includes('sign')) topics.add('राशि/राशि');
    if (content.includes('घर') || content.includes('house')) topics.add('घर/घर');
    if (content.includes('पञ्चाङ्ग') || content.includes('panchang')) topics.add('पञ्चाङ्ग/पंचांग');
    if (content.includes('लग्न') || content.includes('ascendant')) topics.add('लग्न/लग्न');
    if (content.includes('चन्द्र') || content.includes('moon')) topics.add('चन्द्र/चंद्र');
  });
  
  return Array.from(topics);
}

async function getChatStats(sessionId: string) {
  const stats = await prisma.chatMessage.groupBy({
    by: ['role'],
    where: { sessionId },
    _count: { role: true },
  });

  const totalMessages = await prisma.chatMessage.count({
    where: { sessionId },
  });

  return {
    totalMessages,
    byRole: stats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.role;
      return acc;
    }, {} as Record<string, number>),
  };
}

async function getSmartContext(sessionId: string) {
  const recentChats = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    recentTopics: extractRecentTopics(recentChats),
    messageCount: recentChats.length,
    lastMessage: recentChats[0]?.createdAt,
  };
}




