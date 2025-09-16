import { z } from 'zod';
import { advancedCacheService } from './advanced-cache';

export interface MobileDeviceInfo {
  userAgent: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  version: string;
  screenSize: {
    width: number;
    height: number;
    density: number;
  };
  capabilities: {
    touch: boolean;
    geolocation: boolean;
    camera: boolean;
    offline: boolean;
    pushNotifications: boolean;
  };
  network: {
    type: 'wifi' | 'cellular' | 'unknown';
    speed: 'slow' | 'medium' | 'fast';
    offline: boolean;
  };
}

export interface MobileOptimizationConfig {
  enableCompression: boolean;
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
  enableOfflineSupport: boolean;
  enablePushNotifications: boolean;
  maxImageSize: number;
  compressionLevel: number;
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
  offlineDataLimit: number;
}

export interface OptimizedResponse {
  data: any;
  metadata: {
    compressed: boolean;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    optimizedFor: string;
    cacheKey: string;
    expiresAt: Date;
  };
}

const MobileDeviceInfoSchema = z.object({
  userAgent: z.string(),
  platform: z.enum(['ios', 'android', 'web', 'unknown']),
  version: z.string(),
  screenSize: z.object({
    width: z.number(),
    height: z.number(),
    density: z.number(),
  }),
  capabilities: z.object({
    touch: z.boolean(),
    geolocation: z.boolean(),
    camera: z.boolean(),
    offline: z.boolean(),
    pushNotifications: z.boolean(),
  }),
  network: z.object({
    type: z.enum(['wifi', 'cellular', 'unknown']),
    speed: z.enum(['slow', 'medium', 'fast']),
    offline: z.boolean(),
  }),
});

class MobileOptimizationService {
  private config: MobileOptimizationConfig;
  private deviceCache: Map<string, MobileDeviceInfo> = new Map();

  constructor(config: Partial<MobileOptimizationConfig> = {}) {
    this.config = {
      enableCompression: config.enableCompression !== false,
      enableImageOptimization: config.enableImageOptimization !== false,
      enableLazyLoading: config.enableLazyLoading !== false,
      enableOfflineSupport: config.enableOfflineSupport !== false,
      enablePushNotifications: config.enablePushNotifications !== false,
      maxImageSize: config.maxImageSize || 1024 * 1024, // 1MB
      compressionLevel: config.compressionLevel || 6,
      cacheStrategy: config.cacheStrategy || 'moderate',
      offlineDataLimit: config.offlineDataLimit || 10 * 1024 * 1024, // 10MB
    };
  }

  /**
   * Detect mobile device information
   */
  detectDevice(userAgent: string, additionalInfo?: any): MobileDeviceInfo {
    const cacheKey = this.generateDeviceCacheKey(userAgent);
    
    if (this.deviceCache.has(cacheKey)) {
      return this.deviceCache.get(cacheKey)!;
    }

    const deviceInfo: MobileDeviceInfo = {
      userAgent,
      platform: this.detectPlatform(userAgent),
      version: this.detectVersion(userAgent),
      screenSize: this.detectScreenSize(additionalInfo),
      capabilities: this.detectCapabilities(userAgent, additionalInfo),
      network: this.detectNetwork(additionalInfo),
    };

    // Cache device info
    this.deviceCache.set(cacheKey, deviceInfo);

    return deviceInfo;
  }

  /**
   * Optimize response for mobile device
   */
  async optimizeResponse(
    data: any,
    deviceInfo: MobileDeviceInfo,
    responseType: 'kundli' | 'dashas' | 'panchang' | 'general' = 'general'
  ): Promise<OptimizedResponse> {
    const originalSize = this.calculateSize(data);
    let optimizedData = data;
    let compressed = false;
    let compressedSize = originalSize;

    // Apply mobile-specific optimizations
    if (this.config.enableCompression && deviceInfo.network.speed !== 'fast') {
      optimizedData = await this.compressData(data);
      compressed = true;
      compressedSize = this.calculateSize(optimizedData);
    }

    // Optimize images if present
    if (this.config.enableImageOptimization && this.hasImages(data)) {
      optimizedData = await this.optimizeImages(optimizedData, deviceInfo);
    }

    // Remove unnecessary data for mobile
    optimizedData = this.removeUnnecessaryData(optimizedData, deviceInfo, responseType);

    // Generate cache key
    const cacheKey = this.generateCacheKey(data, deviceInfo, responseType);

    // Calculate compression ratio
    const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

    return {
      data: optimizedData,
      metadata: {
        compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        optimizedFor: `${deviceInfo.platform}-${deviceInfo.network.speed}`,
        cacheKey,
        expiresAt: new Date(Date.now() + this.getCacheTTL(deviceInfo)),
      },
    };
  }

  /**
   * Get offline data for mobile device
   */
  async getOfflineData(
    userId: string,
    deviceInfo: MobileDeviceInfo
  ): Promise<any> {
    if (!this.config.enableOfflineSupport) {
      throw new Error('Offline support is disabled');
    }

    try {
      // Get cached data for offline use
      const cacheKey = `offline:${userId}:${deviceInfo.platform}`;
      const offlineData = await advancedCacheService.get(cacheKey, 'analytics');

      if (!offlineData) {
        return {
          message: 'No offline data available',
          lastSync: null,
          data: null,
        };
      }

      return {
        message: 'Offline data available',
        lastSync: new Date(),
        data: offlineData,
        size: this.calculateSize(offlineData),
        limit: this.config.offlineDataLimit,
      };

    } catch (error) {
      console.error('Error getting offline data:', error);
      throw error;
    }
  }

