import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';
import { caches } from '@/server/services/cache';

interface LearningData {
  sessionId: string;
  userId: string;
  interactions: Interaction[];
  patterns: UserPatterns;
  preferences: UserPreferences;
  performance: PerformanceMetrics;
  lastUpdated: Date;
}

interface Interaction {
  id: string;
  query: string;
  response: string;
  responseTime: number;
  userSatisfaction: number;
  timestamp: Date;
  context: any;
  metadata: any;
}

interface UserPatterns {
  commonQuestions: string[];
  preferredTopics: string[];
  questionTypes: string[];
  responseStyles: string[];
  timePatterns: {
    activeHours: number[];
    averageSessionLength: number;
    frequency: number;
  };
  languagePatterns: {
    primaryLanguage: string;
    codeSwitching: boolean;
    formality: 'formal' | 'casual' | 'mixed';
  };
}

interface UserPreferences {
  responseStyle: 'friendly' | 'professional' | 'mystical' | 'analytical';
  detailLevel: 'brief' | 'moderate' | 'detailed';
  examples: boolean;
  explanations: boolean;
  predictions: boolean;
  humor: boolean;
  culturalContext: boolean;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  userSatisfaction: number;
  responseAccuracy: number;
  contextRetention: number;
  predictionAccuracy: number;
  learningRate: number;
}

class RealTimeLearningSystem {
  private learningData: Map<string, LearningData>;
  private patternCache: Map<string, any>;
  private learningRate: number;
  private maxInteractions: number;

  constructor() {
    this.learningData = new Map();
    this.patternCache = new Map();
    this.learningRate = 0.1;
    this.maxInteractions = 1000;
  }

  /**
   * Learn from user interaction in real-time
   */
  async learnFromInteraction(
    sessionId: string,
    userId: string,
    query: string,
    response: string,
    responseTime: number,
    context: any,
    metadata: any
  ): Promise<void> {
    try {
      // Get or create learning data
      let learningData = this.learningData.get(sessionId);
      if (!learningData) {
        learningData = await this.initializeLearningData(sessionId, userId);
      }

      // Create interaction record
      const interaction: Interaction = {
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        response,
        responseTime,
        userSatisfaction: this.calculateUserSatisfaction(query, response, responseTime),
        timestamp: new Date(),
        context,
        metadata,
      };

      // Add interaction
      learningData.interactions.push(interaction);
      
      // Keep only recent interactions
      if (learningData.interactions.length > this.maxInteractions) {
        learningData.interactions = learningData.interactions.slice(-this.maxInteractions);
      }

      // Update patterns in real-time
      await this.updatePatterns(learningData, interaction);
      
      // Update preferences
      await this.updatePreferences(learningData, interaction);
      
      // Update performance metrics
      await this.updatePerformanceMetrics(learningData, interaction);
      
      // Save learning data
      this.learningData.set(sessionId, learningData);
      
      // Cache patterns for quick access
      this.patternCache.set(sessionId, learningData.patterns);
      
      // Track learning analytics
      await analyticsService.trackEvent({
        type: 'performance',
        category: 'real_time_learning',
        action: 'interaction_learned',
        userId,
        sessionId,
        metadata: {
          interactionId: interaction.id,
          responseTime,
          userSatisfaction: interaction.userSatisfaction,
          patternCount: learningData.patterns.commonQuestions.length,
          learningRate: learningData.performance.learningRate,
        },
        success: true,
        duration: responseTime,
      });

    } catch (error) {
      console.error('Real-time learning error:', error);
    }
  }

  /**
   * Get personalized response based on learning
   */
  async getPersonalizedResponse(
    sessionId: string,
    query: string,
    baseResponse: string
  ): Promise<string> {
    const learningData = this.learningData.get(sessionId);
    if (!learningData) {
      return baseResponse;
    }

    try {
      // Apply personalization based on learned patterns
      const personalizedResponse = await this.applyPersonalization(
        query,
        baseResponse,
        learningData
      );

      return personalizedResponse;
    } catch (error) {
      console.error('Personalization error:', error);
      return baseResponse;
    }
  }

