import OpenAI from 'openai';
import { z } from 'zod';
import { prisma } from '@/server/lib/prisma';
import { analyticsService } from './analytics';

export interface AIInsight {
  id: string;
  type: 'prediction' | 'analysis' | 'recommendation' | 'warning' | 'opportunity';
  category: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  actionable: boolean;
  actions?: string[];
  expiresAt?: Date;
  createdAt: Date;
}

export interface AIPrediction {
  id: string;
  type: 'dasha' | 'transit' | 'yoga' | 'general' | 'health' | 'career' | 'relationship';
  title: string;
  description: string;
  timeframe: {
    start: Date;
    end: Date;
    duration: string;
  };
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  factors: string[];
  recommendations: string[];
  warnings?: string[];
  data: any;
}

export interface AIPersonalization {
  userId: string;
  preferences: {
    language: string;
    complexity: 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
    notifications: {
      dashaUpdates: boolean;
      transitAlerts: boolean;
      yogaNotifications: boolean;
      generalInsights: boolean;
    };
  };
  behavior: {
    mostViewedCharts: string[];
    favoriteYogas: string[];
    activeTime: string;
    sessionDuration: number;
    engagementLevel: 'low' | 'medium' | 'high';
  };
  insights: AIInsight[];
  predictions: AIPrediction[];
  lastUpdated: Date;
}

export interface AIConfig {
  enablePredictions: boolean;
  enablePersonalization: boolean;
  enableInsights: boolean;
  enableRecommendations: boolean;
  enableWarnings: boolean;
  maxInsightsPerUser: number;
  predictionHorizon: number; // days
  confidenceThreshold: number; // 0-100
  updateInterval: number; // milliseconds
}

const AIInsightSchema = z.object({
  id: z.string(),
  type: z.enum(['prediction', 'analysis', 'recommendation', 'warning', 'opportunity']),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(100),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  data: z.any(),
  actionable: z.boolean(),
  actions: z.array(z.string()).optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
});

const AIPredictionSchema = z.object({
  id: z.string(),
  type: z.enum(['dasha', 'transit', 'yoga', 'general', 'health', 'career', 'relationship']),
  title: z.string(),
  description: z.string(),
  timeframe: z.object({
    start: z.date(),
    end: z.date(),
    duration: z.string(),
  }),
  probability: z.number().min(0).max(100),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(100),
  factors: z.array(z.string()),
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
  data: z.any(),
});