  /**
   * Sync offline data
   */
  async syncOfflineData(
    userId: string,
    deviceInfo: MobileDeviceInfo,
    data: any
  ): Promise<void> {
    if (!this.config.enableOfflineSupport) {
      return;
    }

    try {
      const cacheKey = `offline:${userId}:${deviceInfo.platform}`;
      const optimizedData = await this.optimizeResponse(data, deviceInfo, 'general');
      
      // Check size limit
      if (optimizedData.metadata.compressedSize > this.config.offlineDataLimit) {
        throw new Error('Data size exceeds offline limit');
      }

      await advancedCacheService.set(
        cacheKey,
        optimizedData.data,
        'analytics',
        ['offline', userId, deviceInfo.platform]
      );

    } catch (error) {
      console.error('Error syncing offline data:', error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: any = {},
    deviceInfo: MobileDeviceInfo
  ): Promise<boolean> {
    if (!this.config.enablePushNotifications) {
      return false;
    }

    try {
      // This would integrate with a push notification service
      // For now, just log the notification
      console.log('Push notification:', {
        userId,
        title,
        body,
        data,
        platform: deviceInfo.platform,
        capabilities: deviceInfo.capabilities,
      });

      return true;

    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Get mobile-specific configuration
   */
  getMobileConfig(deviceInfo: MobileDeviceInfo): any {
    return {
      compression: this.config.enableCompression,
      imageOptimization: this.config.enableImageOptimization,
      lazyLoading: this.config.enableLazyLoading,
      offlineSupport: this.config.enableOfflineSupport,
      pushNotifications: this.config.enablePushNotifications,
      maxImageSize: this.config.maxImageSize,
      cacheStrategy: this.config.cacheStrategy,
      offlineDataLimit: this.config.offlineDataLimit,
      deviceCapabilities: deviceInfo.capabilities,
      networkInfo: deviceInfo.network,
      screenSize: deviceInfo.screenSize,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MobileOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MobileOptimizationConfig {
    return { ...this.config };
  }

  // Private helper methods
  private detectPlatform(userAgent: string): 'ios' | 'android' | 'web' | 'unknown' {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
    if (/Android/.test(userAgent)) return 'android';
    if (/Mozilla/.test(userAgent)) return 'web';
    return 'unknown';
  }

  private detectVersion(userAgent: string): string {
    const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
    if (iosMatch) return `${iosMatch[1]}.${iosMatch[2]}`;
    
    const androidMatch = userAgent.match(/Android (\d+\.\d+)/);
    if (androidMatch) return androidMatch[1];
    
    return 'unknown';
  }

  private detectScreenSize(additionalInfo?: any): { width: number; height: number; density: number } {
    if (additionalInfo?.screenSize) {
      return additionalInfo.screenSize;
    }
    
    // Default screen sizes
    return {
      width: 375,
      height: 667,
      density: 2,
    };
  }

  private detectCapabilities(userAgent: string, additionalInfo?: any): any {
    return {
      touch: /Mobile|Android|iPhone|iPad/.test(userAgent),
      geolocation: additionalInfo?.geolocation || false,
      camera: additionalInfo?.camera || false,
      offline: additionalInfo?.offline || false,
      pushNotifications: additionalInfo?.pushNotifications || false,
    };
  }

  private detectNetwork(additionalInfo?: any): any {
    return {
      type: additionalInfo?.networkType || 'unknown',
      speed: additionalInfo?.networkSpeed || 'medium',
      offline: additionalInfo?.offline || false,
    };
  }

  private async compressData(data: any): Promise<any> {
    // Simple compression - in production, use proper compression
    const compressed = JSON.stringify(data);
    return JSON.parse(compressed);
  }

  private hasImages(data: any): boolean {
    const dataStr = JSON.stringify(data);
    return /\.(jpg|jpeg|png|gif|webp)/i.test(dataStr);
  }

  private async optimizeImages(data: any, deviceInfo: MobileDeviceInfo): Promise<any> {
    // This would integrate with image optimization service
    // For now, just return the data as-is
    return data;
  }

  private removeUnnecessaryData(data: any, deviceInfo: MobileDeviceInfo, responseType: string): any {
    // Remove unnecessary fields based on device capabilities and network speed
    if (deviceInfo.network.speed === 'slow') {
      // Remove detailed data for slow networks
      if (responseType === 'kundli' && data.charts) {
        data.charts = data.charts.map((chart: any) => ({
          ...chart,
          positions: chart.positions?.slice(0, 5), // Keep only first 5 positions
        }));
      }
    }

    if (!deviceInfo.capabilities.touch) {
      // Remove touch-specific data
      delete data.touchEvents;
    }

    return data;
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private generateDeviceCacheKey(userAgent: string): string {
    return crypto.createHash('md5').update(userAgent).digest('hex');
  }

  private generateCacheKey(data: any, deviceInfo: MobileDeviceInfo, responseType: string): string {
    const key = `${responseType}:${deviceInfo.platform}:${deviceInfo.network.speed}:${JSON.stringify(data)}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private getCacheTTL(deviceInfo: MobileDeviceInfo): number {
    // Different TTL based on device and network
    if (deviceInfo.network.speed === 'fast') return 3600000; // 1 hour
    if (deviceInfo.network.speed === 'medium') return 1800000; // 30 minutes
    return 900000; // 15 minutes
  }
}

// Export singleton instance
export const mobileOptimizationService = new MobileOptimizationService();

// Export class for testing
export { MobileOptimizationService };


