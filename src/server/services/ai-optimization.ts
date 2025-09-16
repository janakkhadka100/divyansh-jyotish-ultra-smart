import { prisma } from '@/server/lib/prisma';
import { analyticsService } from './analytics';
import { z } from 'zod';

interface AIOptimizationConfig {
  enableCaching: boolean;
  enablePrediction: boolean;
  enableSmartContext: boolean;
  enableResponseOptimization: boolean;
  cacheTTL: number; // in seconds
  maxCacheSize: number;
  predictionThreshold: number; // confidence threshold for predictions
}

interface CachedResponse {
  id: string;
  query: string;
  response: string;
  metadata: {
    language: string;
    sessionId: string;
    userId: string;
    timestamp: number;
    confidence: number;
  };
  ttl: number;
}

interface SmartContext {
  sessionId: string;
  userId: string;
  recentTopics: string[];
  userPreferences: {
    language: string;
    responseStyle: string;
    expertise: string[];
  };
  conversationFlow: {
    currentTopic: string;
    previousTopics: string[];
    nextLikelyTopics: string[];
  };
  astrologicalContext: {
    currentDasha: string;
    ascendant: string;
    moonSign: string;
    keyYogas: string[];
  };
}

interface ResponsePrediction {
  query: string;
  predictedResponse: string;
  confidence: number;
  reasoning: string;
}

class AIOptimizationService {
  private config: AIOptimizationConfig;
  private responseCache: Map<string, CachedResponse>;
  private contextCache: Map<string, SmartContext>;
  private predictionCache: Map<string, ResponsePrediction>;

  constructor(config?: Partial<AIOptimizationConfig>) {
    this.config = {
      enableCaching: true,
      enablePrediction: true,
      enableSmartContext: true,
      enableResponseOptimization: true,
      cacheTTL: 3600, // 1 hour
      maxCacheSize: 1000,
      predictionThreshold: 0.8,
      ...config,
    };
    
    this.responseCache = new Map();
    this.contextCache = new Map();
    this.predictionCache = new Map();
  }

  /**
   * Get optimized AI response with caching and prediction
   */
  async getOptimizedResponse(
    query: string,
    sessionId: string,
    language: 'ne' | 'hi' | 'en',
    horoscopeData: any
  ): Promise<{
    response: string;
    fromCache: boolean;
    confidence: number;
    metadata: any;
  }> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache first
      if (this.config.enableCaching) {
        const cachedResponse = await this.getCachedResponse(query, sessionId, language);
        if (cachedResponse) {
          await analyticsService.trackEvent({
            type: 'performance',
            category: 'ai_optimization',
            action: 'cache_hit',
            sessionId,
            metadata: { query, language },
            success: true,
            duration: Date.now() - startTime,
          });
          
          return {
            response: cachedResponse.response,
            fromCache: true,
            confidence: cachedResponse.metadata.confidence,
            metadata: cachedResponse.metadata,
          };
        }
      }

      // 2. Get smart context
      const context = await this.getSmartContext(sessionId, language, horoscopeData);
      
      // 3. Check prediction cache
      if (this.config.enablePrediction) {
        const prediction = await this.getResponsePrediction(query, context);
        if (prediction && prediction.confidence >= this.config.predictionThreshold) {
          await this.cacheResponse(query, prediction.predictedResponse, sessionId, language, prediction.confidence);
          
          await analyticsService.trackEvent({
            type: 'performance',
            category: 'ai_optimization',
            action: 'prediction_hit',
            sessionId,
            metadata: { query, language, confidence: prediction.confidence },
            success: true,
            duration: Date.now() - startTime,
          });
          
          return {
            response: prediction.predictedResponse,
            fromCache: false,
            confidence: prediction.confidence,
            metadata: { source: 'prediction', reasoning: prediction.reasoning },
          };
        }
      }

      // 4. Generate optimized response
      const response = await this.generateOptimizedResponse(query, context, horoscopeData);
      
      // 5. Cache the response
      if (this.config.enableCaching) {
        await this.cacheResponse(query, response, sessionId, language, 0.9);
      }

      // 6. Update context
      await this.updateContext(sessionId, query, response, language);

      await analyticsService.trackEvent({
        type: 'performance',
        category: 'ai_optimization',
        action: 'response_generated',
        sessionId,
        metadata: { query, language },
        success: true,
        duration: Date.now() - startTime,
      });

