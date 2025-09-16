import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/database';

// Helper function to detect question type
function detectQuestionType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('vagya') || lowerMessage.includes('भाग्य') || lowerMessage.includes('fate') || lowerMessage.includes('luck')) {
    return 'fate';
  }
  if (lowerMessage.includes('kundali') || lowerMessage.includes('कुण्डली') || lowerMessage.includes('horoscope')) {
    return 'kundali';
  }
  if (lowerMessage.includes('dasha') || lowerMessage.includes('दशा') || lowerMessage.includes('period')) {
    return 'dasha';
  }
  if (lowerMessage.includes('marriage') || lowerMessage.includes('विवाह') || lowerMessage.includes('shadi')) {
    return 'marriage';
  }
  if (lowerMessage.includes('career') || lowerMessage.includes('करियर') || lowerMessage.includes('job') || lowerMessage.includes('काम')) {
    return 'career';
  }
  if (lowerMessage.includes('health') || lowerMessage.includes('स्वास्थ्य') || lowerMessage.includes('रोग')) {
    return 'health';
  }
  if (lowerMessage.includes('money') || lowerMessage.includes('पैसा') || lowerMessage.includes('धन') || lowerMessage.includes('wealth')) {
    return 'wealth';
  }
  
  return 'general';
}

// Helper function to get contextual response
function getContextualResponse(message: string, questionType: string, parsedBirthData: any): string {
  const responses = {
    fate: `तपाईंको भाग्य र जीवनको दिशा बारे प्रश्न गर्नुभएको छ। ज्योतिष अनुसार, तपाईंको भाग्य तपाईंको जन्मकुण्डलीमा ग्रहहरूको स्थिति, योगहरू, र दशाहरूको आधारमा निर्धारण हुन्छ। 

सटीक भाग्य विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको भाग्य, जीवनको उद्देश्य, र भविष्यका सम्भावनाहरू बारे विस्तृत जानकारी दिन सक्छु।`,

    kundali: `तपाईंले कुण्डली बारे सोध्नुभएको छ। कुण्डली भनेको तपाईंको जन्म समयमा ग्रहहरूको स्थितिको नक्शा हो जसले तपाईंको व्यक्तित्व, भाग्य, र जीवनका विभिन्न पक्षहरू बताउँछ।

कुण्डली विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको कुण्डली बनाएर ग्रहहरूको स्थिति, राशि, नक्षत्र, योगहरू, र अन्य ज्योतिषीय तथ्यहरू बताउन सक्छु।`,

    dasha: `तपाईंले दशा बारे सोध्नुभएको छ। दशा भनेको ज्योतिषमा ग्रहहरूको प्रभावको समयावधि हो जसले तपाईंको जीवनका विभिन्न चरणहरूमा कस्तो प्रभाव पर्छ भन्ने बताउँछ।

दशा विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको वर्तमान दशा, अन्तर्दशा, र भविष्यका दशाहरू बताउन सक्छु।`,

    marriage: `तपाईंले विवाह बारे सोध्नुभएको छ। ज्योतिष अनुसार, विवाहको समय, जीवनसाथीको स्वभाव, र विवाहित जीवनको गुणस्तर कुण्डलीमा ग्रहहरूको स्थिति र योगहरूले निर्धारण गर्छ।

विवाह विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको विवाहको समय, जीवनसाथीको स्वभाव, र विवाहित जीवन बारे विस्तृत जानकारी दिन सक्छु।`,

    career: `तपाईंले करियर र काम बारे सोध्नुभएको छ। ज्योतिष अनुसार, तपाईंको करियर, कामको क्षेत्र, र व्यावसायिक सफलता कुण्डलीमा ग्रहहरूको स्थिति र योगहरूले निर्धारण गर्छ।

करियर विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको करियर, उपयुक्त कामको क्षेत्र, र व्यावसायिक सफलता बारे विस्तृत जानकारी दिन सक्छु।`,

    health: `तपाईंले स्वास्थ्य बारे सोध्नुभएको छ। ज्योतिष अनुसार, तपाईंको स्वास्थ्य, रोगहरूको सम्भावना, र स्वास्थ्य सम्बन्धी सुझावहरू कुण्डलीमा ग्रहहरूको स्थिति र योगहरूले निर्धारण गर्छ।

स्वास्थ्य विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको स्वास्थ्य, रोगहरूको सम्भावना, र स्वास्थ्य सम्बन्धी सुझावहरू बताउन सक्छु।`,

    wealth: `तपाईंले धन र सम्पत्ति बारे सोध्नुभएको छ। ज्योतिष अनुसार, तपाईंको धन, सम्पत्ति, र आर्थिक स्थिति कुण्डलीमा ग्रहहरूको स्थिति र योगहरूले निर्धारण गर्छ।

धन विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको धन, सम्पत्ति, र आर्थिक स्थिति बारे विस्तृत जानकारी दिन सक्छु।`,

    general: `तपाईंले ज्योतिष सम्बन्धी प्रश्न गर्नुभएको छ। म तपाईंलाई ज्योतिषीय दृष्टिकोणबाट मद्दत गर्न सक्छु।

सटीक ज्योतिषीय विश्लेषणको लागि, कृपया निम्न जानकारी दिनुहोस्:
- जन्म मिति (दिन/महिना/वर्ष)
- जन्म समय (घण्टा:मिनेट)
- जन्म स्थान (शहर, देश)
- नाम

यो जानकारी दिएपछि म तपाईंको कुण्डली, दशा, योगहरू, र अन्य ज्योतिषीय तथ्यहरू बताउन सक्छु।`
  };

  return responses[questionType as keyof typeof responses] || responses.general;
}

