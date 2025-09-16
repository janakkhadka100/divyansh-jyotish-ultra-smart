import { geocodingService as baseGeoService, GeocodingResult } from './geo';
import { cacheService } from './cache';

export interface LocalizedPlaceName {
  original: string;
  localized: string;
  language: string;
  confidence: number;
}

export interface MultiLanguageGeocodingResult extends GeocodingResult {
  localizedNames: LocalizedPlaceName[];
  rtlSupport: boolean;
  culturalContext: {
    language: string;
    script: string;
    direction: 'ltr' | 'rtl';
    currency: string;
    dateFormat: string;
    numberFormat: string;
  };
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  dateFormat: string;
  numberFormat: string;
  geocodingProviders: string[];
}

class MultiLanguageGeocodingService {
  private languageConfigs: Map<string, LanguageConfig> = new Map();
  private translationCache: Map<string, string> = new Map();

  constructor() {
    this.initializeLanguageConfigs();
  }

  private initializeLanguageConfigs(): void {
    const configs: LanguageConfig[] = [
      {
        code: 'ne',
        name: 'Nepali',
        nativeName: 'नेपाली',
        script: 'Devanagari',
        direction: 'ltr',
        currency: 'NPR',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'en-US',
        geocodingProviders: ['osm', 'google'],
      },
      {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        script: 'Devanagari',
        direction: 'ltr',
        currency: 'INR',
        dateFormat: 'DD-MM-YYYY',
        numberFormat: 'en-IN',
        geocodingProviders: ['osm', 'google'],
      },
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        script: 'Latin',
        direction: 'ltr',
        currency: 'USD',
        dateFormat: 'MM-DD-YYYY',
        numberFormat: 'en-US',
        geocodingProviders: ['osm', 'google'],
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        script: 'Arabic',
        direction: 'rtl',
        currency: 'SAR',
        dateFormat: 'DD-MM-YYYY',
        numberFormat: 'ar-SA',
        geocodingProviders: ['osm', 'google'],
      },
      {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        script: 'Han',
        direction: 'ltr',
        currency: 'CNY',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'zh-CN',
        geocodingProviders: ['osm', 'google'],
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        script: 'Hiragana',
        direction: 'ltr',
        currency: 'JPY',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'ja-JP',
        geocodingProviders: ['osm', 'google'],
      },
    ];

