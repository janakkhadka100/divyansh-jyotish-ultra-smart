import { geocodingService as baseGeoService, GeocodingResult } from './geo';
import { cacheService } from './cache';
import crypto from 'crypto';

export interface PrivacySettings {
  anonymizeData: boolean;
  dataRetentionDays: number;
  allowAnalytics: boolean;
  allowCaching: boolean;
  encryptionKey?: string;
  gdprCompliant: boolean;
}

export interface AnonymizedGeocodingResult extends GeocodingResult {
  anonymized: boolean;
  dataHash: string;
  retentionDate: Date;
  privacyLevel: 'low' | 'medium' | 'high';
}

export interface DataAuditLog {
  id: string;
  action: 'geocode' | 'cache_hit' | 'cache_miss' | 'data_deleted' | 'access_denied';
  place: string;
  userId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  dataHash: string;
  privacyLevel: 'low' | 'medium' | 'high';
}

export interface PrivacyComplianceReport {
  totalRequests: number;
  anonymizedRequests: number;
  dataRetentionCompliance: number;
  gdprCompliance: number;
  auditLogs: DataAuditLog[];
  dataDeletionCount: number;
  lastAuditDate: Date;
}

class PrivacyGeocodingService {
  private privacySettings: PrivacySettings;
  private auditLogs: DataAuditLog[] = [];
  private encryptionKey: string;

