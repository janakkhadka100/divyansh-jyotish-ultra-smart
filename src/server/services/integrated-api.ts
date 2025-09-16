import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// API Configuration
const API_CONFIG = {
  PROKERALA: {
    BASE_URL: 'https://api.prokerala.com/v2/astrology',
    TIMEOUT: 30000,
    RATE_LIMIT_DELAY: 1000
  },
  OPENAI: {
    MODEL: 'gpt-4',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
  },
  GEOCODING: {
    PROVIDER: 'osm',
    TIMEOUT: 10000
  }
};

// Schemas
const BirthDataSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string(),
  ayanamsa: z.number().default(1),
});

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.enum(['ne', 'hi', 'en']).default('ne'),
});

export type BirthData = z.infer<typeof BirthDataSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

class IntegratedAPIService {
  private prokeralaClient: AxiosInstance;
  private openaiClient: any;
  private lastProkeralaRequest: number = 0;

  constructor() {
    this.initializeProkerala();
    this.initializeOpenAI();
  }

  private initializeProkerala() {
    const apiKey = process.env.PROKERALA_API_KEY || 'demo-key';
    if (!apiKey || apiKey === 'demo-key') {
      console.warn('Running in demo mode - PROKERALA_API_KEY not provided');
    }

    this.prokeralaClient = axios.create({
      baseURL: API_CONFIG.PROKERALA.BASE_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DivyanshJyotish/1.0',
      },
      timeout: API_CONFIG.PROKERALA.TIMEOUT,
    });

    // Rate limiting
    this.prokeralaClient.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastProkeralaRequest;
      
      if (timeSinceLastRequest < API_CONFIG.PROKERALA.RATE_LIMIT_DELAY) {
        await this.delay(API_CONFIG.PROKERALA.RATE_LIMIT_DELAY - timeSinceLastRequest);
      }
      
