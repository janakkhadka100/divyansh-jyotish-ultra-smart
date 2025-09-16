import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';

const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(1000),
  language: z.enum(['ne', 'hi', 'en']).default('ne'),
  cardData: z.any().optional(), // For "Explain This Card" feature
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, language, cardData } = ChatRequestSchema.parse(body);

    // Get session and horoscope data
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        birth: true,
        result: true,
        chats: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 messages for context
        },
      },
    });

    if (!session || !session.result) {
      return NextResponse.json({
        success: false,
        error: 'Session not found or no horoscope data available',
      }, { status: 404 });
    }

    // Get horoscope summary
    const horoscopeSummary = session.result.summary as any;
    const horoscopePayload = session.result.payload as any;

    // Build system prompt based on language
    const systemPrompt = buildSystemPrompt(language, horoscopeSummary, horoscopePayload);
    
    // Build conversation context
    const conversationContext = buildConversationContext(session.chats, language);
    
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
    });

    // Create response stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, done: false })}\n\n`));
            }
          }
          
          // Send final message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
          
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
            category: 'chat',
            action: 'message_sent',
            userId: session.userId,
            sessionId,
            metadata: {
              language,
              messageLength: message.length,
              responseLength: fullResponse.length,
              hasCardData: !!cardData,
            },
            success: true,
          });

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
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
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

// Save user message
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, language } = ChatRequestSchema.parse(body);

    // Save user message to database
    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
        lang: language,
      },
    });

    return NextResponse.json({
      success: true,
      data: chatMessage,
    });

  } catch (error) {
    console.error('Save message error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save message',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Get chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID required',
      }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get chat history',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Helper functions
function buildSystemPrompt(language: string, horoscopeSummary: any, horoscopePayload: any): string {
  const languageConfig = {
    ne: {
      language: 'Nepali',
      examples: [
        'मेरो वर्तमान दशा के हो?',
        'पेसा/व्यवसायतर्फ कुन अवधि राम्रो?',
        'शुभ दिन कहिले?',
        'मेरो जन्मकुण्डलीमा के के छ?',
        'आजको पञ्चाङ्ग के छ?',
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
      ],
    },
  };

  const config = languageConfig[language as keyof typeof languageConfig] || languageConfig.en;

  return `You are a knowledgeable Vedic astrology assistant speaking in ${config.language}. 

IMPORTANT GUIDELINES:
1. Always respond in ${config.language}
2. Be cautious and never make medical or financial guarantees
3. Base your responses on the provided horoscope data
4. Use the saved horoscope summary and payload data
5. If asked about specific cards, explain the JSON data provided
6. Offer helpful insights but remind users that astrology is for guidance only

HOROSCOPE DATA:
${JSON.stringify(horoscopeSummary, null, 2)}

EXAMPLE QUESTIONS YOU CAN ANSWER:
${config.examples.map(ex => `- ${ex}`).join('\n')}

When explaining card data, break down the JSON structure and explain what each field means in astrological terms.`;
}

function buildConversationContext(chats: any[], language: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return chats
    .reverse() // Reverse to get chronological order
    .map(chat => ({
      role: chat.role as 'user' | 'assistant',
      content: chat.content,
    }));
}