  constructor() {
    this.privacySettings = {
      anonymizeData: process.env.ANONYMIZE_DATA === 'true',
      dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '30'),
      allowAnalytics: process.env.ALLOW_ANALYTICS === 'true',
      allowCaching: process.env.ALLOW_CACHING !== 'false',
      gdprCompliant: process.env.GDPR_COMPLIANT === 'true',
    };
    
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async geocode(
    place: string,
    options: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      privacyLevel?: 'low' | 'medium' | 'high';
      provider?: 'osm' | 'google';
    } = {}
  ): Promise<AnonymizedGeocodingResult> {
    const {
      userId,
      ipAddress,
      userAgent,
      privacyLevel = 'medium',
      provider = 'osm'
    } = options;

    // Log the request
    this.logAuditEvent({
      action: 'geocode',
      place,
      userId,
      ipAddress,
      userAgent,
      privacyLevel,
    });

    // Get base geocoding result
    const baseResult = await baseGeoService.geocode(place, { provider });

    // Anonymize data if required
    const anonymizedResult = this.privacySettings.anonymizeData
      ? this.anonymizeGeocodingResult(baseResult, privacyLevel)
      : baseResult;

    // Generate data hash for tracking
    const dataHash = this.generateDataHash(anonymizedResult);

    // Calculate retention date
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + this.privacySettings.dataRetentionDays);

    const result: AnonymizedGeocodingResult = {
      ...anonymizedResult,
      anonymized: this.privacySettings.anonymizeData,
      dataHash,
      retentionDate,
      privacyLevel,
    };

    // Cache with privacy settings
    if (this.privacySettings.allowCaching) {
      const cacheKey = this.generatePrivacyCacheKey(place, dataHash);
      await cacheService.set(cacheKey, result, { 
        ttl: this.privacySettings.dataRetentionDays * 24 * 60 * 60 
      });
    }

    return result;
  }

  private anonymizeGeocodingResult(
    result: GeocodingResult,
    privacyLevel: 'low' | 'medium' | 'high'
  ): GeocodingResult {
    const anonymized = { ...result };

    switch (privacyLevel) {
      case 'high':
        // High privacy: Round coordinates to city level
        anonymized.lat = Math.round(anonymized.lat * 100) / 100;
        anonymized.lon = Math.round(anonymized.lon * 100) / 100;
        anonymized.city = this.anonymizeCityName(anonymized.city);
        anonymized.displayName = this.anonymizeDisplayName(anonymized.displayName);
        break;
      
      case 'medium':
        // Medium privacy: Round coordinates to neighborhood level
        anonymized.lat = Math.round(anonymized.lat * 1000) / 1000;
        anonymized.lon = Math.round(anonymized.lon * 1000) / 1000;
        break;
      
      case 'low':
        // Low privacy: Keep original data
        break;
    }

    return anonymized;
  }

  private anonymizeCityName(city: string): string {
    if (!city) return city;
    
    // Replace with generic city name or hash
    const hash = crypto.createHash('md5').update(city).digest('hex').substring(0, 8);
    return `City_${hash}`;
  }

  private anonymizeDisplayName(displayName: string): string {
    if (!displayName) return displayName;
    
    // Replace with generic location name
    const parts = displayName.split(',');
    if (parts.length > 1) {
      return `Location_${parts[parts.length - 1].trim()}`;
    }
    return `Location_${crypto.createHash('md5').update(displayName).digest('hex').substring(0, 8)}`;
  }

  private generateDataHash(data: GeocodingResult): string {
    const dataString = JSON.stringify({
      lat: data.lat,
      lon: data.lon,
      city: data.city,
      country: data.country,
    });
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  private generatePrivacyCacheKey(place: string, dataHash: string): string {
    const hash = crypto.createHash('md5').update(`${place}:${dataHash}`).digest('hex');
    return `privacy:geocoding:${hash}`;
  }

  private logAuditEvent(event: Omit<DataAuditLog, 'id' | 'timestamp' | 'dataHash'>): void {
    const auditLog: DataAuditLog = {
      id: crypto.randomUUID(),
      ...event,
      timestamp: new Date(),
      dataHash: crypto.createHash('md5').update(event.place).digest('hex'),
    };

    this.auditLogs.push(auditLog);

    // Keep only last 1000 audit logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  async deleteUserData(userId: string): Promise<number> {
    let deletedCount = 0;

    // Delete cached data for user
    if (this.privacySettings.allowCaching) {
      // This would require implementing user-specific cache keys
      // For now, we'll log the deletion request
      this.logAuditEvent({
        action: 'data_deleted',
        place: `user:${userId}`,
        userId,
        privacyLevel: 'high',
      });
      deletedCount++;
    }

    // Delete audit logs for user
    const userLogs = this.auditLogs.filter(log => log.userId === userId);
    this.auditLogs = this.auditLogs.filter(log => log.userId !== userId);
    deletedCount += userLogs.length;

    return deletedCount;
  }

  async deleteExpiredData(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    // Delete expired audit logs
    const expiredLogs = this.auditLogs.filter(log => {
      const expirationDate = new Date(log.timestamp);
      expirationDate.setDate(expirationDate.getDate() + this.privacySettings.dataRetentionDays);
      return now > expirationDate;
    });

    this.auditLogs = this.auditLogs.filter(log => {
      const expirationDate = new Date(log.timestamp);
      expirationDate.setDate(expirationDate.getDate() + this.privacySettings.dataRetentionDays);
      return now <= expirationDate;
    });

    deletedCount += expiredLogs.length;

    // Clear expired cache entries
    if (this.privacySettings.allowCaching) {
      await cacheService.clear('privacy:geocoding');
    }

    return deletedCount;
  }

  async getPrivacyComplianceReport(): Promise<PrivacyComplianceReport> {
    const totalRequests = this.auditLogs.filter(log => log.action === 'geocode').length;
    const anonymizedRequests = this.auditLogs.filter(log => 
      log.action === 'geocode' && log.privacyLevel === 'high'
    ).length;
    
    const dataRetentionCompliance = this.calculateRetentionCompliance();
    const gdprCompliance = this.calculateGDPRCompliance();
    
    const dataDeletionCount = this.auditLogs.filter(log => log.action === 'data_deleted').length;

    return {
      totalRequests,
      anonymizedRequests,
      dataRetentionCompliance,
      gdprCompliance,
      auditLogs: this.auditLogs.slice(-100), // Last 100 logs
      dataDeletionCount,
      lastAuditDate: new Date(),
    };
  }

  private calculateRetentionCompliance(): number {
    const now = new Date();
    const totalLogs = this.auditLogs.length;
    
    if (totalLogs === 0) return 100;

    const expiredLogs = this.auditLogs.filter(log => {
      const expirationDate = new Date(log.timestamp);
      expirationDate.setDate(expirationDate.getDate() + this.privacySettings.dataRetentionDays);
      return now > expirationDate;
    }).length;

    return ((totalLogs - expiredLogs) / totalLogs) * 100;
  }

  private calculateGDPRCompliance(): number {
    if (!this.privacySettings.gdprCompliant) return 0;

    let complianceScore = 0;
    const totalChecks = 4;

    // Check if data anonymization is enabled
    if (this.privacySettings.anonymizeData) complianceScore++;

    // Check if data retention is configured
    if (this.privacySettings.dataRetentionDays > 0) complianceScore++;

    // Check if audit logging is enabled
    if (this.auditLogs.length > 0) complianceScore++;

    // Check if data deletion is possible
    if (this.privacySettings.allowCaching) complianceScore++;

    return (complianceScore / totalChecks) * 100;
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    this.privacySettings = { ...this.privacySettings, ...settings };
    
    // Log the settings change
    this.logAuditEvent({
      action: 'geocode',
      place: 'privacy_settings_updated',
      privacyLevel: 'high',
    });
  }

  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  async exportUserData(userId: string): Promise<{
    auditLogs: DataAuditLog[];
    privacySettings: PrivacySettings;
    exportDate: Date;
  }> {
    const userLogs = this.auditLogs.filter(log => log.userId === userId);
    
    return {
      auditLogs: userLogs,
      privacySettings: this.privacySettings,
      exportDate: new Date(),
    };
  }

  async encryptSensitiveData(data: string): Promise<string> {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Export singleton instance
export const privacyGeocodingService = new PrivacyGeocodingService();

// Export class for testing
export { PrivacyGeocodingService };