      this.lastProkeralaRequest = Date.now();
      return config;
    });
  }

  private initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY || 'demo-key';
    if (!apiKey || apiKey === 'demo-key') {
      console.warn('Running in demo mode - OPENAI_API_KEY not provided');
    }

    const OpenAI = require('openai');
    this.openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get comprehensive astrological data from ProKerala
   */
  async getAstrologicalData(birthData: BirthData) {
    try {
      const validatedData = BirthDataSchema.parse(birthData);

      // Get Kundli (Birth Chart)
      const kundliResponse = await this.prokeralaClient.post('/kundli', {
        name: validatedData.name,
        datetime: `${validatedData.date}T${validatedData.time}:00`,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        timezone: validatedData.timezone,
        ayanamsa: validatedData.ayanamsa,
        chart_type: 'd1,d9,d10,d12',
        include_yogas: true,
        include_ascendant: true,
        include_moon_sign: true,
        include_sun_sign: true,
      });

      await this.delay(1000); // Rate limiting

      // Get Dashas (Planetary Periods)
      const dashaResponse = await this.prokeralaClient.post('/dasha', {
        datetime: `${validatedData.date}T${validatedData.time}:00`,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        timezone: validatedData.timezone,
        ayanamsa: validatedData.ayanamsa,
        dasha_type: 'vimshottari,antardasha,pratyantardasha,sookshma,yogini',
        include_current_period: true,
      });

      await this.delay(1000); // Rate limiting

      // Get Panchang (Hindu Calendar)
      const panchangResponse = await this.prokeralaClient.get('/panchang', {
        params: {
          date: validatedData.date,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          timezone: validatedData.timezone,
        }
      });

      // Transform and return data
      return this.transformAstrologicalData(
        kundliResponse.data,
        dashaResponse.data,
        panchangResponse.data,
        validatedData
      );

    } catch (error) {
      console.error('Error getting astrological data:', error);
      throw new Error(`Failed to get astrological data: ${error.message}`);
    }
  }

  /**
   * Get AI response from ChatGPT
   */
  async getAIResponse(chatRequest: ChatRequest, astrologicalData?: any) {
    try {
      const validatedRequest = ChatRequestSchema.parse(chatRequest);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(validatedRequest.language, astrologicalData);

      // Get AI response
      const response = await this.openaiClient.chat.completions.create({
        model: API_CONFIG.OPENAI.MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: validatedRequest.message,
          },
        ],
        max_tokens: API_CONFIG.OPENAI.MAX_TOKENS,
        temperature: API_CONFIG.OPENAI.TEMPERATURE,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      return {
        message: response.choices[0]?.message?.content || 'माफ गर्नुहोस्, मैले उत्तर दिन सकिन।',
        timestamp: new Date().toISOString(),
        type: 'ai',
        language: validatedRequest.language,
      };

    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        message: 'माफ गर्नुहोस्, अहिले AI सेवा उपलब्ध छैन। कृपया केही समय पछि फेरि प्रयास गर्नुहोस्।',
        timestamp: new Date().toISOString(),
        type: 'ai',
        language: chatRequest.language,
      };
    }
  }

  /**
   * Get geocoding data for location
   */
  async getGeocodingData(location: string) {
    try {
      // For now, return mock data for common locations
      const mockGeocoding = {
        'काठमाडौं, नेपाल': {
          latitude: 27.7172,
          longitude: 85.3240,
          timezone: 'Asia/Kathmandu',
          city: 'Kathmandu',
          country: 'Nepal'
        },
        'दिल्ली, भारत': {
          latitude: 28.6139,
          longitude: 77.2090,
          timezone: 'Asia/Kolkata',
          city: 'Delhi',
          country: 'India'
        },
        'मुम्बई, भारत': {
          latitude: 19.0760,
          longitude: 72.8777,
          timezone: 'Asia/Kolkata',
          city: 'Mumbai',
          country: 'India'
        }
      };

      const normalizedLocation = location.toLowerCase().trim();
      const result = mockGeocoding[normalizedLocation] || mockGeocoding['काठमाडौं, नेपाल'];
      
      return result;

    } catch (error) {
      console.error('Error getting geocoding data:', error);
      throw new Error(`Failed to get geocoding data: ${error.message}`);
    }
  }

  /**
   * Transform astrological data to our format
   */
  private transformAstrologicalData(kundliData: any, dashaData: any, panchangData: any, birthData: BirthData) {
    return {
      kundli: {
        ascendant: {
          signName: kundliData.ascendant?.sign_name || 'Unknown',
          degree: kundliData.ascendant?.degree || 0,
          nakshatraName: kundliData.ascendant?.nakshatra_name || 'Unknown'
        },
        moonSign: {
          signName: kundliData.moon_sign?.sign_name || 'Unknown',
          degree: kundliData.moon_sign?.degree || 0,
          nakshatraName: kundliData.moon_sign?.nakshatra_name || 'Unknown'
        },
        sunSign: {
          signName: kundliData.sun_sign?.sign_name || 'Unknown',
          degree: kundliData.sun_sign?.degree || 0,
          nakshatraName: kundliData.sun_sign?.nakshatra_name || 'Unknown'
        },
        planets: kundliData.charts?.[0]?.positions?.map((pos: any) => ({
          name: pos.planet,
          sign: pos.sign_name,
          degree: pos.degree,
          house: pos.house
        })) || [],
        houses: kundliData.charts?.[0]?.houses?.map((house: any) => ({
          number: house.house,
          sign: house.sign_name,
          lord: house.lord_name
        })) || [],
        yogas: kundliData.yogas?.map((yoga: any) => ({
          yogaName: yoga.yoga_name,
          yogaType: yoga.yoga_type,
          strength: yoga.strength
        })) || [],
        charts: kundliData.charts?.map((chart: any) => ({
          chartType: chart.chart_type,
          chartName: chart.chart_name,
          positions: chart.positions || []
        })) || []
      },
      dasha: {
        currentPeriod: {
          vimshottari: dashaData.current_period?.vimshottari || 'Unknown',
          antardasha: dashaData.current_period?.antardasha || 'Unknown',
          pratyantardasha: dashaData.current_period?.pratyantardasha || 'Unknown',
          sookshmaDasha: dashaData.current_period?.sookshma_dasha || 'Unknown',
          yoginiDasha: dashaData.current_period?.yogini_dasha || 'Unknown'
        },
        periods: dashaData.vimshottari_dasha?.periods?.map((period: any) => ({
          planet: period.planet_name,
          startDate: period.start_date,
          endDate: period.end_date,
          remaining: period.remaining
        })) || []
      },
      panchang: {
        tithi: { 
          name: panchangData.panchang?.tithi?.name || 'Unknown',
          number: panchangData.panchang?.tithi?.number || 0
        },
        nakshatra: { 
          name: panchangData.panchang?.nakshatra?.name || 'Unknown',
          number: panchangData.panchang?.nakshatra?.number || 0
        },
        yoga: { 
          name: panchangData.panchang?.yoga?.name || 'Unknown',
          number: panchangData.panchang?.yoga?.number || 0
        },
        karana: { 
          name: panchangData.panchang?.karana?.name || 'Unknown',
          number: panchangData.panchang?.karana?.number || 0
        },
        sunrise: panchangData.panchang?.sunrise || 'Unknown',
        sunset: panchangData.panchang?.sunset || 'Unknown',
        moonrise: panchangData.panchang?.moonrise || 'Unknown',
        moonset: panchangData.panchang?.moonset || 'Unknown'
      },
      computedAt: new Date().toISOString(),
      provider: 'prokerala-integrated'
    };
  }

  /**
   * Build system prompt for AI
   */
  private buildSystemPrompt(language: string, astrologicalData?: any): string {
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

    const config = languageConfig[language as keyof typeof languageConfig] || languageConfig.ne;

    let prompt = `You are a knowledgeable Vedic astrology assistant speaking in ${config.language}.

IMPORTANT GUIDELINES:
1. Always respond in ${config.language}
2. Be cautious and never make medical or financial guarantees
3. Base your responses on the provided horoscope data
4. Use appropriate Vedic terminology
5. Offer helpful insights but remind users that astrology is for guidance only

EXAMPLE QUESTIONS YOU CAN ANSWER:
${config.examples.map(ex => `- ${ex}`).join('\n')}`;

    if (astrologicalData) {
      prompt += `\n\nHOROSCOPE DATA:
${JSON.stringify(astrologicalData, null, 2)}`;
    }

    return prompt;
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        prokerala: 'unknown',
        openai: 'unknown'
      }
    };

    // Check ProKerala API
    try {
      await this.prokeralaClient.get('/panchang?date=2024-01-01&latitude=27.7172&longitude=85.3240');
      health.services.prokerala = 'healthy';
    } catch (error) {
      health.services.prokerala = 'unhealthy';
    }

    // Check OpenAI API
    try {
      await this.openaiClient.models.list();
      health.services.openai = 'healthy';
    } catch (error) {
      health.services.openai = 'unhealthy';
    }

    return health;
  }
}

// Export singleton instance
export const integratedAPIService = new IntegratedAPIService();
export default IntegratedAPIService;