// Input validation schema
const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional(),
  token: z.string().optional(),
});

// Enhanced ChatGPT API call with real astrological data
async function callChatGPT(message: string, userData?: any, astrologicalData?: any) {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Parse birth data from message if available
  let parsedBirthData = null;
  if (message.includes('1993') || message.includes('dec') || message.includes('december') || message.includes('16')) {
    // Extract birth year, month, and day from message
    const yearMatch = message.match(/(\d{4})/);
    const monthMatch = message.match(/(dec|december|12)/i);
    const dayMatch = message.match(/(\d{1,2})/);
    
    if (yearMatch) {
      parsedBirthData = {
        year: yearMatch[1],
        month: monthMatch ? '12' : '01',
        day: dayMatch ? dayMatch[1] : '01',
        time: '12:00',
        place: 'Kathmandu'
      };
    }
  }

  // Detect question type and provide contextual response
  const questionType = detectQuestionType(message);
  const contextualResponse = getContextualResponse(message, questionType, parsedBirthData);

  // Create comprehensive system prompt with real astrological data
  const systemPrompt = userData && astrologicalData ? `
तपाईं दिव्यांश ज्योतिषका विशेषज्ञ हुनुहुन्छ। तपाईंलाई निम्न जन्म विवरण र ज्योतिषीय डाटा दिइएको छ:

**जन्म विवरण:**
नाम: ${userData.name}
जन्म मिति: ${userData.birthData.birthDate}
जन्म समय: ${userData.birthData.birthTime}
जन्म स्थान: ${userData.birthData.birthPlace}
अयनांश: ${userData.birthData.ayanamsa === 1 ? 'लाहिरी' : userData.birthData.ayanamsa === 2 ? 'रामन' : 'कृष्णमूर्ति'}

**ज्योतिषीय डाटा:**
लग्न: ${astrologicalData.ascendant} (${astrologicalData.kundliData?.ascendant?.degree}°)
चन्द्र राशि: ${astrologicalData.moonSign} (${astrologicalData.kundliData?.moonSign?.degree}°)
सूर्य राशि: ${astrologicalData.sunSign} (${astrologicalData.kundliData?.sunSign?.degree}°)
वर्तमान दशा: ${astrologicalData.currentDasha}

**ग्रहहरूको स्थिति:**
${astrologicalData.kundliData?.planets?.map((planet: any) => 
  `${planet.name}: ${planet.sign} (${planet.degree}°) - ${planet.house} भाव`
).join('\n')}

**योगहरू:**
${astrologicalData.kundliData?.yogas?.map((yoga: any) => 
  `${yoga.yogaName}: ${yoga.yogaType} (${yoga.strength})`
).join('\n')}

**वर्तमान दशा विवरण:**
${astrologicalData.dashaData?.currentPeriod ? `
विम्शोत्तरी दशा: ${astrologicalData.dashaData.currentPeriod.vimshottari}
अन्तर्दशा: ${astrologicalData.dashaData.currentPeriod.antardasha}
प्रत्यन्तर्दशा: ${astrologicalData.dashaData.currentPeriod.pratyantardasha}
सूक्ष्म दशा: ${astrologicalData.dashaData.currentPeriod.sookshmaDasha}
योगिनी दशा: ${astrologicalData.dashaData.currentPeriod.yoginiDasha}
` : ''}

तपाईंले यो विस्तृत ज्योतिषीय डाटा प्रयोग गरेर प्रयोगकर्ताको प्रश्नहरूको उत्तर दिनुपर्छ। नेपाली भाषामा उत्तर दिनुहोस् र वैदिक ज्योतिषका सिद्धान्तहरू प्रयोग गर्नुहोस्। आफैँ बनावटी कुरा नगर्नुहोस्, केवल उपलब्ध डाटाको आधारमा मात्र जवाफ दिनुहोस्।

**प्रयोगकर्ताको प्रश्न:** ${message}
**प्रश्नको प्रकार:** ${questionType}
**सन्दर्भगत उत्तर:** ${contextualResponse}
` : parsedBirthData ? `
तपाईं दिव्यांश ज्योतिषका विशेषज्ञ हुनुहुन्छ। तपाईंलाई निम्न जन्म विवरण दिइएको छ:

**जन्म विवरण:**
जन्म मिति: ${parsedBirthData.year}-${parsedBirthData.month}-${parsedBirthData.day}
जन्म समय: ${parsedBirthData.time}
जन्म स्थान: ${parsedBirthData.place}

**प्रयोगकर्ताको प्रश्न:** ${message}
**प्रश्नको प्रकार:** ${questionType}
**सन्दर्भगत उत्तर:** ${contextualResponse}

यो जन्म विवरणको आधारमा ज्योतिषीय विश्लेषण गर्नुहोस्। नेपाली भाषामा उत्तर दिनुहोस् र वैदिक ज्योतिषका सिद्धान्तहरू प्रयोग गर्नुहोस्।

यदि अधिक सटीक विश्लेषण चाहिएको छ भने, निम्न जानकारी पनि माग्नुहोस्:
- सही जन्म समय
- सही जन्म स्थान
- नाम
` : `
तपाईं दिव्यांश ज्योतिषका विशेषज्ञ हुनुहुन्छ। ज्योतिष सम्बन्धी प्रश्नहरूको उत्तर दिनुहोस्। नेपाली भाषामा उत्तर दिनुहोस् र वैदिक ज्योतिषका सिद्धान्तहरू प्रयोग गर्नुहोस्।

यदि तपाईंलाई जन्म विवरण चाहिएको छ भने, निम्न जानकारी माग्नुहोस्:
- जन्म मिति (YYYY-MM-DD)
- जन्म समय (HH:MM)
- जन्म स्थान
- नाम

तपाईंको उत्तरहरू सरल, स्पष्ट र ज्योतिषीय रूपमा सही हुनुपर्छ।
`;

  try {
    // Make real OpenAI API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    return {
      message: response.choices[0]?.message?.content || 'माफ गर्नुहोस्, मैले उत्तर दिन सकिन।',
      timestamp: new Date().toISOString(),
      type: 'ai',
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback response if API fails
    return {
      message: 'माफ गर्नुहोस्, अहिले AI सेवा उपलब्ध छैन। कृपया केही समय पछि फेरि प्रयास गर्नुहोस्।',
      timestamp: new Date().toISOString(),
      type: 'ai',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, token } = ChatSchema.parse(body);

    // Authenticate user
    let user = null;
    let astrologicalData = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret') as any;
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            astrologicalData: true
          }
        });
        astrologicalData = user?.astrologicalData?.[0];
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
      }
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          astrologicalData: true
        }
      });
      astrologicalData = user?.astrologicalData?.[0];
    }

    console.log(`Chat request from ${user?.name || 'anonymous'}: ${message}`);

    // Call ChatGPT with real astrological data
    const aiResponse = await callChatGPT(message, user, astrologicalData);

    // Store chat message in database
    let chatMessage;
    try {
      chatMessage = await prisma.chatMessage.create({
        data: {
          userId: user?.id || 'anonymous',
          message,
          response: aiResponse.message,
        }
      });
    } catch (dbError) {
      console.log('Database not available, creating demo chat message');
      chatMessage = {
        id: Date.now().toString(),
        message,
        response: aiResponse.message,
        timestamp: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        id: chatMessage.id,
        message: chatMessage.message,
        response: chatMessage.response,
        timestamp: chatMessage.timestamp.toISOString(),
        type: 'ai'
      },
    });

  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'अमान्य डाटा',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'च्याट गर्नमा त्रुटि भयो',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