    configs.forEach(config => {
      this.languageConfigs.set(config.code, config);
    });
  }

  async geocode(
    place: string,
    targetLanguage: string = 'en',
    options: {
      provider?: 'osm' | 'google';
      useCache?: boolean;
      includeTranslations?: boolean;
    } = {}
  ): Promise<MultiLanguageGeocodingResult> {
    const {
      provider = 'osm',
      useCache = true,
      includeTranslations = true
    } = options;

    // Get base geocoding result
    const baseResult = await baseGeoService.geocode(place, { provider });

    // Get language configuration
    const langConfig = this.languageConfigs.get(targetLanguage) || this.languageConfigs.get('en')!;

    // Generate localized names
    const localizedNames: LocalizedPlaceName[] = [];
    
    if (includeTranslations) {
      // Add original name
      localizedNames.push({
        original: place,
        localized: place,
        language: 'original',
        confidence: 1.0,
      });

      // Add localized names for different languages
      const languages = ['ne', 'hi', 'en', 'ar', 'zh', 'ja'];
      
      for (const lang of languages) {
        if (lang !== targetLanguage) {
          try {
            const translated = await this.translatePlaceName(place, lang, useCache);
            if (translated && translated !== place) {
              localizedNames.push({
                original: place,
                localized: translated,
                language: lang,
                confidence: 0.8, // Translation confidence
              });
            }
          } catch (error) {
            console.warn(`Translation failed for ${lang}:`, error);
          }
        }
      }
    }

    // Get cultural context
    const culturalContext = {
      language: langConfig.code,
      script: langConfig.script,
      direction: langConfig.direction,
      currency: langConfig.currency,
      dateFormat: langConfig.dateFormat,
      numberFormat: langConfig.numberFormat,
    };

    return {
      ...baseResult,
      localizedNames,
      rtlSupport: langConfig.direction === 'rtl',
      culturalContext,
    };
  }

  private async translatePlaceName(
    place: string,
    targetLanguage: string,
    useCache: boolean
  ): Promise<string> {
    const cacheKey = `translation:${place}:${targetLanguage}`;

    if (useCache) {
      const cached = await cacheService.get<string>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Simple translation mapping for common places
      const translation = await this.getPlaceTranslation(place, targetLanguage);
      
      if (useCache && translation) {
        await cacheService.set(cacheKey, translation, { ttl: 86400 }); // 24 hours
      }

      return translation || place;
    } catch (error) {
      console.error('Translation error:', error);
      return place;
    }
  }

  private async getPlaceTranslation(place: string, targetLanguage: string): Promise<string> {
    // This would integrate with a real translation service
    // For now, we'll use a simple mapping for demonstration
    
    const translations: Record<string, Record<string, string>> = {
      'Kathmandu': {
        'ne': 'काठमाडौं',
        'hi': 'काठमांडू',
        'ar': 'كاتماندو',
        'zh': '加德满都',
        'ja': 'カトマンズ',
      },
      'Nepal': {
        'ne': 'नेपाल',
        'hi': 'नेपाल',
        'ar': 'نيبال',
        'zh': '尼泊尔',
        'ja': 'ネパール',
      },
      'India': {
        'ne': 'भारत',
        'hi': 'भारत',
        'ar': 'الهند',
        'zh': '印度',
        'ja': 'インド',
      },
      'New York': {
        'ne': 'न्युयोर्क',
        'hi': 'न्यूयॉर्क',
        'ar': 'نيويورك',
        'zh': '纽约',
        'ja': 'ニューヨーク',
      },
      'London': {
        'ne': 'लन्डन',
        'hi': 'लंदन',
        'ar': 'لندن',
        'zh': '伦敦',
        'ja': 'ロンドン',
      },
    };

    // Try to find translation for the place name
    for (const [key, translations] of Object.entries(translations)) {
      if (place.toLowerCase().includes(key.toLowerCase())) {
        return translations[targetLanguage] || place;
      }
    }

    // If no specific translation found, return original
    return place;
  }

  async getSupportedLanguages(): Promise<LanguageConfig[]> {
    return Array.from(this.languageConfigs.values());
  }

  async getLanguageConfig(languageCode: string): Promise<LanguageConfig | null> {
    return this.languageConfigs.get(languageCode) || null;
  }

  async formatAddress(
    result: GeocodingResult,
    language: string = 'en',
    format: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string> {
    const langConfig = this.languageConfigs.get(language) || this.languageConfigs.get('en')!;
    
    const parts: string[] = [];
    
    if (result.city) {
      parts.push(result.city);
    }
    
    if (result.country) {
      parts.push(result.country);
    }

    let formattedAddress = parts.join(', ');

    // Apply language-specific formatting
    if (langConfig.direction === 'rtl') {
      formattedAddress = parts.reverse().join('، '); // Arabic comma
    }

    // Apply format length
    switch (format) {
      case 'short':
        return result.city || result.country || formattedAddress;
      case 'medium':
        return formattedAddress;
      case 'long':
        return result.displayName || formattedAddress;
      default:
        return formattedAddress;
    }
  }

  async formatCoordinates(
    lat: number,
    lon: number,
    language: string = 'en',
    format: 'decimal' | 'dms' = 'decimal'
  ): Promise<string> {
    const langConfig = this.languageConfigs.get(language) || this.languageConfigs.get('en')!;
    
    if (format === 'dms') {
      const latDMS = this.decimalToDMS(lat, 'lat');
      const lonDMS = this.decimalToDMS(lon, 'lon');
      return `${latDMS}, ${lonDMS}`;
    }

    // Decimal format with language-specific number formatting
    const formatter = new Intl.NumberFormat(langConfig.numberFormat, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });

    return `${formatter.format(lat)}, ${formatter.format(lon)}`;
  }

  private decimalToDMS(decimal: number, type: 'lat' | 'lon'): string {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = ((abs - degrees) * 60 - minutes) * 60;

    const direction = type === 'lat' 
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W');

    return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
  }

  async clearTranslationCache(): Promise<void> {
    await cacheService.clear('translation');
  }
}

// Export singleton instance
export const multiLanguageGeocodingService = new MultiLanguageGeocodingService();

// Export class for testing
export { MultiLanguageGeocodingService };


