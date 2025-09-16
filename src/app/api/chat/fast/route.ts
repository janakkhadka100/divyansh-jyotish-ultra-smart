import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

// Fast chat API with optimized performance
const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional(),
  birthData: z.object({
    name: z.string().optional(),
    date: z.string(),
    time: z.string(),
    location: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    timezone: z.string().optional(),
    ayanamsa: z.number().default(1)
  }).optional()
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cached responses for common questions
const responseCache = new Map();

// Quick question type detection
function detectQuestionType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('करियर') || lowerMessage.includes('काम')) return 'career';
  if (lowerMessage.includes('प्रेम') || lowerMessage.includes('विवाह')) return 'love';
  if (lowerMessage.includes('स्वास्थ्य') || lowerMessage.includes('रोग')) return 'health';
  if (lowerMessage.includes('धन') || lowerMessage.includes('पैसा')) return 'finance';
  if (lowerMessage.includes('शिक्षा') || lowerMessage.includes('पढाई')) return 'education';
  if (lowerMessage.includes('दशा') || lowerMessage.includes('महादशा')) return 'dasha';
  if (lowerMessage.includes('कुण्डली') || lowerMessage.includes('जन्मकुण्डली')) return 'kundli';
  if (lowerMessage.includes('आज') || lowerMessage.includes('शुभ')) return 'daily';
  return 'general';
}

// Optimized ChatGPT call
async function callChatGPTFast(message: string, birthData?: any) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Check cache first
  const cacheKey = `${message}-${JSON.stringify(birthData)}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const questionType = detectQuestionType(message);
  
  // Build optimized system prompt
  let systemPrompt = `तपाईं दिव्यांश ज्योतिषका विशेषज्ञ हुनुहुन्छ। नेपाली भाषामा उत्तर दिनुहोस्।`;

  if (birthData) {
    systemPrompt += `

**जन्म विवरण:**
- नाम: ${birthData.name || 'अज्ञात'}
- जन्म मिति: ${birthData.date}
- जन्म समय: ${birthData.time}
- जन्म स्थान: ${birthData.location}

**प्रश्नको प्रकार:** ${questionType}

तपाईंले यो जन्म विवरणको आधारमा ज्योतिषीय विश्लेषण गर्नुहोस्।`;
  } else {
    systemPrompt += `

**प्रश्नको प्रकार:** ${questionType}

यदि तपाईंलाई जन्म विवरण चाहिएको छ भने, निम्न जानकारी माग्नुहोस्:
- जन्म मिति (YYYY-MM-DD)
- जन्म समय (HH:MM)
- जन्म स्थान
- नाम`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Faster model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500, // Shorter responses
      temperature: 0.7,
    });

    const result = {
      message: response.choices[0]?.message?.content || 'माफ गर्नुहोस्, मैले उत्तर दिन सकिन।',
      timestamp: new Date().toISOString(),
      type: 'ai',
      questionType
    };

    // Cache the response
    responseCache.set(cacheKey, result);
    
    // Clear cache if it gets too large
    if (responseCache.size > 100) {
      responseCache.clear();
    }

    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      message: 'माफ गर्नुहोस्, अहिले AI सेवा उपलब्ध छैन।',
      timestamp: new Date().toISOString(),
      type: 'ai',
      questionType
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, birthData } = ChatSchema.parse(body);

    console.log(`Fast chat request: ${message}`);

    // Call ChatGPT with optimized settings
    const aiResponse = await callChatGPTFast(message, birthData);

    return NextResponse.json({
      success: true,
      data: {
        id: Date.now().toString(),
        message,
        response: aiResponse.message,
        timestamp: aiResponse.timestamp,
        type: 'ai',
        questionType: aiResponse.questionType,
        hasAstrologicalData: !!birthData,
        performance: 'fast'
      },
    });

  } catch (error) {
    console.error('Fast chat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process chat request',
      message: 'माफ गर्नुहोस्, केही समस्या भयो।'
    }, { status: 500 });
  }
}
