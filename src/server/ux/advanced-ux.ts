import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';

interface UserPreference {
  id: string;
  userId: string;
  category: 'ui' | 'notifications' | 'privacy' | 'accessibility' | 'personalization';
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

interface UserSession {
  id: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  pageViews: number;
  interactions: number;
  device: string;
  browser: string;
  os: string;
  location: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata: any;
}

interface UserJourney {
  id: string;
  userId: string;
  sessionId: string;
  steps: JourneyStep[];
  startTime: Date;
  endTime?: Date;
  duration: number;
  completed: boolean;
  conversion: boolean;
  value: number;
  metadata: any;
}

interface JourneyStep {
  id: string;
  step: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  metadata: any;
}

interface PersonalizationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AccessibilityFeature {
  id: string;
  name: string;
  type: 'visual' | 'auditory' | 'motor' | 'cognitive';
  description: string;
  enabled: boolean;
  settings: any;
}

interface NotificationPreference {
  id: string;
  userId: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  category: 'astrology' | 'system' | 'marketing' | 'security';
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  channels: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface UXMetrics {
  totalUsers: number;
  activeUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  userSatisfaction: number;
  accessibilityScore: number;
  personalizationScore: number;
  topPages: Array<{ page: string; views: number; duration: number }>;
  topFeatures: Array<{ feature: string; usage: number; satisfaction: number }>;
  userSegments: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
}

class AdvancedUXSystem {
  private userPreferences: Map<string, UserPreference>;
  private userSessions: Map<string, UserSession>;
  private userJourneys: Map<string, UserJourney>;
  private personalizationRules: Map<string, PersonalizationRule>;
  private accessibilityFeatures: Map<string, AccessibilityFeature>;
  private notificationPreferences: Map<string, NotificationPreference>;
  private uxMetrics: UXMetrics;

  constructor() {
    this.userPreferences = new Map();
    this.userSessions = new Map();
    this.userJourneys = new Map();
    this.personalizationRules = new Map();
    this.accessibilityFeatures = new Map();
    this.notificationPreferences = new Map();
    this.uxMetrics = this.initializeUXMetrics();
    
    this.initializeAccessibilityFeatures();
    this.initializePersonalizationRules();
    this.startUXMonitoring();
  }

  /**
   * Track user session
   */
  async trackUserSession(
    userId: string,
    sessionId: string,
    device: string,
    browser: string,
    os: string,
    location: string,
    referrer?: string,
    utmSource?: string,
    utmMedium?: string,
    utmCampaign?: string,
    metadata: any = {}
  ): Promise<UserSession> {
    try {
      const session: UserSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        startTime: new Date(),
        duration: 0,
        pageViews: 0,
        interactions: 0,
        device,
        browser,
        os,
        location,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        metadata,
      };

      this.userSessions.set(session.id, session);

      // Track session start
      await analyticsService.trackEvent({
        type: 'user',
        category: 'session',
        action: 'session_start',
        metadata: {
          sessionId: session.id,
          userId,
          device,
          browser,
          os,
          location,
        },
        success: true,
        duration: 0,
      });

      return session;
    } catch (error) {
      console.error('User session tracking error:', error);
      throw error;
    }
  }

  /**
   * Update user session
   */
  async updateUserSession(
    sessionId: string,
    updates: Partial<UserSession>
  ): Promise<UserSession | null> {
    try {
      const session = this.userSessions.get(sessionId);
      if (!session) return null;

      const updatedSession = {
        ...session,
        ...updates,
        updatedAt: new Date(),
      };

      this.userSessions.set(sessionId, updatedSession);

      // Track session update
      await analyticsService.trackEvent({
        type: 'user',
        category: 'session',
        action: 'session_update',
        metadata: {
          sessionId,
          updates,
        },
        success: true,
        duration: 0,
      });

      return updatedSession;
    } catch (error) {
      console.error('User session update error:', error);
      throw error;
    }
  }

  /**
   * End user session
   */
  async endUserSession(sessionId: string): Promise<UserSession | null> {
    try {
      const session = this.userSessions.get(sessionId);
      if (!session) return null;

      const endTime = new Date();
      const duration = endTime.getTime() - session.startTime.getTime();

      const updatedSession = {
        ...session,
        endTime,
        duration,
      };

      this.userSessions.set(sessionId, updatedSession);

      // Track session end
      await analyticsService.trackEvent({
        type: 'user',
        category: 'session',
        action: 'session_end',
        metadata: {
          sessionId,
          duration,
          pageViews: session.pageViews,
          interactions: session.interactions,
        },
        success: true,
        duration,
      });

      return updatedSession;
    } catch (error) {
      console.error('User session end error:', error);
      throw error;
    }
  }

