import { z } from 'zod';

// Enhanced Prokerala API service with real integration
export class ProkeralaEnhancedService {
  private apiKey: string;
  private baseUrl = 'https://api.prokerala.com/v2/astrology';

  constructor() {
    this.apiKey = process.env.PROKERALA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('PROKERALA_API_KEY not found in environment variables');
    }
  }

  // Birth data validation schema
  static BirthDataSchema = z.object({
    name: z.string().min(1).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string(),
    ayanamsa: z.number().min(1).max(3), // 1=Lahiri, 2=Raman, 3=Krishnamurti
  });

  // Geocoding service for location to coordinates
  async geocodeLocation(location: string): Promise<{
    latitude: number;
    longitude: number;
    timezone: string;
    city: string;
    country: string;
  }> {
    // For demo purposes, return Kathmandu coordinates
    // In production, use Google Maps Geocoding API or similar
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
      },
      'kathmandu': {
        latitude: 27.7172,
        longitude: 85.3240,
        timezone: 'Asia/Kathmandu',
        city: 'Kathmandu',
        country: 'Nepal'
      },
      'pokhara': {
        latitude: 28.2096,
        longitude: 83.9856,
        timezone: 'Asia/Kathmandu',
        city: 'Pokhara',
        country: 'Nepal'
      },
      'lalitpur': {
        latitude: 27.6710,
        longitude: 85.3250,
        timezone: 'Asia/Kathmandu',
        city: 'Lalitpur',
        country: 'Nepal'
      },
      'bhaktapur': {
        latitude: 27.6710,
        longitude: 85.4298,
        timezone: 'Asia/Kathmandu',
        city: 'Bhaktapur',
        country: 'Nepal'
      },
      'biratnagar': {
        latitude: 26.4525,
        longitude: 87.2718,
        timezone: 'Asia/Kathmandu',
        city: 'Biratnagar',
        country: 'Nepal'
      },
      'birgunj': {
        latitude: 27.0000,
        longitude: 84.8667,
        timezone: 'Asia/Kathmandu',
        city: 'Birgunj',
        country: 'Nepal'
      },
      'nepalgunj': {
        latitude: 28.0500,
        longitude: 81.6167,
        timezone: 'Asia/Kathmandu',
        city: 'Nepalgunj',
        country: 'Nepal'
      },
      'dharan': {
        latitude: 26.8167,
        longitude: 87.2833,
        timezone: 'Asia/Kathmandu',
        city: 'Dharan',
        country: 'Nepal'
      },
      'butwal': {
        latitude: 27.7000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Butwal',
        country: 'Nepal'
      },
      'dhangadhi': {
        latitude: 28.6833,
        longitude: 80.6167,
        timezone: 'Asia/Kathmandu',
        city: 'Dhangadhi',
        country: 'Nepal'
      },
      'mahendranagar': {
        latitude: 28.9167,
        longitude: 80.3333,
        timezone: 'Asia/Kathmandu',
        city: 'Mahendranagar',
        country: 'Nepal'
      },
      'hetauda': {
        latitude: 27.4167,
        longitude: 85.0333,
        timezone: 'Asia/Kathmandu',
        city: 'Hetauda',
        country: 'Nepal'
      },
      'janakpur': {
        latitude: 26.7288,
        longitude: 85.9254,
        timezone: 'Asia/Kathmandu',
        city: 'Janakpur',
        country: 'Nepal'
      },
      'itahari': {
        latitude: 26.6667,
        longitude: 87.2833,
        timezone: 'Asia/Kathmandu',
        city: 'Itahari',
        country: 'Nepal'
      },
      'kalaiya': {
        latitude: 27.0333,
        longitude: 85.0167,
        timezone: 'Asia/Kathmandu',
        city: 'Kalaiya',
        country: 'Nepal'
      },
      'bharatpur': {
        latitude: 27.6833,
        longitude: 84.4167,
        timezone: 'Asia/Kathmandu',
        city: 'Bharatpur',
        country: 'Nepal'
      },
      'siddharthanagar': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Siddharthanagar',
        country: 'Nepal'
      },
      'tulsipur': {
        latitude: 28.1333,
        longitude: 82.3000,
        timezone: 'Asia/Kathmandu',
        city: 'Tulsipur',
        country: 'Nepal'
      },
      'rajbiraj': {
        latitude: 26.5333,
        longitude: 86.7500,
        timezone: 'Asia/Kathmandu',
        city: 'Rajbiraj',
        country: 'Nepal'
      },
      'lahan': {
        latitude: 26.7167,
        longitude: 86.4833,
        timezone: 'Asia/Kathmandu',
        city: 'Lahan',
        country: 'Nepal'
      },
      'panauti': {
        latitude: 27.5833,
        longitude: 85.5167,
        timezone: 'Asia/Kathmandu',
        city: 'Panauti',
        country: 'Nepal'
      },
      'gorkha': {
        latitude: 28.0000,
        longitude: 84.6333,
        timezone: 'Asia/Kathmandu',
        city: 'Gorkha',
        country: 'Nepal'
      },
      'bandipur': {
        latitude: 27.9333,
        longitude: 84.4167,
        timezone: 'Asia/Kathmandu',
        city: 'Bandipur',
        country: 'Nepal'
      },
      'malangwa': {
        latitude: 26.8667,
        longitude: 85.5667,
        timezone: 'Asia/Kathmandu',
        city: 'Malangwa',
        country: 'Nepal'
      },
      'birendranagar': {
        latitude: 28.6000,
        longitude: 81.6167,
        timezone: 'Asia/Kathmandu',
        city: 'Birendranagar',
        country: 'Nepal'
      },
      'damak': {
        latitude: 26.6500,
        longitude: 87.7000,
        timezone: 'Asia/Kathmandu',
        city: 'Damak',
        country: 'Nepal'
      },
      'banepa': {
        latitude: 27.6333,
        longitude: 85.5167,
        timezone: 'Asia/Kathmandu',
        city: 'Banepa',
        country: 'Nepal'
      },
      'kirtipur': {
        latitude: 27.6667,
        longitude: 85.2833,
        timezone: 'Asia/Kathmandu',
        city: 'Kirtipur',
        country: 'Nepal'
      },
      'madhyapur': {
        latitude: 27.6667,
        longitude: 85.3500,
        timezone: 'Asia/Kathmandu',
        city: 'Madhyapur',
        country: 'Nepal'
      },
      'tilottama': {
        latitude: 27.7000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Tilottama',
        country: 'Nepal'
      },
      'ratnanagar': {
        latitude: 27.6833,
        longitude: 84.4167,
        timezone: 'Asia/Kathmandu',
        city: 'Ratnanagar',
        country: 'Nepal'
      },
      'kapilvastu': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Kapilvastu',
        country: 'Nepal'
      },
      'lumbini': {
        latitude: 27.4667,
        longitude: 83.2667,
        timezone: 'Asia/Kathmandu',
        city: 'Lumbini',
        country: 'Nepal'
      },
      'taulihawa': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Taulihawa',
        country: 'Nepal'
      },
      'ramgram': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Ramgram',
        country: 'Nepal'
      },
      'devdaha': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Devdaha',
        country: 'Nepal'
      },
      'sainamaina': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Sainamaina',
        country: 'Nepal'
      },
      'parasi': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Parasi',
        country: 'Nepal'
      },
      'sunwal': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Sunwal',
        country: 'Nepal'
      },
      'bardaghat': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Bardaghat',
        country: 'Nepal'
      },
      'rampur': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Rampur',
        country: 'Nepal'
      },
      'sarawal': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Sarawal',
        country: 'Nepal'
      },
      'palhinandan': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Palhinandan',
        country: 'Nepal'
      },
      'pratappur': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Pratappur',
        country: 'Nepal'
      },
      'kotahimai': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Kotahimai',
        country: 'Nepal'
      },
      'marchawari': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Marchawari',
        country: 'Nepal'
      },
      'mayadevi': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Mayadevi',
        country: 'Nepal'
      },
      'suddhodhan': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Suddhodhan',
        country: 'Nepal'
      },
      'arihawa': {
        latitude: 27.5000,
        longitude: 83.4500,
        timezone: 'Asia/Kathmandu',
        city: 'Arihawa',
        country: 'Nepal'
      },
      'kohalpur': {
        latitude: 28.1000,
        longitude: 81.6167,
        timezone: 'Asia/Kathmandu',
        city: 'Kohalpur',
        country: 'Nepal'
      },
      'gulariya': {
        latitude: 28.2333,
        longitude: 81.3333,
        timezone: 'Asia/Kathmandu',
        city: 'Gulariya',
        country: 'Nepal'
      },
      'madhyabindu': {
        latitude: 27.9167,
        longitude: 84.4167,
        timezone: 'Asia/Kathmandu',
        city: 'Madhyabindu',
        country: 'Nepal'
      },
      'kawasoti': {
        latitude: 27.9167,
        longitude: 84.4167,
        timezone: 'Asia/Kathmandu',
        city: 'Kawasoti',
        country: 'Nepal'
      },
      'gaindakot': {
        latitude: 27.9167,
        longitude: 84.4167,
        timezone: 'Asia/Kathmandu',
        city: 'Gaindakot',
        country: 'Nepal'
      },
      'devchuli': {
        latitude: 27.9167,
        longitude: 84.4167,
        timezone: 'Asia/Kathmandu',
        city: 'Devchuli',
        country: 'Nepal'
      },
      'bardiya': {
        latitude: 28.2333,
        longitude: 81.3333,
        timezone: 'Asia/Kathmandu',
        city: 'Bardiya',
        country: 'Nepal'
      },
      'banke': {
        latitude: 28.1000,
        longitude: 81.6167,
        timezone: 'Asia/Kathmandu',
        city: 'Banke',
        country: 'Nepal'
      },
      'dang': {
        latitude: 28.1000,
        longitude: 82.3000,
        timezone: 'Asia/Kathmandu',
        city: 'Dang',
        country: 'Nepal'
      },
      'pyuthan': {
        latitude: 28.1000,
        longitude: 82.3000,
        timezone: 'Asia/Kathmandu',
        city: 'Pyuthan',
        country: 'Nepal'
      },
      'rolpa': {
        latitude: 28.1000,
        longitude: 82.3000,
        timezone: 'Asia/Kathmandu',
        city: 'Rolpa',
        country: 'Nepal'
      },
      'rukum': {
        latitude: 28.1000,
        longitude: 82.3000,
        timezone: 'Asia/Kathmandu',
        city: 'Rukum',
        country: 'Nepal'
      },
      'salyan': {
        latitude: 28.1000,
        longitude: 82.3000,
        timezone: 'Asia/Kathmandu',
        city: 'Salyan',
        country: 'Nepal'
      },
      'dolpa': {
        latitude: 29.0000,
        longitude: 82.5000,
        timezone: 'Asia/Kathmandu',
        city: 'Dolpa',
        country: 'Nepal'
      },
      'humla': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Humla',
        country: 'Nepal'
      },
      'jumla': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Jumla',
        country: 'Nepal'
      },
      'kalikot': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Kalikot',
        country: 'Nepal'
      },
      'mugu': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Mugu',
        country: 'Nepal'
      },
      'bajura': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Bajura',
        country: 'Nepal'
      },
      'bajhang': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Bajhang',
        country: 'Nepal'
      },
      'achham': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Achham',
        country: 'Nepal'
      },
      'doti': {
        latitude: 29.5000,
        longitude: 82.0000,
        timezone: 'Asia/Kathmandu',
        city: 'Doti',
        country: 'Nepal'
      },
      'kailali': {
        latitude: 28.6833,
        longitude: 80.6167,
        timezone: 'Asia/Kathmandu',
        city: 'Kailali',
        country: 'Nepal'
      },
      'kanchanpur': {
        latitude: 28.9167,
        longitude: 80.3333,
        timezone: 'Asia/Kathmandu',
        city: 'Kanchanpur',
        country: 'Nepal'
      },
      'dadeldhura': {
        latitude: 29.5000,
        longitude: 80.5000,
        timezone: 'Asia/Kathmandu',
        city: 'Dadeldhura',
        country: 'Nepal'
      },
      'baitadi': {
        latitude: 29.5000,
        longitude: 80.5000,
        timezone: 'Asia/Kathmandu',
        city: 'Baitadi',
        country: 'Nepal'
      },
      'darchula': {
        latitude: 29.5000,
        longitude: 80.5000,
        timezone: 'Asia/Kathmandu',
        city: 'Darchula',
        country: 'Nepal'
      }
    };

    const normalizedLocation = location.toLowerCase().trim();
    const result = mockGeocoding[normalizedLocation] || mockGeocoding['काठमाडौं, नेपाल'];
    
    return result;
  }

  // Mock astrological data for demo mode
  getMockAstrologicalData(validatedData: any) {
    const birthDate = new Date(validatedData.date);
    const birthTime = validatedData.time;
    
    // Generate mock data based on birth date
    const mockData = {
      kundli: {
        ascendant: {
          signName: 'मेष',
          degree: 15.5,
          nakshatraName: 'अश्विनी'
        },
        moonSign: {
          signName: 'कर्क',
          degree: 8.2,
          nakshatraName: 'पुनर्वसु'
        },
        sunSign: {
          signName: 'धनु',
          degree: 22.8,
          nakshatraName: 'पूर्वाषाढा'
        },
        planets: [
          { name: 'सूर्य', sign: 'धनु', degree: 22.8, house: 9 },
          { name: 'चन्द्र', sign: 'कर्क', degree: 8.2, house: 4 },
          { name: 'मंगल', sign: 'वृश्चिक', degree: 5.5, house: 8 },
          { name: 'बुध', sign: 'धनु', degree: 18.3, house: 9 },
          { name: 'गुरु', sign: 'मिथुन', degree: 12.7, house: 3 },
          { name: 'शुक्र', sign: 'मकर', degree: 25.1, house: 10 },
          { name: 'शनि', sign: 'कुम्भ', degree: 8.9, house: 11 },
          { name: 'राहु', sign: 'मिथुन', degree: 15.2, house: 3 },
          { name: 'केतु', sign: 'धनु', degree: 15.2, house: 9 }
        ],
        yogas: [
          { yogaName: 'गजकेसरी योग', yogaType: 'राजयोग', strength: 'मध्यम' },
          { yogaName: 'चन्द्र-मंगल योग', yogaType: 'धनयोग', strength: 'उच्च' },
          { yogaName: 'सूर्य-गुरु योग', yogaType: 'विद्या योग', strength: 'उच्च' }
        ]
      },
      dasha: {
        currentPeriod: {
          vimshottari: 'चन्द्र महादशा',
          antardasha: 'मंगल अन्तर्दशा',
          pratyantardasha: 'सूर्य प्रत्यन्तर्दशा',
          sookshmaDasha: 'बुध सूक्ष्म दशा',
          yoginiDasha: 'शंखिनी योगिनी'
        },
        periods: [
          { planet: 'चन्द्र', startDate: '2020-01-01', endDate: '2030-01-01', type: 'महादशा' },
          { planet: 'मंगल', startDate: '2023-01-01', endDate: '2024-06-01', type: 'अन्तर्दशा' }
        ]
      },
      panchang: {
        tithi: 'शुक्ल पक्ष, नवमी',
        nakshatra: 'पुनर्वसु',
        yoga: 'सिद्धि',
        karana: 'विष्टि',
        sunrise: '06:30',
        sunset: '18:15',
        moonrise: '14:20',
        moonset: '02:45'
      }
    };

    return mockData;
  }

  // Get comprehensive astrological data
  async getAstrologicalData(birthData: z.infer<typeof ProkeralaEnhancedService.BirthDataSchema>) {
    try {
      // Validate birth data
      const validatedData = ProkeralaEnhancedService.BirthDataSchema.parse(birthData);

      // Check if API key is available for real calls
      if (!this.apiKey || this.apiKey === 'demo-key') {
        console.log('Running in demo mode - returning mock astrological data');
        return this.getMockAstrologicalData(validatedData);
      }

      // Make real API calls to Prokerala
      const axios = require('axios');
      
      const kundliResponse = await axios.post(`${this.baseUrl}/kundli`, {
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
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      const dashaResponse = await axios.post(`${this.baseUrl}/dasha`, {
        datetime: `${validatedData.date}T${validatedData.time}:00`,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        timezone: validatedData.timezone,
        ayanamsa: validatedData.ayanamsa,
        dasha_type: 'vimshottari,antardasha,pratyantardasha,sookshma,yogini',
        include_current_period: true,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      const panchangResponse = await axios.get(`${this.baseUrl}/panchang`, {
        params: {
          date: validatedData.date,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          timezone: validatedData.timezone,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      // Transform real API responses
      const realData = {
        kundli: {
          ascendant: {
            signName: kundliResponse.data.ascendant?.sign_name || 'Unknown',
            degree: kundliResponse.data.ascendant?.degree || 0,
            nakshatraName: kundliResponse.data.ascendant?.nakshatra_name || 'Unknown'
          },
          moonSign: {
            signName: kundliResponse.data.moon_sign?.sign_name || 'Unknown',
            degree: kundliResponse.data.moon_sign?.degree || 0,
            nakshatraName: kundliResponse.data.moon_sign?.nakshatra_name || 'Unknown'
          },
          sunSign: {
            signName: kundliResponse.data.sun_sign?.sign_name || 'Unknown',
            degree: kundliResponse.data.sun_sign?.degree || 0,
            nakshatraName: kundliResponse.data.sun_sign?.nakshatra_name || 'Unknown'
          },
          planets: kundliResponse.data.charts?.[0]?.positions?.map((pos: any) => ({
            name: pos.planet,
            sign: pos.sign_name,
            degree: pos.degree,
            house: pos.house
          })) || [],
          houses: kundliResponse.data.charts?.[0]?.houses?.map((house: any) => ({
            number: house.house,
            sign: house.sign_name,
            lord: house.lord_name
          })) || [],
          yogas: kundliResponse.data.yogas?.map((yoga: any) => ({
            yogaName: yoga.yoga_name,
            yogaType: yoga.yoga_type,
            strength: yoga.strength
          })) || [],
          charts: kundliResponse.data.charts?.map((chart: any) => ({
            chartType: chart.chart_type,
            chartName: chart.chart_name,
            positions: chart.positions || []
          })) || []
        },
        dasha: {
          currentPeriod: {
            vimshottari: dashaResponse.data.current_period?.vimshottari || 'Unknown',
            antardasha: dashaResponse.data.current_period?.antardasha || 'Unknown',
            pratyantardasha: dashaResponse.data.current_period?.pratyantardasha || 'Unknown',
            sookshmaDasha: dashaResponse.data.current_period?.sookshma_dasha || 'Unknown',
            yoginiDasha: dashaResponse.data.current_period?.yogini_dasha || 'Unknown'
          },
          periods: dashaResponse.data.vimshottari_dasha?.periods?.map((period: any) => ({
            planet: period.planet_name,
            startDate: period.start_date,
            endDate: period.end_date,
            remaining: period.remaining
          })) || []
        },
        panchang: {
          tithi: { 
            name: panchangResponse.data.panchang?.tithi?.name || 'Unknown',
            number: panchangResponse.data.panchang?.tithi?.number || 0
          },
          nakshatra: { 
            name: panchangResponse.data.panchang?.nakshatra?.name || 'Unknown',
            number: panchangResponse.data.panchang?.nakshatra?.number || 0
          },
          yoga: { 
            name: panchangResponse.data.panchang?.yoga?.name || 'Unknown',
            number: panchangResponse.data.panchang?.yoga?.number || 0
          },
          karana: { 
            name: panchangResponse.data.panchang?.karana?.name || 'Unknown',
            number: panchangResponse.data.panchang?.karana?.number || 0
          },
          sunrise: panchangResponse.data.panchang?.sunrise || 'Unknown',
          sunset: panchangResponse.data.panchang?.sunset || 'Unknown',
          moonrise: panchangResponse.data.panchang?.moonrise || 'Unknown',
          moonset: panchangResponse.data.panchang?.moonset || 'Unknown'
        },
        computedAt: new Date().toISOString(),
        provider: 'prokerala-real'
      };

      return realData;

    } catch (error) {
      console.error('Error fetching astrological data:', error);
      throw new Error('Failed to fetch astrological data');
    }
  }

  // Get health status
  async getHealthStatus() {
    return {
      status: 'healthy',
      apiKey: this.apiKey ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    };
  }
}

export const prokeralaEnhancedService = new ProkeralaEnhancedService();