  /**
   * Predict user needs based on learning
   */
  async predictUserNeeds(sessionId: string): Promise<{
    likelyQuestions: string[];
    suggestedTopics: string[];
    responseStyle: string;
    detailLevel: string;
    context: any;
  }> {
    const learningData = this.learningData.get(sessionId);
    if (!learningData) {
      return {
        likelyQuestions: [],
        suggestedTopics: [],
        responseStyle: 'friendly',
        detailLevel: 'moderate',
        context: {},
      };
    }

    try {
      // Analyze recent patterns
      const recentInteractions = learningData.interactions.slice(-10);
      const patterns = learningData.patterns;
      const preferences = learningData.preferences;

      // Predict likely questions
      const likelyQuestions = this.predictLikelyQuestions(patterns, recentInteractions);
      
      // Suggest topics
      const suggestedTopics = this.suggestTopics(patterns, preferences);
      
      // Determine response style
      const responseStyle = this.determineResponseStyle(preferences, patterns);
      
      // Determine detail level
      const detailLevel = this.determineDetailLevel(preferences, patterns);

      return {
        likelyQuestions,
        suggestedTopics,
        responseStyle,
        detailLevel,
        context: {
          patterns,
          preferences,
          performance: learningData.performance,
        },
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return {
        likelyQuestions: [],
        suggestedTopics: [],
        responseStyle: 'friendly',
        detailLevel: 'moderate',
        context: {},
      };
    }
  }

  /**
   * Get learning insights
   */
  async getLearningInsights(sessionId: string): Promise<{
    totalInteractions: number;
    averageSatisfaction: number;
    topTopics: string[];
    responseStyle: string;
    learningProgress: number;
    recommendations: string[];
  }> {
    const learningData = this.learningData.get(sessionId);
    if (!learningData) {
      return {
        totalInteractions: 0,
        averageSatisfaction: 0,
        topTopics: [],
        responseStyle: 'friendly',
        learningProgress: 0,
        recommendations: [],
      };
    }

    const totalInteractions = learningData.interactions.length;
    const averageSatisfaction = learningData.interactions.reduce(
      (sum, i) => sum + i.userSatisfaction, 0
    ) / totalInteractions;
    
    const topTopics = learningData.patterns.preferredTopics.slice(0, 5);
    const responseStyle = learningData.preferences.responseStyle;
    const learningProgress = this.calculateLearningProgress(learningData);
    const recommendations = this.generateRecommendations(learningData);

    return {
      totalInteractions,
      averageSatisfaction,
      topTopics,
      responseStyle,
      learningProgress,
      recommendations,
    };
  }

  /**
   * Initialize learning data for new session
   */
  private async initializeLearningData(sessionId: string, userId: string): Promise<LearningData> {
    // Get existing session data
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        chats: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    const learningData: LearningData = {
      sessionId,
      userId,
      interactions: [],
      patterns: {
        commonQuestions: [],
        preferredTopics: [],
        questionTypes: [],
        responseStyles: [],
        timePatterns: {
          activeHours: [],
          averageSessionLength: 0,
          frequency: 0,
        },
        languagePatterns: {
          primaryLanguage: 'ne',
          codeSwitching: false,
          formality: 'casual',
        },
      },
      preferences: {
        responseStyle: 'friendly',
        detailLevel: 'moderate',
        examples: true,
        explanations: true,
        predictions: true,
        humor: false,
        culturalContext: true,
      },
      performance: {
        averageResponseTime: 2000,
        userSatisfaction: 0.8,
        responseAccuracy: 0.8,
        contextRetention: 0.8,
        predictionAccuracy: 0.8,
        learningRate: 0.1,
      },
      lastUpdated: new Date(),
    };

    // Initialize with existing chat data
    if (session?.chats) {
      for (const chat of session.chats) {
        if (chat.role === 'user') {
          await this.updatePatterns(learningData, {
            id: chat.id,
            query: chat.content,
            response: '',
            responseTime: 0,
            userSatisfaction: 0.8,
            timestamp: chat.createdAt,
            context: {},
            metadata: {},
          });
        }
      }
    }

    return learningData;
  }

  /**
   * Update user patterns
   */
  private async updatePatterns(learningData: LearningData, interaction: Interaction): Promise<void> {
    const { query, response, timestamp } = interaction;
    
    // Extract topics
    const topics = this.extractTopics(query);
    learningData.patterns.preferredTopics = [
      ...new Set([...learningData.patterns.preferredTopics, ...topics])
    ].slice(0, 20);

    // Extract question types
    const questionTypes = this.extractQuestionTypes(query);
    learningData.patterns.questionTypes = [
      ...new Set([...learningData.patterns.questionTypes, ...questionTypes])
    ].slice(0, 10);

    // Update common questions
    if (!learningData.patterns.commonQuestions.includes(query)) {
      learningData.patterns.commonQuestions.push(query);
      if (learningData.patterns.commonQuestions.length > 20) {
        learningData.patterns.commonQuestions = learningData.patterns.commonQuestions.slice(-20);
      }
    }

    // Update time patterns
    const hour = timestamp.getHours();
    if (!learningData.patterns.timePatterns.activeHours.includes(hour)) {
      learningData.patterns.timePatterns.activeHours.push(hour);
    }

    // Update language patterns
    this.updateLanguagePatterns(learningData, query);
  }

  /**
   * Update user preferences
   */
  private async updatePreferences(learningData: LearningData, interaction: Interaction): Promise<void> {
    const { query, response, userSatisfaction } = interaction;
    
    // Adjust response style based on satisfaction
    if (userSatisfaction > 0.8) {
      // User liked this response style
      learningData.preferences.responseStyle = this.detectResponseStyle(response);
    }

    // Adjust detail level based on query length
    if (query.length > 100) {
      learningData.preferences.detailLevel = 'detailed';
    } else if (query.length > 50) {
      learningData.preferences.detailLevel = 'moderate';
    } else {
      learningData.preferences.detailLevel = 'brief';
    }

    // Adjust based on response preferences
    if (response.includes('उदाहरण') || response.includes('example')) {
      learningData.preferences.examples = true;
    }
    
    if (response.includes('व्याख्या') || response.includes('explanation')) {
      learningData.preferences.explanations = true;
    }
  }

  /**
   * Update performance metrics
   */
  private async updatePerformanceMetrics(learningData: LearningData, interaction: Interaction): Promise<void> {
    const { responseTime, userSatisfaction } = interaction;
    
    // Update average response time
    const totalTime = learningData.performance.averageResponseTime * (learningData.interactions.length - 1);
    learningData.performance.averageResponseTime = (totalTime + responseTime) / learningData.interactions.length;
    
    // Update user satisfaction
    const totalSatisfaction = learningData.performance.userSatisfaction * (learningData.interactions.length - 1);
    learningData.performance.userSatisfaction = (totalSatisfaction + userSatisfaction) / learningData.interactions.length;
    
    // Update learning rate
    learningData.performance.learningRate = Math.min(0.5, learningData.performance.learningRate + 0.01);
  }

  /**
   * Apply personalization to response
   */
  private async applyPersonalization(
    query: string,
    baseResponse: string,
    learningData: LearningData
  ): Promise<string> {
    let personalizedResponse = baseResponse;
    
    // Apply response style
    personalizedResponse = this.applyResponseStyle(personalizedResponse, learningData.preferences.responseStyle);
    
    // Apply detail level
    personalizedResponse = this.applyDetailLevel(personalizedResponse, learningData.preferences.detailLevel);
    
    // Add examples if preferred
    if (learningData.preferences.examples) {
      personalizedResponse = this.addExamples(personalizedResponse, query);
    }
    
    // Add explanations if preferred
    if (learningData.preferences.explanations) {
      personalizedResponse = this.addExplanations(personalizedResponse, query);
    }
    
    // Add cultural context if preferred
    if (learningData.preferences.culturalContext) {
      personalizedResponse = this.addCulturalContext(personalizedResponse, query);
    }
    
    return personalizedResponse;
  }

  /**
   * Calculate user satisfaction
   */
  private calculateUserSatisfaction(query: string, response: string, responseTime: number): number {
    let satisfaction = 0.8; // Base satisfaction
    
    // Adjust based on response length vs query length
    const responseQueryRatio = response.length / query.length;
    if (responseQueryRatio > 2) {
      satisfaction += 0.1; // Good detailed response
    } else if (responseQueryRatio < 0.5) {
      satisfaction -= 0.2; // Too brief
    }
    
    // Adjust based on response time
    if (responseTime < 1000) {
      satisfaction += 0.1; // Fast response
    } else if (responseTime > 5000) {
      satisfaction -= 0.1; // Slow response
    }
    
    // Adjust based on response quality indicators
    if (response.includes('धन्यवाद') || response.includes('thank you')) {
      satisfaction += 0.1;
    }
    
    if (response.includes('माफ गर्नुहोस्') || response.includes('sorry')) {
      satisfaction -= 0.1;
    }
    
    return Math.max(0, Math.min(1, satisfaction));
  }

  /**
   * Extract topics from text
   */
  private extractTopics(text: string): string[] {
    const topics = new Set<string>();
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('दशा') || lowerText.includes('dasha')) topics.add('dasha');
    if (lowerText.includes('योग') || lowerText.includes('yoga')) topics.add('yoga');
    if (lowerText.includes('ग्रह') || lowerText.includes('planet')) topics.add('planets');
    if (lowerText.includes('राशि') || lowerText.includes('sign')) topics.add('signs');
    if (lowerText.includes('घर') || lowerText.includes('house')) topics.add('houses');
    if (lowerText.includes('पञ्चाङ्ग') || lowerText.includes('panchang')) topics.add('panchang');
    if (lowerText.includes('पेसा') || lowerText.includes('money')) topics.add('finance');
    if (lowerText.includes('व्यवसाय') || lowerText.includes('business')) topics.add('business');
    if (lowerText.includes('सम्बन्ध') || lowerText.includes('relationship')) topics.add('relationships');
    if (lowerText.includes('स्वास्थ्य') || lowerText.includes('health')) topics.add('health');
    
    return Array.from(topics);
  }

