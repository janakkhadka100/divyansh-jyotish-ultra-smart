import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { prisma } from '@/server/lib/prisma';
import { ProkeralaEnhancedService } from '@/server/services/prokerala-enhanced';

// Input validation schema
const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional(),
  token: z.string().optional(),
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

// Initialize ProKerala service
const prokeralaService = new ProkeralaEnhancedService();

// Detect question type for better responses
function detectQuestionType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('करियर') || lowerMessage.includes('काम') || lowerMessage.includes('पेशा')) {
    return 'career';
  } else if (lowerMessage.includes('प्रेम') || lowerMessage.includes('विवाह') || lowerMessage.includes('जीवनसाथी')) {
    return 'love';
  } else if (lowerMessage.includes('स्वास्थ्य') || lowerMessage.includes('रोग') || lowerMessage.includes('बिरामी')) {
    return 'health';
  } else if (lowerMessage.includes('धन') || lowerMessage.includes('पैसा') || lowerMessage.includes('आर्थिक')) {
    return 'finance';
  } else if (lowerMessage.includes('शिक्षा') || lowerMessage.includes('पढाई') || lowerMessage.includes('विद्यालय')) {
    return 'education';
  } else if (lowerMessage.includes('दशा') || lowerMessage.includes('महादशा') || lowerMessage.includes('अन्तर्दशा')) {
    return 'dasha';
  } else if (lowerMessage.includes('कुण्डली') || lowerMessage.includes('जन्मकुण्डली') || lowerMessage.includes('राशि')) {
    return 'kundli';
  } else if (lowerMessage.includes('आज') || lowerMessage.includes('आजको') || lowerMessage.includes('शुभ')) {
    return 'daily';
  } else {
    return 'general';
  }
}

// Get contextual response based on question type
function getContextualResponse(message: string, questionType: string, astrologicalData?: any): string {
  const responses = {
    career: "तपाईंको करियर सम्बन्धी प्रश्नको लागि, म तपाईंको जन्मकुण्डली, दशा, र ग्रहहरूको स्थिति हेरेर उत्तर दिनेछु।",
    love: "प्रेम र विवाह सम्बन्धी प्रश्नको लागि, म तपाईंको सप्तम भाव, शुक्र, र चन्द्रको स्थिति हेरेर विश्लेषण गर्नेछु।",
    health: "स्वास्थ्य सम्बन्धी प्रश्नको लागि, म तपाईंको षष्ठ भाव, मंगल, र अन्य स्वास्थ्य सम्बन्धी ग्रहहरूको स्थिति हेरेर जवाफ दिनेछु।",
    finance: "धन र आर्थिक स्थिति सम्बन्धी प्रश्नको लागि, म तपाईंको द्वितीय भाव, पञ्चम भाव, र गुरुको स्थिति हेरेर विश्लेषण गर्नेछु।",
    education: "शिक्षा र ज्ञान सम्बन्धी प्रश्नको लागि, म तपाईंको पञ्चम भाव, बुध, र गुरुको स्थिति हेरेर उत्तर दिनेछु।",
    dasha: "दशा सम्बन्धी प्रश्नको लागि, म तपाईंको वर्तमान दशा, अन्तर्दशा, र प्रत्यन्तर्दशा हेरेर विस्तृत विश्लेषण गर्नेछु।",
    kundli: "कुण्डली सम्बन्धी प्रश्नको लागि, म तपाईंको सम्पूर्ण जन्मकुण्डली, ग्रहहरूको स्थिति, र योगहरू हेरेर जवाफ दिनेछु।",
    daily: "आजको शुभ समय र दिनचर्या सम्बन्धी प्रश्नको लागि, म तपाईंको पञ्चाङ्ग, तिथि, र ग्रहहरूको स्थिति हेरेर सुझाव दिनेछु।",
    general: "सामान्य ज्योतिष सम्बन्धी प्रश्नको लागि, म तपाईंको जन्मकुण्डली र वर्तमान दशा हेरेर उत्तर दिनेछु।"
  };
  
  return responses[questionType as keyof typeof responses] || responses.general;
}

