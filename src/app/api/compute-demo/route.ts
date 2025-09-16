import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const ComputeRequestSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(1).max(200),
  lang: z.enum(['ne', 'hi', 'en']).default('ne'),
  ayanamsa: z.number().min(1).max(3).default(1),
});

type ComputeRequest = z.infer<typeof ComputeRequestSchema>;

// Mock horoscope data generator
function generateMockHoroscope(data: ComputeRequest) {
  const signs = ['मेष', 'वृष', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'];
  const nakshatras = ['अश्विनी', 'भरणी', 'कृतिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपदा', 'उत्तराभाद्रपदा', 'रेवती'];
  const yogas = ['राजयोग', 'धनयोग', 'विद्यायोग', 'कर्मयोग', 'भाग्ययोग', 'सुखयोग', 'संतानयोग', 'विवाहयोग', 'यात्रायोग', 'स्वास्थ्ययोग'];
  
  const randomSign = signs[Math.floor(Math.random() * signs.length)];
  const randomNakshatra = nakshatras[Math.floor(Math.random() * nakshatras.length)];
  const randomYogas = yogas.sort(() => 0.5 - Math.random()).slice(0, 5);
  
  return {
    ascendant: {
      sign: randomSign,
      degree: Math.floor(Math.random() * 30),
      nakshatra: randomNakshatra,
    },
    moonSign: {
      sign: signs[Math.floor(Math.random() * signs.length)],
      degree: Math.floor(Math.random() * 30),
      nakshatra: nakshatras[Math.floor(Math.random() * nakshatras.length)],
    },
    sunSign: {
      sign: signs[Math.floor(Math.random() * signs.length)],
      degree: Math.floor(Math.random() * 30),
      nakshatra: nakshatras[Math.floor(Math.random() * nakshatras.length)],
    },
    currentDasha: {
      vimshottari: 'चन्द्र',
      antardasha: 'मंगल',
      pratyantardasha: 'सूर्य',
      sookshmaDasha: 'बुध',
      yoginiDasha: 'शुक्र',
    },
    keyYogas: randomYogas.map(yoga => ({
      name: yoga,
      type: 'शुभ',
      strength: Math.floor(Math.random() * 5) + 1,
    })),
    charts: [
      { type: 'राशि', name: 'राशि चार्ट', planetCount: 9 },
      { type: 'नवमांश', name: 'नवमांश चार्ट', planetCount: 9 },
      { type: 'दशमांश', name: 'दशमांश चार्ट', planetCount: 9 },
    ],
    panchang: {
      tithi: 'शुक्ल पक्ष',
      nakshatra: randomNakshatra,
      yoga: 'सिद्धि',
      karana: 'विष्टि',
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, time, location, lang, ayanamsa } = ComputeRequestSchema.parse(body);

    console.log(`Computing mock horoscope for ${name} born on ${date} at ${time} in ${location}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock horoscope data
    const mockData = generateMockHoroscope({ name, date, time, location, lang, ayanamsa });
    
    // Generate session ID
    const sessionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return success response with mock data
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        summary: {
          name,
          birthDate: date,
          birthTime: time,
          location: location,
          ascendant: mockData.ascendant,
          moonSign: mockData.moonSign,
          sunSign: mockData.sunSign,
          currentDasha: mockData.currentDasha,
          keyYogas: mockData.keyYogas,
          charts: mockData.charts,
          panchang: mockData.panchang,
        },
        computedAt: new Date().toISOString(),
        provider: 'demo',
        chatUrl: `/ne/chat?sessionId=${sessionId}`,
      },
    });

  } catch (error) {
    console.error('Mock Compute API error:', error);

    // Handle validation errors
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

    // Generic error
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'healthy',
    services: {
      demo: 'healthy',
      database: 'demo_mode',
      geocoding: 'demo_mode',
    },
    timestamp: new Date().toISOString(),
  });
}