  /**
   * Track user journey
   */
  async trackUserJourney(
    userId: string,
    sessionId: string,
    step: string,
    success: boolean = true,
    metadata: any = {}
  ): Promise<UserJourney> {
    try {
      const journeyId = `journey_${userId}_${sessionId}`;
      let journey = this.userJourneys.get(journeyId);

      if (!journey) {
        journey = {
          id: journeyId,
          userId,
          sessionId,
          steps: [],
          startTime: new Date(),
          duration: 0,
          completed: false,
          conversion: false,
          value: 0,
          metadata: {},
        };
      }

      const journeyStep: JourneyStep = {
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        step,
        timestamp: new Date(),
        duration: 0,
        success,
        metadata,
      };

      journey.steps.push(journeyStep);
      journey.duration = new Date().getTime() - journey.startTime.getTime();

      this.userJourneys.set(journeyId, journey);

      // Track journey step
      await analyticsService.trackEvent({
        type: 'user',
        category: 'journey',
        action: 'journey_step',
        metadata: {
          journeyId,
          step,
          success,
          stepCount: journey.steps.length,
        },
        success,
        duration: 0,
      });

      return journey;
    } catch (error) {
      console.error('User journey tracking error:', error);
      throw error;
    }
  }

  /**
   * Complete user journey
   */
  async completeUserJourney(
    journeyId: string,
    conversion: boolean = false,
    value: number = 0
  ): Promise<UserJourney | null> {
    try {
      const journey = this.userJourneys.get(journeyId);
      if (!journey) return null;

      const endTime = new Date();
      const duration = endTime.getTime() - journey.startTime.getTime();

      const updatedJourney = {
        ...journey,
        endTime,
        duration,
        completed: true,
        conversion,
        value,
      };

      this.userJourneys.set(journeyId, updatedJourney);

      // Track journey completion
      await analyticsService.trackEvent({
        type: 'user',
        category: 'journey',
        action: 'journey_complete',
        metadata: {
          journeyId,
          duration,
          stepCount: journey.steps.length,
          conversion,
          value,
        },
        success: true,
        duration,
      });

      return updatedJourney;
    } catch (error) {
      console.error('User journey completion error:', error);
      throw error;
    }
  }