// Enhanced ChatGPT API call with real astrological data
async function callChatGPTWithAstrology(message: string, birthData?: any, astrologicalData?: any) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Detect question type
  const questionType = detectQuestionType(message);
  const contextualResponse = getContextualResponse(message, questionType, astrologicalData);

  // Build comprehensive system prompt
  let systemPrompt = `तपाईं दिव्यांश ज्योतिषका विशेषज्ञ हुनुहुन्छ। तपाईंले वैदिक ज्योतिषका सिद्धान्तहरू प्रयोग गरेर प्रयोगकर्ताको प्रश्नहरूको उत्तर दिनुपर्छ। नेपाली भाषामा उत्तर दिनुहोस्।

**महत्वपूर्ण:** तपाईंले निम्न ज्योतिषीय डाटा प्रयोग गरेर मात्र उत्तर दिनुपर्छ। यदि डाटा उपलब्ध छ भने, त्यसको आधारमा विस्तृत विश्लेषण गर्नुहोस्।`;

  if (astrologicalData) {
    systemPrompt += `

**प्रयोगकर्ताको ज्योतिषीय डाटा:**

**जन्म विवरण:**
- नाम: ${birthData?.name || 'अज्ञात'}
- जन्म मिति: ${birthData?.date || 'अज्ञात'}
- जन्म समय: ${birthData?.time || 'अज्ञात'}
- जन्म स्थान: ${birthData?.location || 'अज्ञात'}

**कुण्डली डाटा:**
- लग्न: ${astrologicalData.kundli?.ascendant?.sign || 'अज्ञात'} (${astrologicalData.kundli?.ascendant?.degree || 0}°)
- चन्द्र राशि: ${astrologicalData.kundli?.moonSign?.sign || 'अज्ञात'} (${astrologicalData.kundli?.moonSign?.degree || 0}°)
- सूर्य राशि: ${astrologicalData.kundli?.sunSign?.sign || 'अज्ञात'} (${astrologicalData.kundli?.sunSign?.degree || 0}°)

**ग्रहहरूको स्थिति:**
${astrologicalData.kundli?.planets?.map((planet: any) => 
  `- ${planet.name}: ${planet.sign} (${planet.degree}°) - ${planet.house} भाव`
).join('\n') || 'अज्ञात'}

**योगहरू:**
${astrologicalData.kundli?.yogas?.map((yoga: any) => 
  `- ${yoga.yogaName}: ${yoga.yogaType} (${yoga.strength})`
).join('\n') || 'अज्ञात'}

**दशा डाटा:**
- वर्तमान दशा: ${astrologicalData.dasha?.currentDasha || 'अज्ञात'}
- अन्तर्दशा: ${astrologicalData.dasha?.antardasha || 'अज्ञात'}
- प्रत्यन्तर्दशा: ${astrologicalData.dasha?.pratyantardasha || 'अज्ञात'}

**पञ्चाङ्ग डाटा:**
- तिथि: ${astrologicalData.panchang?.tithi || 'अज्ञात'}
- नक्षत्र: ${astrologicalData.panchang?.nakshatra || 'अज्ञात'}
- योग: ${astrologicalData.panchang?.yoga || 'अज्ञात'}
- करण: ${astrologicalData.panchang?.karana || 'अज्ञात'}

तपाईंले यो विस्तृत ज्योतिषीय डाटा प्रयोग गरेर प्रयोगकर्ताको प्रश्नहरूको सटीक उत्तर दिनुपर्छ। केवल उपलब्ध डाटाको आधारमा मात्र जवाफ दिनुहोस्, आफैँ बनावटी कुरा नगर्नुहोस्।

**विशेष निर्देश:**
1. सबै उत्तरहरूमा उपलब्ध ज्योतिषीय डाटा प्रयोग गर्नुहोस्
2. प्रश्नको प्रकार अनुसार सम्बन्धित ग्रहहरू र भावहरू हेर्नुहोस्
3. वर्तमान दशा र अन्तर्दशाको प्रभाव बताउनुहोस्
4. योगहरूको प्रभाव समावेश गर्नुहोस्
5. नेपाली भाषामा सरल र स्पष्ट उत्तर दिनुहोस्

**प्रश्नको प्रकार अनुसार उत्तर दिनुहोस्:**
- करियर: लग्न, दशम भाव, गुरु, सूर्यको स्थिति हेरेर
- प्रेम/विवाह: सप्तम भाव, शुक्र, चन्द्रको स्थिति हेरेर  
- स्वास्थ्य: छठौं भाव, मङ्गल, सूर्यको स्थिति हेरेर
- धन: द्वितीय, पञ्चम, नवम भाव र शुक्रको स्थिति हेरेर
- दशा: वर्तमान दशा, अन्तर्दशा, प्रत्यन्तर्दशा हेरेर
- कुण्डली: ग्रहहरूको स्थिति, योगहरू, भावहरू हेरेर

**उदाहरण उत्तर:**
"तपाईंको कुण्डली अनुसार, तपाईंको लग्न ${astrologicalData.kundli?.ascendant?.sign} छ र चन्द्र राशि ${astrologicalData.kundli?.moonSign?.sign} मा छ। यसका आधारमा..."`;
  } else if (birthData) {
    systemPrompt += `

**प्रयोगकर्ताको जन्म विवरण:**
- नाम: ${birthData.name || 'अज्ञात'}
- जन्म मिति: ${birthData.date}
- जन्म समय: ${birthData.time}
- जन्म स्थान: ${birthData.location}

यो जन्म विवरणको आधारमा ज्योतिषीय विश्लेषण गर्नुहोस्। यदि अधिक सटीक विश्लेषण चाहिएको छ भने, निम्न जानकारी पनि माग्नुहोस्:
- सही जन्म समय
- सही जन्म स्थान
- नाम`;
  } else {
    systemPrompt += `

यदि तपाईंलाई जन्म विवरण चाहिएको छ भने, निम्न जानकारी माग्नुहोस्:
- जन्म मिति (YYYY-MM-DD)
- जन्म समय (HH:MM)
- जन्म स्थान
- नाम

तपाईंको उत्तरहरू सरल, स्पष्ट र ज्योतिषीय रूपमा सही हुनुपर्छ।`;
  }

  systemPrompt += `

**प्रयोगकर्ताको प्रश्न:** ${message}
**प्रश्नको प्रकार:** ${questionType}
**सन्दर्भगत उत्तर:** ${contextualResponse}

**महत्वपूर्ण:** तपाईंले उपर दिइएको ज्योतिषीय डाटा प्रयोग गरेर मात्र उत्तर दिनुहोस्। यदि डाटा उपलब्ध छ भने, त्यसको specific values mention गर्नुहोस्। उदाहरण: "तपाईंको लग्न मेष राशिमा छ" वा "तपाईंको वर्तमान दशा शुक्रको छ"।

तपाईंले यो प्रश्नको उत्तर दिनुहोस्।`;

  try {
    // Create a more direct prompt with specific data
    let directPrompt = message;
    
    if (astrologicalData) {
      directPrompt = `तपाईंको ज्योतिषीय डाटा:
- लग्न: ${astrologicalData.kundli?.ascendant?.sign || 'अज्ञात'}
- चन्द्र राशि: ${astrologicalData.kundli?.moonSign?.sign || 'अज्ञात'}
- सूर्य राशि: ${astrologicalData.kundli?.sunSign?.sign || 'अज्ञात'}
- वर्तमान दशा: ${astrologicalData.dasha?.currentDasha || 'अज्ञात'}
- अन्तर्दशा: ${astrologicalData.dasha?.antardasha || 'अज्ञात'}

प्रश्न: ${message}

कृपया उपर दिइएको ज्योतिषीय डाटा प्रयोग गरेर specific उत्तर दिनुहोस्।`;
    }

    // Try OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `तपाईं दिव्यांश ज्योतिषका विशेषज्ञ हुनुहुन्छ। तपाईंले वैदिक ज्योतिषका सिद्धान्तहरू प्रयोग गरेर प्रयोगकर्ताको प्रश्नहरूको उत्तर दिनुपर्छ। नेपाली भाषामा उत्तर दिनुहोस्।

**महत्वपूर्ण:** 
1. तपाईंले दिइएको ज्योतिषीय डाटा प्रयोग गरेर मात्र उत्तर दिनुहोस्
2. सबै उत्तरहरूमा specific astrological values mention गर्नुहोस्
3. Generic answers दिनुहोस् - हर प्रश्नको लागि specific analysis गर्नुहोस्
4. उदाहरण: "तपाईंको लग्न मेष राशिमा छ" वा "तपाईंको वर्तमान दशा चन्द्र महादशा हो"

**उत्तर दिने तरिका:**
- प्रश्नको प्रकार अनुसार सम्बन्धित ग्रहहरू र भावहरू हेर्नुहोस्
- वर्तमान दशा र अन्तर्दशाको प्रभाव बताउनुहोस्
- योगहरूको प्रभाव समावेश गर्नुहोस्
- नेपाली भाषामा सरल र स्पष्ट उत्तर दिनुहोस्`,
        },
        {
          role: 'user',
          content: directPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    }, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return {
      message: response.choices[0]?.message?.content || 'माफ गर्नुहोस्, मैले उत्तर दिन सकिन।',
      timestamp: new Date().toISOString(),
      type: 'ai',
      questionType,
      contextualResponse
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // If timeout or API error, provide fallback response with astrological data
    if (astrologicalData) {
      const fallbackResponse = generateFallbackResponse(message, astrologicalData);
      return {
        message: fallbackResponse,
        timestamp: new Date().toISOString(),
        type: 'ai',
        questionType,
        contextualResponse: 'ज्योतिषीय डाटा आधारित उत्तर।'
      };
    }
    
    // Fallback response if API fails
    return {
      message: 'माफ गर्नुहोस्, अहिले AI सेवा उपलब्ध छैन। कृपया केही समय पछि फेरि प्रयास गर्नुहोस्।',
      timestamp: new Date().toISOString(),
      type: 'ai',
      questionType,
      contextualResponse: 'सेवा अस्थायी रूपमा उपलब्ध छैन।'
    };
  }
}

function generateFallbackResponse(message: string, astrologicalData: any): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('दशा') || lowerMessage.includes('dasha')) {
    return `तपाईंको वर्तमान दशा ${astrologicalData.dasha?.currentDasha || 'चन्द्र महादशा'} हो र त्यसको अन्तर्दशा ${astrologicalData.dasha?.antardasha || 'मंगल अन्तर्दशा'} हो। 

चन्द्र महादशा 10 वर्ष सम्म चल्ने गर्दछ र यो तपाईंको मनस्थिति, भावनात्मक जीवन, घरेलु सम्बन्ध, र आत्मसम्मानमा प्रभाव पार्छ। मंगल अन्तर्दशा 1.2 वर्ष सम्म चल्ने गर्दछ र यो तपाईंलाई साहस, स्वतन्त्रता, र प्रतिस्पर्धा क्षेत्रमा प्रेरित गर्न सक्छ।

यो दशा अवधिमा तपाईंले आफ्नो भावनात्मक स्थिरता बनाउनुहोस् र नयाँ परियोजनाहरू शुरू गर्नुहोस्।`;
  }
  
  if (lowerMessage.includes('करियर') || lowerMessage.includes('career') || lowerMessage.includes('काम')) {
    return `तपाईंको लग्न ${astrologicalData.kundli?.ascendant?.sign || 'मेष'} राशिमा छ र चन्द्र राशि ${astrologicalData.kundli?.moonSign?.sign || 'कर्क'} मा छ।

मेष लग्नले तपाईंलाई नेतृत्व गुण, साहस, र नयाँ काम शुरू गर्ने क्षमता दिन्छ। कर्क चन्द्र राशिले तपाईंलाई भावनात्मक बुद्धिमत्ता, सेवा भावना, र घरेलु व्यवसायमा सफलता दिन्छ।

तपाईंको करियरमा नेतृत्व पद, सुरक्षा क्षेत्र, र घरेलु व्यवसाय उपयुक्त हुनेछन्। वर्तमान दशा ${astrologicalData.dasha?.currentDasha || 'चन्द्र महादशा'} मा नयाँ अवसरहरू आउन सक्छन्।`;
  }
  
  if (lowerMessage.includes('कुण्डली') || lowerMessage.includes('kundli') || lowerMessage.includes('जन्मकुण्डली')) {
    return `तपाईंको कुण्डली अनुसार:
- लग्न: ${astrologicalData.kundli?.ascendant?.sign || 'मेष'}
- चन्द्र राशि: ${astrologicalData.kundli?.moonSign?.sign || 'कर्क'}
- सूर्य राशि: ${astrologicalData.kundli?.sunSign?.sign || 'धनु'}
- वर्तमान दशा: ${astrologicalData.dasha?.currentDasha || 'चन्द्र महादशा'}

यी सबै तत्वहरू तपाईंको जीवनमा महत्वपूर्ण भूमिका खेल्छन्।`;
  }
  
  if (lowerMessage.includes('राशि') || lowerMessage.includes('rashi') || lowerMessage.includes('sign')) {
    return `तपाईंको चन्द्र राशि ${astrologicalData.kundli?.moonSign?.sign || 'कर्क'} हो।

कर्क राशि तपाईंको मनस्थिति, भावना र आत्मियता प्रभावित गर्दछ। यसले तपाईंको स्वभाव, प्रवृत्ति र भावनात्मक पक्षहरूमा प्रभाव पार्दछ।

कर्क राशिका व्यक्तिहरू भावनात्मक, घरेलु प्रेमी, र मातृत्व भावना बलियो हुन्छन्। तपाईंले आफ्नो भावनाहरू प्रकट गर्नुहोस् र घरेलु वातावरणमा सुख पाउनुहोस्।`;
  }
  
  if (lowerMessage.includes('प्रेम') || lowerMessage.includes('love') || lowerMessage.includes('विवाह')) {
    return `तपाईंको चन्द्र राशि ${astrologicalData.kundli?.moonSign?.sign || 'कर्क'} मा छ जसले तपाईंको भावनात्मक जीवनमा प्रभाव पार्छ। वर्तमान दशा ${astrologicalData.dasha?.currentDasha || 'चन्द्र महादशा'} मा प्रेम सम्बन्धहरूमा सकारात्मक परिवर्तन आउन सक्छ।`;
  }
  
  return `तपाईंको ज्योतिषीय डाटा अनुसार:
- लग्न: ${astrologicalData.kundli?.ascendant?.sign || 'मेष'}
- चन्द्र राशि: ${astrologicalData.kundli?.moonSign?.sign || 'कर्क'}
- वर्तमान दशा: ${astrologicalData.dasha?.currentDasha || 'चन्द्र महादशा'}

यी तत्वहरू तपाईंको प्रश्नको उत्तर दिनमा सहयोग गर्छन्।`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, token, birthData } = ChatSchema.parse(body);

    console.log(`Enhanced chat request: ${message}`);

    let astrologicalData = null;
    let actualBirthData = birthData;

    // If no birth data provided, use default demo data
    if (!actualBirthData) {
      actualBirthData = {
        name: 'Demo User',
        date: '1990-01-01',
        time: '12:00',
        location: 'Kathmandu, Nepal',
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'Asia/Kathmandu',
        ayanamsa: 1
      };
      console.log('Using default demo birth data for astrological analysis');
    }

    // Always get astrological data for better responses
    try {
      console.log('Fetching astrological data...');
      astrologicalData = await prokeralaService.getAstrologicalData(actualBirthData);
      console.log('Astrological data fetched successfully:', !!astrologicalData);
    } catch (error) {
      console.error('Error fetching astrological data:', error);
      // Continue without astrological data
    }

    // Call ChatGPT with astrological data
    const aiResponse = await callChatGPTWithAstrology(message, actualBirthData, astrologicalData);

    // Store chat message in database
    let chatMessage;
    try {
      // Create a temporary user if userId is not provided
      let actualUserId = userId;
      if (!actualUserId) {
        const tempUser = await prisma.user.upsert({
          where: { email: 'anonymous@demo.com' },
          update: {},
          create: {
            name: 'Anonymous User',
            email: 'anonymous@demo.com',
            password: 'demo-password',
            birthData: {}
          }
        });
        actualUserId = tempUser.id;
      }

      chatMessage = await prisma.chatMessage.create({
        data: {
          userId: actualUserId,
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
        type: 'ai',
        questionType: aiResponse.questionType,
        contextualResponse: aiResponse.contextualResponse,
        hasAstrologicalData: !!astrologicalData
      },
    });

  } catch (error) {
    console.error('Enhanced chat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process chat request',
      message: 'माफ गर्नुहोस्, केही समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।'
    }, { status: 500 });
  }
}
