import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';
import OpenAI from 'openai';

interface NLPAnalysis {
  language: string;
  confidence: number;
  sentiment: {
    score: number;
    label: string;
    emotions: string[];
  };
  entities: {
    person: string[];
    organization: string[];
    location: string[];
    astrological: string[];
    temporal: string[];
  };
  keywords: string[];
  topics: string[];
  intent: string;
  astrologicalContext: {
    planets: string[];
    signs: string[];
    houses: string[];
    aspects: string[];
    yogas: string[];
    dashas: string[];
  };
  complexity: number;
  readability: number;
  culturalContext: {
    region: string;
    religion: string;
    traditions: string[];
  };
}

interface LanguageDetection {
  language: string;
  confidence: number;
  script: string;
  region: string;
}

interface SentimentAnalysis {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  emotions: string[];
  intensity: number;
  confidence: number;
}

interface EntityExtraction {
  entities: {
    person: string[];
    organization: string[];
    location: string[];
    astrological: string[];
    temporal: string[];
    numerical: string[];
  };
  relationships: Array<{
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
  }>;
}

interface TopicModeling {
  topics: Array<{
    name: string;
    weight: number;
    keywords: string[];
  }>;
  primaryTopic: string;
  topicDistribution: number[];
}

interface IntentRecognition {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  actions: string[];
}

