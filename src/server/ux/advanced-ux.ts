import { analyticsService } from '@/server/services/analytics';

interface UserPreference {
  userId: string;
  category: string;
  key: string;
  value: any;
  updatedAt: Date;
}

interface UserJourney {
  id: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  steps: JourneyStep[];
  completed: boolean;
  conversionValue?: number;
}

interface JourneyStep {
  id: string;
  action: string;
  page: string;
  timestamp: Date;
  duration?: number;
  metadata: any;
}

interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata: any;
}

interface UXMetric {
  name: string;
  value: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata: any;
}

class AdvancedUXService {
  private preferences: Map<string, UserPreference>;
  private journeys: Map<string, UserJourney>;
  private notifications: Map<string, Notification>;
  private metrics: Map<string, UXMetric>;

  constructor() {
    this.preferences = new Map();
    this.journeys = new Map();
    this.notifications = new Map();
    this.metrics = new Map();
  }

  async setUserPreference(
    userId: string,
    category: string,
    key: string,
    value: any
  ): Promise<void> {
    try {
      const preference: UserPreference = {
        userId,
        category,
        key,
        value,
        updatedAt: new Date(),
      };

      this.preferences.set(`${userId}_${category}_${key}`, preference);

      await analyticsService.trackEvent({
        type: 'user_preference',
        category: 'ux',
        action: 'preference_set',
        userId,
        metadata: { category, key, value },
        success: true,
        duration: 0,
      });

    } catch (error) {
      console.error('User preference setting error:', error);
    }
  }

  async getUserPreference(
    userId: string,
    category: string,
    key: string
  ): Promise<any> {
    const preference = this.preferences.get(`${userId}_${category}_${key}`);
    return preference ? preference.value : null;
  }

  async getUserPreferences(userId: string, category?: string): Promise<UserPreference[]> {
    const preferences = Array.from(this.preferences.values())
      .filter(p => p.userId === userId && (!category || p.category === category))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return preferences;
  }