  /**
   * Extract question types
   */
  private extractQuestionTypes(text: string): string[] {
    const types = new Set<string>();
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('कहिले') || lowerText.includes('when')) types.add('timing');
    if (lowerText.includes('कसरी') || lowerText.includes('how')) types.add('method');
    if (lowerText.includes('किन') || lowerText.includes('why')) types.add('reason');
    if (lowerText.includes('के') || lowerText.includes('what')) types.add('information');
    if (lowerText.includes('कहाँ') || lowerText.includes('where')) types.add('location');
    
    return Array.from(types);
  }

  /**
   * Update language patterns
   */
  private updateLanguagePatterns(learningData: LearningData, query: string): void {
    // Detect language
    const hasNepali = /[\u0900-\u097F]/.test(query);
    const hasHindi = /[\u0900-\u097F]/.test(query);
    const hasEnglish = /[a-zA-Z]/.test(query);
    
    if (hasNepali) {
      learningData.patterns.languagePatterns.primaryLanguage = 'ne';
    } else if (hasHindi) {
      learningData.patterns.languagePatterns.primaryLanguage = 'hi';
    } else if (hasEnglish) {
      learningData.patterns.languagePatterns.primaryLanguage = 'en';
    }
    
    // Detect code switching
    if ((hasNepali || hasHindi) && hasEnglish) {
      learningData.patterns.languagePatterns.codeSwitching = true;
    }
    
    // Detect formality
    if (query.includes('तपाईं') || query.includes('आप')) {
      learningData.patterns.languagePatterns.formality = 'formal';
    } else if (query.includes('तिमी') || query.includes('तू')) {
      learningData.patterns.languagePatterns.formality = 'casual';
    }
  }

  /**
   * Detect response style
   */
  private detectResponseStyle(response: string): 'friendly' | 'professional' | 'mystical' | 'analytical' {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('प्रिय') || lowerResponse.includes('dear')) {
      return 'friendly';
    } else if (lowerResponse.includes('विश्लेषण') || lowerResponse.includes('analysis')) {
      return 'analytical';
    } else if (lowerResponse.includes('रहस्य') || lowerResponse.includes('mystical')) {
      return 'mystical';
    } else {
      return 'professional';
    }
  }

  /**
   * Apply response style
   */
  private applyResponseStyle(response: string, style: string): string {
    switch (style) {
      case 'friendly':
        return response.replace(/^/, '🙏 ');
      case 'professional':
        return response;
      case 'mystical':
        return response.replace(/^/, '🔮 ');
      case 'analytical':
        return response.replace(/^/, '📊 ');
      default:
        return response;
    }
  }

  /**
   * Apply detail level
   */
  private applyDetailLevel(response: string, level: string): string {
    switch (level) {
      case 'brief':
        return response.split('\n')[0];
      case 'detailed':
        return response + '\n\n📝 अझ धेरै जानकारी चाहिएमा सोध्नुहोस्।';
      default:
        return response;
    }
  }

  /**
   * Add examples
   */
  private addExamples(response: string, query: string): string {
    if (query.includes('दशा') || query.includes('dasha')) {
      return response + '\n\nउदाहरण: "मेरो वर्तमान दशा के हो?"';
    }
    return response;
  }

  /**
   * Add explanations
   */
  private addExplanations(response: string, query: string): string {
    if (query.includes('योग') || query.includes('yoga')) {
      return response + '\n\nव्याख्या: योगहरू ग्रहहरूको विशेष स्थितिहरू हुन् जुन जीवनमा विशेष प्रभाव राख्छन्।';
    }
    return response;
  }

  /**
   * Add cultural context
   */
  private addCulturalContext(response: string, query: string): string {
    if (query.includes('पञ्चाङ्ग') || query.includes('panchang')) {
      return response + '\n\nसांस्कृतिक संदर्भ: पञ्चाङ्ग हाम्रो संस्कृतिमा महत्वपूर्ण भूमिका खेल्छ।';
    }
    return response;
  }

  /**
   * Predict likely questions
   */
  private predictLikelyQuestions(patterns: UserPatterns, recentInteractions: Interaction[]): string[] {
    const questions = [...patterns.commonQuestions];
    
    // Add questions based on recent topics
    patterns.preferredTopics.forEach(topic => {
      if (topic === 'dasha') {
        questions.push('मेरो वर्तमान दशा के हो?');
      } else if (topic === 'yoga') {
        questions.push('मेरो जन्मकुण्डलीमा के के योगहरू छन्?');
      }
    });
    
    return [...new Set(questions)].slice(0, 5);
  }

  /**
   * Suggest topics
   */
  private suggestTopics(patterns: UserPatterns, preferences: UserPreferences): string[] {
    return patterns.preferredTopics.slice(0, 5);
  }

  /**
   * Determine response style
   */
  private determineResponseStyle(preferences: UserPreferences, patterns: UserPatterns): string {
    return preferences.responseStyle;
  }

  /**
   * Determine detail level
   */
  private determineDetailLevel(preferences: UserPreferences, patterns: UserPatterns): string {
    return preferences.detailLevel;
  }

  /**
   * Calculate learning progress
   */
  private calculateLearningProgress(learningData: LearningData): number {
    const interactions = learningData.interactions.length;
    const satisfaction = learningData.performance.userSatisfaction;
    const learningRate = learningData.performance.learningRate;
    
    return Math.min(100, (interactions * 10 + satisfaction * 50 + learningRate * 100) / 3);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(learningData: LearningData): string[] {
    const recommendations = [];
    
    if (learningData.performance.userSatisfaction < 0.7) {
      recommendations.push('Response quality can be improved');
    }
    
    if (learningData.performance.averageResponseTime > 3000) {
      recommendations.push('Response time can be optimized');
    }
    
    if (learningData.patterns.preferredTopics.length < 3) {
      recommendations.push('Explore more astrological topics');
    }
    
    return recommendations;
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): any {
    return {
      totalSessions: this.learningData.size,
      totalInteractions: Array.from(this.learningData.values())
        .reduce((sum, data) => sum + data.interactions.length, 0),
      averageSatisfaction: Array.from(this.learningData.values())
        .reduce((sum, data) => sum + data.performance.userSatisfaction, 0) / this.learningData.size,
      cacheSize: this.patternCache.size,
    };
  }

  /**
   * Clear learning data
   */
  clearLearningData(): void {
    this.learningData.clear();
    this.patternCache.clear();
  }
}

export const realTimeLearningSystem = new RealTimeLearningSystem();