class AdvancedNLP {
  private openai: OpenAI;
  private languageModels: Map<string, any>;
  private sentimentModels: Map<string, any>;
  private entityModels: Map<string, any>;
  private topicModels: Map<string, any>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.languageModels = new Map();
    this.sentimentModels = new Map();
    this.entityModels = new Map();
    this.topicModels = new Map();
  }

  /**
   * Comprehensive NLP analysis
   */
  async analyzeText(
    text: string,
    sessionId: string,
    language: 'ne' | 'hi' | 'en' = 'ne'
  ): Promise<NLPAnalysis> {
    const startTime = Date.now();
    
    try {
      // Run all NLP analyses in parallel
      const [
        languageDetection,
        sentimentAnalysis,
        entityExtraction,
        topicModeling,
        intentRecognition,
        astrologicalContext,
        culturalContext,
      ] = await Promise.all([
        this.detectLanguage(text),
        this.analyzeSentiment(text, language),
        this.extractEntities(text, language),
        this.modelTopics(text, language),
        this.recognizeIntent(text, language),
        this.extractAstrologicalContext(text, language),
        this.analyzeCulturalContext(text, language),
      ]);

      const analysis: NLPAnalysis = {
        language: languageDetection.language,
        confidence: languageDetection.confidence,
        sentiment: sentimentAnalysis,
        entities: entityExtraction.entities,
        keywords: this.extractKeywords(text, language),
        topics: topicModeling.topics.map(t => t.name),
        intent: intentRecognition.intent,
        astrologicalContext,
        complexity: this.calculateComplexity(text),
        readability: this.calculateReadability(text, language),
        culturalContext,
      };

      // Track analytics
      await analyticsService.trackEvent({
        type: 'performance',
        category: 'advanced_nlp',
        action: 'text_analyzed',
        sessionId,
        metadata: {
          language: analysis.language,
          sentiment: analysis.sentiment.label,
          entities: analysis.entities.astrological.length,
          topics: analysis.topics.length,
          intent: analysis.intent,
          complexity: analysis.complexity,
        },
        success: true,
        duration: Date.now() - startTime,
      });

      return analysis;
    } catch (error) {
      console.error('Advanced NLP analysis error:', error);
      throw error;
    }
  }

  /**
   * Detect language and script
   */
  async detectLanguage(text: string): Promise<LanguageDetection> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Detect the language, script, and region of the given text. Return JSON with language, confidence, script, and region.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        language: result.language || 'unknown',
        confidence: result.confidence || 0.8,
        script: result.script || 'latin',
        region: result.region || 'unknown',
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return {
        language: 'ne',
        confidence: 0.8,
        script: 'devanagari',
        region: 'nepal',
      };
    }
  }

  /**
   * Analyze sentiment and emotions
   */
  async analyzeSentiment(text: string, language: string): Promise<SentimentAnalysis> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze the sentiment and emotions in this ${language} text. 
            Return JSON with score (-1 to 1), label (positive/negative/neutral), emotions array, intensity (0-1), and confidence (0-1).`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        score: result.score || 0,
        label: result.label || 'neutral',
        emotions: result.emotions || [],
        intensity: result.intensity || 0.5,
        confidence: result.confidence || 0.8,
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        score: 0,
        label: 'neutral',
        emotions: [],
        intensity: 0.5,
        confidence: 0.8,
      };
    }
  }

  /**
   * Extract entities and relationships
   */
  async extractEntities(text: string, language: string): Promise<EntityExtraction> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract entities and relationships from this ${language} text.
            Focus on: persons, organizations, locations, astrological terms, temporal expressions, and numerical values.
            Also identify relationships between entities.
            Return JSON with entities object and relationships array.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        entities: {
          person: result.entities?.person || [],
          organization: result.entities?.organization || [],
          location: result.entities?.location || [],
          astrological: result.entities?.astrological || [],
          temporal: result.entities?.temporal || [],
          numerical: result.entities?.numerical || [],
        },
        relationships: result.relationships || [],
      };
    } catch (error) {
      console.error('Entity extraction error:', error);
      return {
        entities: {
          person: [],
          organization: [],
          location: [],
          astrological: [],
          temporal: [],
          numerical: [],
        },
        relationships: [],
      };
    }
  }

  /**
   * Model topics and themes
   */
  async modelTopics(text: string, language: string): Promise<TopicModeling> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Identify topics and themes in this ${language} text.
            Focus on astrological, religious, cultural, and personal topics.
            Return JSON with topics array (name, weight, keywords), primaryTopic, and topicDistribution.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        topics: result.topics || [],
        primaryTopic: result.primaryTopic || 'general',
        topicDistribution: result.topicDistribution || [1.0],
      };
    } catch (error) {
      console.error('Topic modeling error:', error);
      return {
        topics: [{ name: 'general', weight: 1.0, keywords: [] }],
        primaryTopic: 'general',
        topicDistribution: [1.0],
      };
    }
  }

  /**
   * Recognize intent and actions
   */
  async recognizeIntent(text: string, language: string): Promise<IntentRecognition> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Recognize the intent and actions in this ${language} text.
            Common intents: question, request, complaint, praise, information, advice, prediction, analysis.
            Return JSON with intent, confidence, parameters, and actions.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        intent: result.intent || 'question',
        confidence: result.confidence || 0.8,
        parameters: result.parameters || {},
        actions: result.actions || [],
      };
    } catch (error) {
      console.error('Intent recognition error:', error);
      return {
        intent: 'question',
        confidence: 0.8,
        parameters: {},
        actions: [],
      };
    }
  }

  /**
   * Extract astrological context
   */
  async extractAstrologicalContext(text: string, language: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract astrological context from this ${language} text.
            Look for: planets, signs, houses, aspects, yogas, dashas, transits, etc.
            Return JSON with planets, signs, houses, aspects, yogas, and dashas arrays.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        planets: result.planets || [],
        signs: result.signs || [],
        houses: result.houses || [],
        aspects: result.aspects || [],
        yogas: result.yogas || [],
        dashas: result.dashas || [],
      };
    } catch (error) {
      console.error('Astrological context extraction error:', error);
      return {
        planets: [],
        signs: [],
        houses: [],
        aspects: [],
        yogas: [],
        dashas: [],
      };
    }
  }

  /**
   * Analyze cultural context
   */
  async analyzeCulturalContext(text: string, language: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze cultural context from this ${language} text.
            Identify: region, religion, traditions, cultural references.
            Return JSON with region, religion, and traditions array.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        region: result.region || 'south_asia',
        religion: result.religion || 'hinduism',
        traditions: result.traditions || ['vedic_astrology'],
      };
    } catch (error) {
      console.error('Cultural context analysis error:', error);
      return {
        region: 'south_asia',
        religion: 'hinduism',
        traditions: ['vedic_astrology'],
      };
    }
  }

  /**
   * Extract keywords
   */
  private extractKeywords(text: string, language: string): string[] {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = this.getStopWords(language);
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .slice(0, 10);
  }

  /**
   * Calculate text complexity
   */
  private calculateComplexity(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = this.countSyllables(text);
    
    // Simple complexity score (0-1)
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    return Math.min(1, (avgWordsPerSentence / 20) + (avgSyllablesPerWord / 3));
  }

  /**
   * Calculate readability score
   */
  private calculateReadability(text: string, language: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = this.countSyllables(text);
    
    // Flesch Reading Ease formula (simplified)
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in text
   */
  private countSyllables(text: string): number {
    // Simple syllable counting
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;
    
    words.forEach(word => {
      const vowels = word.match(/[aeiou]/g);
      syllables += vowels ? vowels.length : 1;
    });
    
    return syllables;
  }

  /**
   * Get stop words for language
   */
  private getStopWords(language: string): string[] {
    const stopWords = {
      ne: ['का', 'को', 'मा', 'ले', 'बाट', 'सँग', 'लाई', 'हरू', 'हुन्', 'छ', 'छन्'],
      hi: ['का', 'को', 'में', 'से', 'के', 'साथ', 'को', 'है', 'हैं', 'था', 'थे'],
      en: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
    };
    
    return stopWords[language as keyof typeof stopWords] || stopWords.en;
  }

  /**
   * Get NLP statistics
   */
  getNLPStats(): any {
    return {
      languageModels: this.languageModels.size,
      sentimentModels: this.sentimentModels.size,
      entityModels: this.entityModels.size,
      topicModels: this.topicModels.size,
      totalModels: this.languageModels.size + this.sentimentModels.size + 
                   this.entityModels.size + this.topicModels.size,
    };
  }

  /**
   * Clear NLP data
   */
  clearNLPData(): void {
    this.languageModels.clear();
    this.sentimentModels.clear();
    this.entityModels.clear();
    this.topicModels.clear();
  }
}

export const advancedNLP = new AdvancedNLP();
