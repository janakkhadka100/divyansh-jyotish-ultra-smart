import { analyticsService } from '@/server/services/analytics';

interface UserBehavior {
  userId: string;
  sessionId: string;
  timestamp: Date;
  action: string;
  category: string;
  metadata: any;
}

class AdvancedAnalyticsService {
  private behaviors: Map<string, UserBehavior>;

  constructor() {
    this.behaviors = new Map();
  }

  async trackUserBehavior(behavior: Omit<UserBehavior, 'timestamp'>): Promise<void> {
    try {
      const userBehavior: UserBehavior = {
        ...behavior,
        timestamp: new Date(),
      };

      this.behaviors.set(userBehavior.userId, userBehavior);

      await analyticsService.trackEvent({
        type: 'user_behavior',
        category: behavior.category,
        action: behavior.action,
        userId: behavior.userId,
        sessionId: behavior.sessionId,
        metadata: behavior.metadata,
        success: true,
        duration: 0,
      });

    } catch (error) {
      console.error('User behavior tracking error:', error);
    }
  }

  getAnalyticsStatistics(): any {
    const behaviors = Array.from(this.behaviors.values());
    
    return {
      totalBehaviors: behaviors.length,
      uniqueUsers: new Set(behaviors.map(b => b.userId)).size,
      averageBehaviorsPerUser: behaviors.length / Math.max(1, new Set(behaviors.map(b => b.userId)).size),
    };
  }

  getUserBehavior(userId: string, limit: number = 50): UserBehavior[] {
    return Array.from(this.behaviors.values())
      .filter(b => b.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  cleanup(): void {
    this.behaviors.clear();
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();