class AIIntegrationService {
  private openai: OpenAI | null = null;
  private config: AIConfig;
  private isInitialized = false;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      enablePredictions: config.enablePredictions !== false,
      enablePersonalization: config.enablePersonalization !== false,
      enableInsights: config.enableInsights !== false,
      enableRecommendations: config.enableRecommendations !== false,
      enableWarnings: config.enableWarnings !== false,
      maxInsightsPerUser: config.maxInsightsPerUser || 10,
      predictionHorizon: config.predictionHorizon || 90, // 90 days
      confidenceThreshold: config.confidenceThreshold || 70,
      updateInterval: config.updateInterval || 3600000, // 1 hour
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.isInitialized = true;
        console.log('AI Integration Service initialized');
      } else {
        console.warn('OpenAI API key not found, AI features disabled');
      }
    } catch (error) {
      console.error('Error initializing AI service:', error);
    }
  }

  /**
   * Generate AI insights for a user
   */
  async generateInsights(
    userId: string,
    horoscopeData: any,
    userBehavior?: any
  ): Promise<AIInsight[]> {
    if (!this.isInitialized || !this.openai) {
      return [];
    }

    try {
      const prompt = this.buildInsightPrompt(horoscopeData, userBehavior);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Vedic astrologer and AI assistant. Provide insightful, accurate, and helpful astrological analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const insights = this.parseInsightsResponse(response.choices[0].message.content || '');
      
      // Store insights in database
      await this.storeInsights(userId, insights);
      
      // Track analytics
      await analyticsService.trackEvent({
        type: 'business',
        category: 'ai',
        action: 'insights_generated',
        userId,
        metadata: { insightCount: insights.length },
        success: true,
      });

      return insights;

    } catch (error) {
      console.error('Error generating AI insights:', error);
      await analyticsService.trackError(error as Error, 'ai_insights_generation', userId);
      return [];
    }
  }

  /**
   * Generate AI predictions
   */
  async generatePredictions(
    userId: string,
    horoscopeData: any,
    timeframe: { start: Date; end: Date }
  ): Promise<AIPrediction[]> {
    if (!this.isInitialized || !this.openai || !this.config.enablePredictions) {
      return [];
    }

    try {
      const prompt = this.buildPredictionPrompt(horoscopeData, timeframe);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Vedic astrologer specializing in predictions. Provide accurate, detailed predictions based on astrological principles.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 3000,
        temperature: 0.6,
      });

      const predictions = this.parsePredictionsResponse(response.choices[0].message.content || '');
      
      // Store predictions in database
      await this.storePredictions(userId, predictions);
      
      // Track analytics
      await analyticsService.trackEvent({
        type: 'business',
        category: 'ai',
        action: 'predictions_generated',
        userId,
        metadata: { predictionCount: predictions.length },
        success: true,
      });

      return predictions;

    } catch (error) {
      console.error('Error generating AI predictions:', error);
      await analyticsService.trackError(error as Error, 'ai_predictions_generation', userId);
      return [];
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(
    userId: string,
    horoscopeData: any,
    userPreferences?: any
  ): Promise<string[]> {
    if (!this.isInitialized || !this.openai || !this.config.enableRecommendations) {
      return [];
    }

    try {
      const prompt = this.buildRecommendationPrompt(horoscopeData, userPreferences);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a personal Vedic astrology advisor. Provide personalized, actionable recommendations based on the user\'s horoscope and preferences.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.8,
      });

      const recommendations = this.parseRecommendationsResponse(response.choices[0].message.content || '');
      
      // Track analytics
      await analyticsService.trackEvent({
        type: 'business',
        category: 'ai',
        action: 'recommendations_generated',
        userId,
        metadata: { recommendationCount: recommendations.length },
        success: true,
      });

      return recommendations;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      await analyticsService.trackError(error as Error, 'ai_recommendations_generation', userId);
      return [];
    }
  }

  /**
   * Get user personalization profile
   */
  async getPersonalizationProfile(userId: string): Promise<AIPersonalization | null> {
    try {
      // Get user data from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          sessions: {
            include: {
              result: true,
              chats: true,
            },
          },
        },
      });

      if (!user) return null;

      // Analyze user behavior
      const behavior = this.analyzeUserBehavior(user.sessions);
      
      // Get recent insights and predictions
      const insights = await this.getUserInsights(userId);
      const predictions = await this.getUserPredictions(userId);

      return {
        userId,
        preferences: {
          language: 'ne', // Default to Nepali
          complexity: 'intermediate',
          interests: this.extractInterests(user.sessions),
          notifications: {
            dashaUpdates: true,
            transitAlerts: true,
            yogaNotifications: true,
            generalInsights: true,
          },
        },
        behavior,
        insights,
        predictions,
        lastUpdated: new Date(),
      };

    } catch (error) {
      console.error('Error getting personalization profile:', error);
      return null;
    }
  }

  /**
   * Update user personalization
   */
  async updatePersonalization(
    userId: string,
    updates: Partial<AIPersonalization>
  ): Promise<void> {
    try {
      // This would update user preferences in database
      // For now, just log the update
      console.log('Updating personalization for user:', userId, updates);
      
      // Track analytics
      await analyticsService.trackEvent({
        type: 'user_action',
        category: 'personalization',
        action: 'profile_updated',
        userId,
        metadata: { updates },
        success: true,
      });

    } catch (error) {
      console.error('Error updating personalization:', error);
      await analyticsService.trackError(error as Error, 'ai_personalization_update', userId);
    }
  }

  /**
   * Get AI health status
   */
  async getHealthStatus(): Promise<{ status: string; capabilities: string[] }> {
    const capabilities: string[] = [];
    
    if (this.isInitialized && this.openai) {
      capabilities.push('insights', 'predictions', 'recommendations');
    }
    
    if (this.config.enablePersonalization) {
      capabilities.push('personalization');
    }
    
    if (this.config.enableWarnings) {
      capabilities.push('warnings');
    }

    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      capabilities,
    };
  }

  // Private helper methods
  private buildInsightPrompt(horoscopeData: any, userBehavior?: any): string {
    return `
Analyze the following Vedic astrology data and provide 3-5 key insights:

Horoscope Data:
- Ascendant: ${horoscopeData.kundli?.ascendant?.signName || 'Unknown'}
- Moon Sign: ${horoscopeData.kundli?.moonSign?.signName || 'Unknown'}
- Sun Sign: ${horoscopeData.kundli?.sunSign?.signName || 'Unknown'}
- Current Dasha: ${horoscopeData.dashas?.currentPeriod?.vimshottari || 'Unknown'}
- Key Yogas: ${horoscopeData.kundli?.yogas?.map((y: any) => y.yogaName).join(', ') || 'None'}

User Behavior: ${userBehavior ? JSON.stringify(userBehavior) : 'Not available'}

Please provide insights in the following format:
1. Type: [prediction/analysis/recommendation/warning/opportunity]
2. Category: [relevant category]
3. Title: [brief title]
4. Description: [detailed description]
5. Confidence: [0-100]
6. Priority: [low/medium/high/critical]
7. Actionable: [true/false]
8. Actions: [list of actions if actionable]
`;
  }

  private buildPredictionPrompt(horoscopeData: any, timeframe: { start: Date; end: Date }): string {
    return `
Based on the Vedic astrology data, provide predictions for the timeframe ${timeframe.start.toISOString()} to ${timeframe.end.toISOString()}:

Horoscope Data:
- Ascendant: ${horoscopeData.kundli?.ascendant?.signName || 'Unknown'}
- Moon Sign: ${horoscopeData.kundli?.moonSign?.signName || 'Unknown'}
- Current Dasha: ${horoscopeData.dashas?.currentPeriod?.vimshottari || 'Unknown'}
- Planetary Positions: ${JSON.stringify(horoscopeData.kundli?.charts?.[0]?.positions || [])}

Please provide predictions in the following format:
1. Type: [dasha/transit/yoga/general/health/career/relationship]
2. Title: [prediction title]
3. Description: [detailed prediction]
4. Timeframe: [start date] to [end date]
5. Probability: [0-100]
6. Impact: [low/medium/high/critical]
7. Confidence: [0-100]
8. Factors: [list of astrological factors]
9. Recommendations: [list of recommendations]
10. Warnings: [list of warnings if any]
`;
  }

  private buildRecommendationPrompt(horoscopeData: any, userPreferences?: any): string {
    return `
Based on the Vedic astrology data and user preferences, provide personalized recommendations:

Horoscope Data:
- Ascendant: ${horoscopeData.kundli?.ascendant?.signName || 'Unknown'}
- Moon Sign: ${horoscopeData.kundli?.moonSign?.signName || 'Unknown'}
- Current Dasha: ${horoscopeData.dashas?.currentPeriod?.vimshottari || 'Unknown'}

User Preferences: ${userPreferences ? JSON.stringify(userPreferences) : 'Not specified'}

Please provide 5-10 personalized recommendations in a simple list format.
`;
  }

  private parseInsightsResponse(response: string): AIInsight[] {
    // Parse AI response and convert to AIInsight objects
    // This is a simplified parser - in production, use more robust parsing
    const insights: AIInsight[] = [];
    
    try {
      const lines = response.split('\n').filter(line => line.trim());
      let currentInsight: Partial<AIInsight> = {};
      
      for (const line of lines) {
        if (line.includes('Type:')) {
          if (currentInsight.id) {
            insights.push(currentInsight as AIInsight);
          }
          currentInsight = {
            id: crypto.randomUUID(),
            type: line.split(':')[1]?.trim() as any,
            createdAt: new Date(),
          };
        } else if (line.includes('Title:')) {
          currentInsight.title = line.split(':')[1]?.trim() || '';
        } else if (line.includes('Description:')) {
          currentInsight.description = line.split(':')[1]?.trim() || '';
        } else if (line.includes('Confidence:')) {
          currentInsight.confidence = parseInt(line.split(':')[1]?.trim() || '0');
        } else if (line.includes('Priority:')) {
          currentInsight.priority = line.split(':')[1]?.trim() as any;
        } else if (line.includes('Actionable:')) {
          currentInsight.actionable = line.split(':')[1]?.trim() === 'true';
        }
      }
      
      if (currentInsight.id) {
        insights.push(currentInsight as AIInsight);
      }
    } catch (error) {
      console.error('Error parsing insights response:', error);
    }
    
    return insights;
  }

  private parsePredictionsResponse(response: string): AIPrediction[] {
    // Parse AI response and convert to AIPrediction objects
    // This is a simplified parser - in production, use more robust parsing
    const predictions: AIPrediction[] = [];
    
    try {
      const lines = response.split('\n').filter(line => line.trim());
      let currentPrediction: Partial<AIPrediction> = {};
      
      for (const line of lines) {
        if (line.includes('Type:')) {
          if (currentPrediction.id) {
            predictions.push(currentPrediction as AIPrediction);
          }
          currentPrediction = {
            id: crypto.randomUUID(),
            type: line.split(':')[1]?.trim() as any,
          };
        } else if (line.includes('Title:')) {
          currentPrediction.title = line.split(':')[1]?.trim() || '';
        } else if (line.includes('Description:')) {
          currentPrediction.description = line.split(':')[1]?.trim() || '';
        } else if (line.includes('Probability:')) {
          currentPrediction.probability = parseInt(line.split(':')[1]?.trim() || '0');
        } else if (line.includes('Impact:')) {
          currentPrediction.impact = line.split(':')[1]?.trim() as any;
        } else if (line.includes('Confidence:')) {
          currentPrediction.confidence = parseInt(line.split(':')[1]?.trim() || '0');
        }
      }
      
      if (currentPrediction.id) {
        predictions.push(currentPrediction as AIPrediction);
      }
    } catch (error) {
      console.error('Error parsing predictions response:', error);
    }
    
    return predictions;
  }

  private parseRecommendationsResponse(response: string): string[] {
    // Parse AI response and extract recommendations
    const recommendations: string[] = [];
    
    try {
      const lines = response.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.match(/^\d+\./) || line.startsWith('-')) {
          recommendations.push(line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim());
        }
      }
    } catch (error) {
      console.error('Error parsing recommendations response:', error);
    }
    
    return recommendations;
  }

  private async storeInsights(userId: string, insights: AIInsight[]): Promise<void> {
    // Store insights in database
    // This would be implemented based on your database schema
    console.log('Storing insights for user:', userId, insights.length);
  }

  private async storePredictions(userId: string, predictions: AIPrediction[]): Promise<void> {
    // Store predictions in database
    // This would be implemented based on your database schema
    console.log('Storing predictions for user:', userId, predictions.length);
  }

  private async getUserInsights(userId: string): Promise<AIInsight[]> {
    // Get user insights from database
    // This would be implemented based on your database schema
    return [];
  }

  private async getUserPredictions(userId: string): Promise<AIPrediction[]> {
    // Get user predictions from database
    // This would be implemented based on your database schema
    return [];
  }

  private analyzeUserBehavior(sessions: any[]): any {
    // Analyze user behavior from sessions
    return {
      mostViewedCharts: [],
      favoriteYogas: [],
      activeTime: 'morning',
      sessionDuration: 0,
      engagementLevel: 'medium' as const,
    };
  }

  private extractInterests(sessions: any[]): string[] {
    // Extract user interests from sessions
    return ['astrology', 'predictions', 'yogas'];
  }
}

// Export singleton instance
export const aiIntegrationService = new AIIntegrationService();

// Export class for testing
export { AIIntegrationService };