      return {
        response,
        fromCache: false,
        confidence: 0.9,
        metadata: { source: 'generated', context: context.conversationFlow.currentTopic },
      };

    } catch (error) {
      console.error('AI Optimization Error:', error);
      
      await analyticsService.trackEvent({
        type: 'error',
        category: 'ai_optimization',
        action: 'response_generation_failed',
        sessionId,
        metadata: { query, language, error: error instanceof Error ? error.message : 'Unknown error' },
        success: false,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Get cached response if available
   */
  private async getCachedResponse(
    query: string,
    sessionId: string,
    language: string
  ): Promise<CachedResponse | null> {
    const cacheKey = this.generateCacheKey(query, sessionId, language);
    const cached = this.responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.metadata.timestamp < cached.ttl * 1000) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      this.responseCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Cache AI response
   */
  private async cacheResponse(
    query: string,
    response: string,
    sessionId: string,
    language: string,
    confidence: number
  ): Promise<void> {
    if (this.responseCache.size >= this.config.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.responseCache.entries());
      entries.sort((a, b) => a[1].metadata.timestamp - b[1].metadata.timestamp);
      
      for (let i = 0; i < Math.floor(this.config.maxCacheSize * 0.1); i++) {
        this.responseCache.delete(entries[i][0]);
      }
    }

    const cacheKey = this.generateCacheKey(query, sessionId, language);
    const cachedResponse: CachedResponse = {
      id: cacheKey,
      query,
      response,
      metadata: {
        language,
        sessionId,
        userId: 'anonymous', // TODO: Get from session
        timestamp: Date.now(),
        confidence,
      },
      ttl: this.config.cacheTTL,
    };

    this.responseCache.set(cacheKey, cachedResponse);
  }

  /**
   * Get smart context for the session
   */
  private async getSmartContext(
    sessionId: string,
    language: string,
    horoscopeData: any
  ): Promise<SmartContext> {
    const contextKey = `context_${sessionId}`;
    let context = this.contextCache.get(contextKey);

    if (!context) {
      // Build context from session data
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          chats: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          result: true,
        },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      context = {
        sessionId,
        userId: session.userId,
        recentTopics: this.extractTopics(session.chats),
        userPreferences: {
          language,
          responseStyle: 'friendly',
          expertise: ['vedic', 'astrology'],
        },
        conversationFlow: {
          currentTopic: this.detectCurrentTopic(session.chats),
          previousTopics: this.extractPreviousTopics(session.chats),
          nextLikelyTopics: this.predictNextTopics(session.chats),
        },
        astrologicalContext: {
          currentDasha: horoscopeData?.summary?.currentDasha || 'Unknown',
          ascendant: horoscopeData?.summary?.ascendant?.sign || 'Unknown',
          moonSign: horoscopeData?.summary?.moonSign?.sign || 'Unknown',
          keyYogas: horoscopeData?.summary?.keyYogas || [],
        },
      };

      this.contextCache.set(contextKey, context);
    }

    return context;
  }

  /**
   * Get response prediction based on context
   */
  private async getResponsePrediction(
    query: string,
    context: SmartContext
  ): Promise<ResponsePrediction | null> {
    const predictionKey = `prediction_${query}_${context.sessionId}`;
    const cached = this.predictionCache.get(predictionKey);

    if (cached) {
      return cached;
    }

    // Simple prediction logic based on query patterns
    const predictions = this.generatePredictions(query, context);
    
    if (predictions.length > 0) {
      const bestPrediction = predictions[0];
      this.predictionCache.set(predictionKey, bestPrediction);
      return bestPrediction;
    }

    return null;
  }

  /**
   * Generate optimized AI response
   */
  private async generateOptimizedResponse(
    query: string,
    context: SmartContext,
    horoscopeData: any
  ): Promise<string> {
    // Build optimized system prompt
    const systemPrompt = this.buildOptimizedSystemPrompt(context, horoscopeData);
    
    // Generate response using OpenAI with optimized parameters
    const response = await this.callOpenAI(query, systemPrompt, context);
    
    return response;
  }

  /**
   * Build optimized system prompt
   */
  private buildOptimizedSystemPrompt(context: SmartContext, horoscopeData: any): string {
    const { language, responseStyle, expertise } = context.userPreferences;
    const { currentDasha, ascendant, moonSign, keyYogas } = context.astrologicalContext;
    
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

    return `You are an intelligent Vedic astrology assistant speaking in ${config.language}.

PERSONALITY & STYLE:
- Response style: ${responseStyle}
- Expertise: ${expertise.join(', ')}
- Be wise, patient, and helpful
- Always respond in ${config.language}

CURRENT ASTROLOGICAL CONTEXT:
- Current Dasha: ${currentDasha}
- Ascendant: ${ascendant}
- Moon Sign: ${moonSign}
- Key Yogas: ${keyYogas.join(', ')}

CONVERSATION CONTEXT:
- Current topic: ${context.conversationFlow.currentTopic}
- Recent topics: ${context.recentTopics.join(', ')}
- Next likely topics: ${context.conversationFlow.nextLikelyTopics.join(', ')}

IMPORTANT GUIDELINES:
1. Always respond in ${config.language}
2. Be cautious and never make medical or financial guarantees
3. Base your responses on the provided horoscope data
4. Use the saved horoscope summary and payload data
5. Offer helpful insights but remind users that astrology is for guidance only
6. Be concise but comprehensive
7. Anticipate follow-up questions
8. Provide actionable advice when possible

EXAMPLE QUESTIONS YOU CAN ANSWER:
${config.examples.map(ex => `- ${ex}`).join('\n')}

HOROSCOPE DATA:
${JSON.stringify(horoscopeData?.summary || {}, null, 2)}

Be intelligent, fast, and provide the most helpful response possible.`;
  }

  /**
   * Call OpenAI with optimized parameters
   */
  private async callOpenAI(query: string, systemPrompt: string, context: SmartContext): Promise<string> {
    // This would integrate with the actual OpenAI API
    // For now, return a mock response
    return `I understand your question about "${query}". Based on your astrological chart, I can provide insights about your current dasha and planetary positions.`;
  }

  /**
   * Update context after response
   */
  private async updateContext(
    sessionId: string,
    query: string,
    response: string,
    language: string
  ): Promise<void> {
    const contextKey = `context_${sessionId}`;
    const context = this.contextCache.get(contextKey);
    
    if (context) {
      // Update conversation flow
      context.conversationFlow.previousTopics.push(context.conversationFlow.currentTopic);
      context.conversationFlow.currentTopic = this.detectCurrentTopic([{ content: query }]);
      context.recentTopics = this.extractTopics([{ content: query }]);
      
      this.contextCache.set(contextKey, context);
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: string, sessionId: string, language: string): string {
    return `${language}_${sessionId}_${Buffer.from(query).toString('base64')}`;
  }

  /**
   * Extract topics from chat messages
   */
  private extractTopics(chats: any[]): string[] {
    const topics = new Set<string>();
    
    chats.forEach(chat => {
      const content = chat.content.toLowerCase();
      
      // Simple topic extraction
      if (content.includes('दशा') || content.includes('dasha')) topics.add('dasha');
      if (content.includes('योग') || content.includes('yoga')) topics.add('yoga');
      if (content.includes('ग्रह') || content.includes('planet')) topics.add('planets');
      if (content.includes('राशि') || content.includes('sign')) topics.add('signs');
      if (content.includes('घर') || content.includes('house')) topics.add('houses');
      if (content.includes('पञ्चाङ्ग') || content.includes('panchang')) topics.add('panchang');
    });
    
    return Array.from(topics);
  }

  /**
   * Detect current topic from recent messages
   */
  private detectCurrentTopic(chats: any[]): string {
    if (chats.length === 0) return 'general';
    
    const latestMessage = chats[0].content.toLowerCase();
    
    if (latestMessage.includes('दशा') || latestMessage.includes('dasha')) return 'dasha';
    if (latestMessage.includes('योग') || latestMessage.includes('yoga')) return 'yoga';
    if (latestMessage.includes('ग्रह') || latestMessage.includes('planet')) return 'planets';
    if (latestMessage.includes('राशि') || latestMessage.includes('sign')) return 'signs';
    if (latestMessage.includes('घर') || latestMessage.includes('house')) return 'houses';
    if (latestMessage.includes('पञ्चाङ्ग') || latestMessage.includes('panchang')) return 'panchang';
    
    return 'general';
  }

  /**
   * Extract previous topics
   */
  private extractPreviousTopics(chats: any[]): string[] {
    return this.extractTopics(chats.slice(1));
  }

  /**
   * Predict next likely topics
   */
  private predictNextTopics(chats: any[]): string[] {
    const topics = this.extractTopics(chats);
    const predictions = [];
    
    // Simple prediction logic
    if (topics.includes('dasha')) {
      predictions.push('yoga', 'planets');
    }
    if (topics.includes('yoga')) {
      predictions.push('dasha', 'houses');
    }
    if (topics.includes('planets')) {
      predictions.push('signs', 'houses');
    }
    
    return predictions.slice(0, 3);
  }

  /**
   * Generate predictions based on query and context
   */
  private generatePredictions(query: string, context: SmartContext): ResponsePrediction[] {
    const predictions: ResponsePrediction[] = [];
    
    // Simple prediction patterns
    if (query.includes('दशा') || query.includes('dasha')) {
      predictions.push({
        query,
        predictedResponse: `तपाईंको वर्तमान दशा ${context.astrologicalContext.currentDasha} हो। यो दशा तपाईंको जीवनमा केही महत्वपूर्ण परिवर्तनहरू ल्याउन सक्छ।`,
        confidence: 0.9,
        reasoning: 'Dasha-related query with high confidence',
      });
    }
    
    if (query.includes('योग') || query.includes('yoga')) {
      predictions.push({
        query,
        predictedResponse: `तपाईंको जन्मकुण्डलीमा ${context.astrologicalContext.keyYogas.join(', ')} जस्ता योगहरू छन्। यी योगहरू तपाईंको जीवनमा विशेष प्रभाव राख्छन्।`,
        confidence: 0.8,
        reasoning: 'Yoga-related query with medium confidence',
      });
    }
    
    return predictions;
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.responseCache.clear();
    this.contextCache.clear();
    this.predictionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    responseCache: number;
    contextCache: number;
    predictionCache: number;
    totalSize: number;
  } {
    return {
      responseCache: this.responseCache.size,
      contextCache: this.contextCache.size,
      predictionCache: this.predictionCache.size,
      totalSize: this.responseCache.size + this.contextCache.size + this.predictionCache.size,
    };
  }
}

export const aiOptimizationService = new AIOptimizationService();