  async startUserJourney(
    userId: string,
    sessionId: string,
    initialStep: Omit<JourneyStep, 'id' | 'timestamp'>
  ): Promise<UserJourney> {
    try {
      const journey: UserJourney = {
        id: `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        startTime: new Date(),
        steps: [{
          ...initialStep,
          id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        }],
        completed: false,
      };

      this.journeys.set(journey.id, journey);

      await analyticsService.trackEvent({
        type: 'user_journey',
        category: 'ux',
        action: 'journey_started',
        userId,
        sessionId,
        metadata: { journeyId: journey.id, initialStep: initialStep.action },
        success: true,
        duration: 0,
      });

      return journey;

    } catch (error) {
      console.error('User journey start error:', error);
      throw error;
    }
  }

  async addJourneyStep(
    journeyId: string,
    step: Omit<JourneyStep, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const journey = this.journeys.get(journeyId);
      if (!journey) {
        throw new Error('Journey not found');
      }

      const journeyStep: JourneyStep = {
        ...step,
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      journey.steps.push(journeyStep);

      await analyticsService.trackEvent({
        type: 'user_journey',
        category: 'ux',
        action: 'step_added',
        userId: journey.userId,
        sessionId: journey.sessionId,
        metadata: { journeyId, step: journeyStep.action },
        success: true,
        duration: 0,
      });

    } catch (error) {
      console.error('Journey step addition error:', error);
    }
  }

  async completeUserJourney(
    journeyId: string,
    conversionValue?: number
  ): Promise<void> {
    try {
      const journey = this.journeys.get(journeyId);
      if (!journey) {
        throw new Error('Journey not found');
      }

      journey.endTime = new Date();
      journey.completed = true;
      if (conversionValue !== undefined) {
        journey.conversionValue = conversionValue;
      }

      await analyticsService.trackEvent({
        type: 'user_journey',
        category: 'ux',
        action: 'journey_completed',
        userId: journey.userId,
        sessionId: journey.sessionId,
        metadata: { 
          journeyId, 
          conversionValue,
          duration: journey.endTime.getTime() - journey.startTime.getTime(),
          stepsCount: journey.steps.length,
        },
        success: true,
        duration: 0,
      });

    } catch (error) {
      console.error('Journey completion error:', error);
    }
  }

  async getUserJourneys(userId: string, limit: number = 20): Promise<UserJourney[]> {
    return Array.from(this.journeys.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    expiresAt?: Date,
    metadata: any = {}
  ): Promise<Notification> {
    try {
      const notification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: new Date(),
        expiresAt,
        metadata,
      };

      this.notifications.set(notification.id, notification);

      await analyticsService.trackEvent({
        type: 'notification',
        category: 'ux',
        action: 'notification_created',
        userId,
        metadata: { notificationId: notification.id, type, title },
        success: true,
        duration: 0,
      });

      return notification;

    } catch (error) {
      console.error('Notification creation error:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.read = true;

      await analyticsService.trackEvent({
        type: 'notification',
        category: 'ux',
        action: 'notification_read',
        userId: notification.userId,
        metadata: { notificationId, type: notification.type },
        success: true,
        duration: 0,
      });

    } catch (error) {
      console.error('Notification read error:', error);
    }
  }

  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50
  ): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    return notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async recordUXMetric(
    name: string,
    value: number,
    userId?: string,
    sessionId?: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      const metric: UXMetric = {
        name,
        value,
        timestamp: new Date(),
        userId,
        sessionId,
        metadata,
      };

      this.metrics.set(`${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, metric);

      await analyticsService.trackEvent({
        type: 'ux_metric',
        category: 'ux',
        action: 'metric_recorded',
        userId,
        sessionId,
        metadata: { name, value, ...metadata },
        success: true,
        duration: 0,
      });

    } catch (error) {
      console.error('UX metric recording error:', error);
    }
  }

  async getUXMetrics(
    name?: string,
    userId?: string,
    limit: number = 100
  ): Promise<UXMetric[]> {
    let metrics = Array.from(this.metrics.values());

    if (name) {
      metrics = metrics.filter(m => m.name === name);
    }

    if (userId) {
      metrics = metrics.filter(m => m.userId === userId);
    }

    return metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getUXStatistics(): Promise<any> {
    const journeys = Array.from(this.journeys.values());
    const notifications = Array.from(this.notifications.values());
    const metrics = Array.from(this.metrics.values());

    const completedJourneys = journeys.filter(j => j.completed);
    const averageJourneyDuration = completedJourneys.length > 0
      ? completedJourneys.reduce((sum, j) => {
          const duration = j.endTime ? j.endTime.getTime() - j.startTime.getTime() : 0;
          return sum + duration;
        }, 0) / completedJourneys.length
      : 0;

    const unreadNotifications = notifications.filter(n => !n.read).length;
    const totalNotifications = notifications.length;

    const metricStats = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
      }
      acc[metric.name].count++;
      acc[metric.name].sum += metric.value;
      acc[metric.name].min = Math.min(acc[metric.name].min, metric.value);
      acc[metric.name].max = Math.max(acc[metric.name].max, metric.value);
      return acc;
    }, {} as Record<string, { count: number; sum: number; min: number; max: number }>);

    Object.keys(metricStats).forEach(name => {
      const stats = metricStats[name];
      stats.average = stats.sum / stats.count;
    });

    return {
      totalJourneys: journeys.length,
      completedJourneys: completedJourneys.length,
      averageJourneyDuration: Math.round(averageJourneyDuration),
      totalNotifications,
      unreadNotifications,
      totalMetrics: metrics.length,
      metricStats,
      recentJourneys: journeys.slice(-10),
      recentNotifications: notifications.slice(-10),
    };
  }

  cleanup(): void {
    this.preferences.clear();
    this.journeys.clear();
    this.notifications.clear();
    this.metrics.clear();
  }
}

export const advancedUXService = new AdvancedUXService();