  /**
   * Set user preference
   */
  async setUserPreference(
    userId: string,
    category: UserPreference['category'],
    key: string,
    value: any
  ): Promise<UserPreference> {
    try {
      const preferenceId = `pref_${userId}_${category}_${key}`;
      
      const preference: UserPreference = {
        id: preferenceId,
        userId,
        category,
        key,
        value,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.userPreferences.set(preferenceId, preference);

      // Track preference change
      await analyticsService.trackEvent({
        type: 'user',
        category: 'preference',
        action: 'preference_set',
        metadata: {
          userId,
          category,
          key,
          value,
        },
        success: true,
        duration: 0,
      });

      return preference;
    } catch (error) {
      console.error('User preference setting error:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(
    userId: string,
    category?: UserPreference['category']
  ): Promise<UserPreference[]> {
    try {
      let preferences = Array.from(this.userPreferences.values())
        .filter(pref => pref.userId === userId);

      if (category) {
        preferences = preferences.filter(pref => pref.category === category);
      }

      return preferences;
    } catch (error) {
      console.error('User preferences retrieval error:', error);
      return [];
    }
  }

  /**
   * Personalize content
   */
  async personalizeContent(
    userId: string,
    contentType: string,
    defaultContent: any
  ): Promise<any> {
    try {
      const preferences = await this.getUserPreferences(userId, 'personalization');
      const rules = Array.from(this.personalizationRules.values())
        .filter(rule => rule.enabled)
        .sort((a, b) => b.priority - a.priority);

      let personalizedContent = { ...defaultContent };

      for (const rule of rules) {
        if (this.evaluatePersonalizationRule(rule, preferences, contentType)) {
          personalizedContent = this.applyPersonalizationAction(rule, personalizedContent);
        }
      }

      // Track personalization
      await analyticsService.trackEvent({
        type: 'user',
        category: 'personalization',
        action: 'content_personalized',
        metadata: {
          userId,
          contentType,
          rulesApplied: rules.length,
        },
        success: true,
        duration: 0,
      });

      return personalizedContent;
    } catch (error) {
      console.error('Content personalization error:', error);
      return defaultContent;
    }
  }

  /**
   * Set accessibility feature
   */
  async setAccessibilityFeature(
    userId: string,
    featureName: string,
    enabled: boolean,
    settings: any = {}
  ): Promise<void> {
    try {
      const feature = this.accessibilityFeatures.get(featureName);
      if (!feature) return;

      await this.setUserPreference(
        userId,
        'accessibility',
        featureName,
        { enabled, settings }
      );

      // Track accessibility change
      await analyticsService.trackEvent({
        type: 'user',
        category: 'accessibility',
        action: 'feature_toggled',
        metadata: {
          userId,
          feature: featureName,
          enabled,
        },
        success: true,
        duration: 0,
      });
    } catch (error) {
      console.error('Accessibility feature setting error:', error);
    }
  }

  /**
   * Get accessibility features
   */
  async getAccessibilityFeatures(userId: string): Promise<AccessibilityFeature[]> {
    try {
      const preferences = await this.getUserPreferences(userId, 'accessibility');
      const features = Array.from(this.accessibilityFeatures.values());

      return features.map(feature => {
        const preference = preferences.find(p => p.key === feature.name);
        return {
          ...feature,
          enabled: preference?.value?.enabled || false,
          settings: preference?.value?.settings || feature.settings,
        };
      });
    } catch (error) {
      console.error('Accessibility features retrieval error:', error);
      return [];
    }
  }

  /**
   * Set notification preference
   */
  async setNotificationPreference(
    userId: string,
    type: NotificationPreference['type'],
    category: NotificationPreference['category'],
    enabled: boolean,
    frequency: NotificationPreference['frequency'] = 'daily',
    channels: string[] = []
  ): Promise<NotificationPreference> {
    try {
      const preferenceId = `notif_${userId}_${type}_${category}`;
      
      const preference: NotificationPreference = {
        id: preferenceId,
        userId,
        type,
        category,
        enabled,
        frequency,
        channels,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.notificationPreferences.set(preferenceId, preference);

      // Track notification preference change
      await analyticsService.trackEvent({
        type: 'user',
        category: 'notification',
        action: 'preference_set',
        metadata: {
          userId,
          type,
          category,
          enabled,
          frequency,
        },
        success: true,
        duration: 0,
      });

      return preference;
    } catch (error) {
      console.error('Notification preference setting error:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      return Array.from(this.notificationPreferences.values())
        .filter(pref => pref.userId === userId);
    } catch (error) {
      console.error('Notification preferences retrieval error:', error);
      return [];
    }
  }

  /**
   * Get UX metrics
   */
  getUXMetrics(): UXMetrics {
    return this.uxMetrics;
  }

  /**
   * Get user sessions
   */
  getUserSessions(limit: number = 100): UserSession[] {
    return Array.from(this.userSessions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get user journeys
   */
  getUserJourneys(limit: number = 100): UserJourney[] {
    return Array.from(this.userJourneys.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Evaluate personalization rule
   */
  private evaluatePersonalizationRule(
    rule: PersonalizationRule,
    preferences: UserPreference[],
    contentType: string
  ): boolean {
    try {
      const condition = rule.condition.toLowerCase();
      
      if (condition.includes('content_type') && condition.includes('==')) {
        const expectedType = condition.split('==')[1].trim().replace(/['"]/g, '');
        if (contentType !== expectedType) return false;
      }
      
      if (condition.includes('preference') && condition.includes('==')) {
        const [prefCategory, prefKey, prefValue] = condition.split('==')[1].trim().split('.');
        const preference = preferences.find(p => p.category === prefCategory && p.key === prefKey);
        if (!preference || preference.value !== prefValue) return false;
      }
      
      return true;
    } catch (error) {
      console.error('Personalization rule evaluation error:', error);
      return false;
    }
  }

  /**
   * Apply personalization action
   */
  private applyPersonalizationAction(rule: PersonalizationRule, content: any): any {
    try {
      const action = rule.action.toLowerCase();
      
      if (action.includes('theme')) {
        const theme = action.split('=')[1]?.trim().replace(/['"]/g, '');
        if (theme) content.theme = theme;
      }
      
      if (action.includes('language')) {
        const language = action.split('=')[1]?.trim().replace(/['"]/g, '');
        if (language) content.language = language;
      }
      
      if (action.includes('layout')) {
        const layout = action.split('=')[1]?.trim().replace(/['"]/g, '');
        if (layout) content.layout = layout;
      }
      
      return content;
    } catch (error) {
      console.error('Personalization action application error:', error);
      return content;
    }
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibilityFeatures(): void {
    const features = [
      {
        id: 'high_contrast',
        name: 'high_contrast',
        type: 'visual' as const,
        description: 'High contrast mode for better visibility',
        enabled: false,
        settings: { contrast: 'normal' },
      },
      {
        id: 'large_text',
        name: 'large_text',
        type: 'visual' as const,
        description: 'Large text for better readability',
        enabled: false,
        settings: { fontSize: 'normal' },
      },
      {
        id: 'screen_reader',
        name: 'screen_reader',
        type: 'visual' as const,
        description: 'Screen reader support',
        enabled: false,
        settings: { announce: true },
      },
      {
        id: 'keyboard_navigation',
        name: 'keyboard_navigation',
        type: 'motor' as const,
        description: 'Enhanced keyboard navigation',
        enabled: false,
        settings: { tabOrder: 'logical' },
      },
      {
        id: 'voice_commands',
        name: 'voice_commands',
        type: 'motor' as const,
        description: 'Voice command support',
        enabled: false,
        settings: { commands: [] },
      },
      {
        id: 'focus_indicators',
        name: 'focus_indicators',
        type: 'visual' as const,
        description: 'Enhanced focus indicators',
        enabled: false,
        settings: { style: 'outline' },
      },
    ];
    
    features.forEach(feature => {
      this.accessibilityFeatures.set(feature.id, feature);
    });
  }

  /**
   * Initialize personalization rules
   */
  private initializePersonalizationRules(): void {
    const rules = [
      {
        id: 'theme_preference',
        name: 'Theme Preference',
        condition: 'preference.ui.theme == "dark"',
        action: 'theme=dark',
        priority: 10,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'language_preference',
        name: 'Language Preference',
        condition: 'preference.ui.language == "ne"',
        action: 'language=nepali',
        priority: 9,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'layout_preference',
        name: 'Layout Preference',
        condition: 'preference.ui.layout == "compact"',
        action: 'layout=compact',
        priority: 8,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    rules.forEach(rule => {
      this.personalizationRules.set(rule.id, rule);
    });
  }

  /**
   * Start UX monitoring
   */
  private startUXMonitoring(): void {
    setInterval(() => {
      this.updateUXMetrics();
    }, 60000); // Update every minute
  }

  /**
   * Update UX metrics
   */
  private updateUXMetrics(): void {
    const totalUsers = new Set(Array.from(this.userSessions.values()).map(s => s.userId)).size;
    const activeUsers = Array.from(this.userSessions.values())
      .filter(s => s.endTime && (new Date().getTime() - s.endTime.getTime()) < 300000).length; // Last 5 minutes
    
    const averageSessionDuration = Array.from(this.userSessions.values())
      .filter(s => s.duration > 0)
      .reduce((sum, s) => sum + s.duration, 0) / Math.max(1, this.userSessions.size);
    
    const completedJourneys = Array.from(this.userJourneys.values()).filter(j => j.completed).length;
    const totalJourneys = this.userJourneys.size;
    const conversionRate = totalJourneys > 0 ? completedJourneys / totalJourneys : 0;
    
    const topPages = this.calculateTopPages();
    const topFeatures = this.calculateTopFeatures();
    const userSegments = this.calculateUserSegments();
    const deviceBreakdown = this.calculateDeviceBreakdown();
    const browserBreakdown = this.calculateBrowserBreakdown();
    const osBreakdown = this.calculateOSBreakdown();
    
    this.uxMetrics = {
      totalUsers,
      activeUsers,
      averageSessionDuration,
      bounceRate: this.calculateBounceRate(),
      conversionRate,
      userSatisfaction: this.calculateUserSatisfaction(),
      accessibilityScore: this.calculateAccessibilityScore(),
      personalizationScore: this.calculatePersonalizationScore(),
      topPages,
      topFeatures,
      userSegments,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
    };
  }

  /**
   * Calculate top pages
   */
  private calculateTopPages(): Array<{ page: string; views: number; duration: number }> {
    const pageStats = new Map<string, { views: number; duration: number }>();
    
    Array.from(this.userSessions.values()).forEach(session => {
      const page = session.metadata.page || 'unknown';
      const stats = pageStats.get(page) || { views: 0, duration: 0 };
      stats.views++;
      stats.duration += session.duration;
      pageStats.set(page, stats);
    });
    
    return Array.from(pageStats.entries())
      .map(([page, stats]) => ({ page, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  /**
   * Calculate top features
   */
  private calculateTopFeatures(): Array<{ feature: string; usage: number; satisfaction: number }> {
    const featureStats = new Map<string, { usage: number; satisfaction: number }>();
    
    Array.from(this.userJourneys.values()).forEach(journey => {
      journey.steps.forEach(step => {
        const feature = step.step;
        const stats = featureStats.get(feature) || { usage: 0, satisfaction: 0 };
        stats.usage++;
        if (step.success) stats.satisfaction++;
        featureStats.set(feature, stats);
      });
    });
    
    return Array.from(featureStats.entries())
      .map(([feature, stats]) => ({
        feature,
        usage: stats.usage,
        satisfaction: stats.usage > 0 ? stats.satisfaction / stats.usage : 0,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }

  /**
   * Calculate user segments
   */
  private calculateUserSegments(): Record<string, number> {
    const segments: Record<string, number> = {};
    
    Array.from(this.userSessions.values()).forEach(session => {
      const segment = this.determineUserSegment(session);
      segments[segment] = (segments[segment] || 0) + 1;
    });
    
    return segments;
  }

  /**
   * Determine user segment
   */
  private determineUserSegment(session: UserSession): string {
    if (session.duration < 60000) return 'bounce';
    if (session.duration < 300000) return 'quick';
    if (session.duration < 900000) return 'engaged';
    if (session.interactions > 10) return 'power';
    return 'regular';
  }

  /**
   * Calculate device breakdown
   */
  private calculateDeviceBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    Array.from(this.userSessions.values()).forEach(session => {
      breakdown[session.device] = (breakdown[session.device] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Calculate browser breakdown
   */
  private calculateBrowserBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    Array.from(this.userSessions.values()).forEach(session => {
      breakdown[session.browser] = (breakdown[session.browser] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Calculate OS breakdown
   */
  private calculateOSBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    Array.from(this.userSessions.values()).forEach(session => {
      breakdown[session.os] = (breakdown[session.os] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Calculate bounce rate
   */
  private calculateBounceRate(): number {
    const totalSessions = this.userSessions.size;
    if (totalSessions === 0) return 0;
    
    const bounceSessions = Array.from(this.userSessions.values())
      .filter(s => s.duration < 30000 || s.pageViews <= 1).length;
    
    return bounceSessions / totalSessions;
  }

  /**
   * Calculate user satisfaction
   */
  private calculateUserSatisfaction(): number {
    const totalSteps = Array.from(this.userJourneys.values())
      .reduce((sum, journey) => sum + journey.steps.length, 0);
    
    if (totalSteps === 0) return 0;
    
    const successfulSteps = Array.from(this.userJourneys.values())
      .reduce((sum, journey) => sum + journey.steps.filter(step => step.success).length, 0);
    
    return successfulSteps / totalSteps;
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(): number {
    const totalFeatures = this.accessibilityFeatures.size;
    if (totalFeatures === 0) return 0;
    
    const enabledFeatures = Array.from(this.userPreferences.values())
      .filter(p => p.category === 'accessibility' && p.value?.enabled).length;
    
    return (enabledFeatures / totalFeatures) * 100;
  }

  /**
   * Calculate personalization score
   */
  private calculatePersonalizationScore(): number {
    const totalUsers = new Set(Array.from(this.userSessions.values()).map(s => s.userId)).size;
    if (totalUsers === 0) return 0;
    
    const personalizedUsers = new Set(Array.from(this.userPreferences.values())
      .filter(p => p.category === 'personalization').map(p => p.userId)).size;
    
    return (personalizedUsers / totalUsers) * 100;
  }

  /**
   * Initialize UX metrics
   */
  private initializeUXMetrics(): UXMetrics {
    return {
      totalUsers: 0,
      activeUsers: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      conversionRate: 0,
      userSatisfaction: 0,
      accessibilityScore: 0,
      personalizationScore: 0,
      topPages: [],
      topFeatures: [],
      userSegments: {},
      deviceBreakdown: {},
      browserBreakdown: {},
      osBreakdown: {},
    };
  }
}

export const advancedUXSystem = new AdvancedUXSystem();
