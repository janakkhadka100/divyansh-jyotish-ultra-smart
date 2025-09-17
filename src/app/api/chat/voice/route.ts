import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

// Voice chat API for speech-to-text and text-to-speech
const VoiceChatSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional(),
  language: z.enum(['ne', 'hi', 'en']).default('ne'),
  voiceEnabled: z.boolean().default(false)
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Voice-optimized ChatGPT call
async function callChatGPTVoice(message: string, language: string = 'ne') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompts = {
    ne: `तपाईं दिव्यांश ज्योतिषका विशेषज्ञ हुनुहुन्छ। नेपाली भाषामा छोटो र स्पष्ट उत्तर दिनुहोस्।`,
    hi: `आप दिव्यांश ज्योतिष के विशेषज्ञ हैं। हिंदी भाषा में संक्षिप्त और स्पष्ट उत्तर दें।`,
    en: `You are a Divyansh Jyotish expert. Provide brief and clear answers in English.`
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompts[language as keyof typeof systemPrompts] },
        { role: 'user', content: message }
      ],
      max_tokens: 300, // Shorter for voice
      temperature: 0.7,
    });

    return {
      message: response.choices[0]?.message?.content || 'Sorry, I could not respond.',
      timestamp: new Date().toISOString(),
      type: 'ai',
      language
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      message: 'Sorry, AI service is not available.',
      timestamp: new Date().toISOString(),
      type: 'ai',
      language
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, language, voiceEnabled } = VoiceChatSchema.parse(body);

    console.log(`Voice chat request: ${message} (${language})`);

    // Call ChatGPT with voice optimization
    const aiResponse = await callChatGPTVoice(message, language);

    return NextResponse.json({
      success: true,
      data: {
        id: Date.now().toString(),
        message,
        response: aiResponse.message,
        timestamp: aiResponse.timestamp,
        type: 'ai',
        language: aiResponse.language,
        voiceEnabled,
        audioUrl: voiceEnabled ? `/api/tts?text=${encodeURIComponent(aiResponse.message)}&lang=${language}` : null
      },
    });

  } catch (error) {
    console.error('Voice chat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process voice chat request',
      message: 'Sorry, something went wrong.'
    }, { status: 500 });
  }
}


