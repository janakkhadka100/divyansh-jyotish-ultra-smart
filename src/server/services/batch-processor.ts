import { prokeralaService, BirthData } from './prokerala';
import { geocodingService } from './geocoding';
import { advancedCacheService } from './advanced-cache';
import { prisma } from '@/server/lib/prisma';
import { z } from 'zod';

export interface BatchRequest {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  lang: 'ne' | 'hi' | 'en';
  ayanamsa?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  tags?: string[];
}

export interface BatchResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  cached: boolean;
  sessionId?: string;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  percentage: number;
  estimatedTimeRemaining: number;
  currentBatch: string[];
}

export interface BatchConfig {
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  enableCaching: boolean;
  enableParallelProcessing: boolean;
  enableProgressTracking: boolean;
}

const BatchRequestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(1).max(200),
  lang: z.enum(['ne', 'hi', 'en']).default('ne'),
  ayanamsa: z.number().min(1).max(3).default(1),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  tags: z.array(z.string()).default([]),
});

class BatchProcessor {
  private config: BatchConfig;
  private activeBatches: Map<string, BatchProgress> = new Map();
  private processingQueue: BatchRequest[] = [];
  private isProcessing = false;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxConcurrency: config.maxConcurrency || 5,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      timeout: config.timeout || 30000,
      enableCaching: config.enableCaching !== false,
      enableParallelProcessing: config.enableParallelProcessing !== false,
      enableProgressTracking: config.enableProgressTracking !== false,
    };
  }

  /**
   * Process multiple horoscope requests in batch
   */
  async processBatch(
    requests: BatchRequest[],
    batchId: string = crypto.randomUUID()
  ): Promise<BatchResponse[]> {
    // Validate all requests
    const validatedRequests = requests.map(req => BatchRequestSchema.parse(req));
    
    // Initialize batch progress
    if (this.config.enableProgressTracking) {
      this.activeBatches.set(batchId, {
        total: validatedRequests.length,
        completed: 0,
        failed: 0,
        processing: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        currentBatch: [],
      });
    }

    // Sort by priority
    const sortedRequests = this.sortByPriority(validatedRequests);
    
    // Process in chunks based on concurrency
    const results: BatchResponse[] = [];
    const chunks = this.chunkArray(sortedRequests, this.config.maxConcurrency);
    
    for (const chunk of chunks) {
      const chunkResults = await this.processChunk(chunk, batchId);
      results.push(...chunkResults);
      
      // Update progress
      if (this.config.enableProgressTracking) {
        this.updateProgress(batchId, chunkResults);
      }
    }

    // Clean up batch tracking
    if (this.config.enableProgressTracking) {
      this.activeBatches.delete(batchId);
    }

    return results;
  }

  /**
   * Process a single horoscope request
   */
  async processSingle(request: BatchRequest): Promise<BatchResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = BatchRequestSchema.parse(request);
      
      // Check cache first
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(validatedRequest);
        const cached = await advancedCacheService.get(cacheKey, 'kundli');
        
        if (cached) {
          return {
            id: validatedRequest.id,
            success: true,
            data: cached,
            processingTime: Date.now() - startTime,
            cached: true,
          };
        }
      }

      // Geocode location
      const geoResult = await geocodingService.getCoordinates(validatedRequest.location);
      
      // Create birth data
      const birthData: BirthData = {
        name: validatedRequest.name,
        date: validatedRequest.date,
        time: validatedRequest.time,
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
        timezone: geoResult.timezone,
        ayanamsa: validatedRequest.ayanamsa || 1,
      };

      // Get horoscope data
      const horoscopeData = await prokeralaService.getCompleteHoroscope(birthData);
      
      // Create session in database
      const session = await prisma.session.create({
        data: {
          userId: 'batch-user',
          birth: {
            create: {
              name: validatedRequest.name,
              date: new Date(`${validatedRequest.date}T${validatedRequest.time}:00Z`),
              rawDate: validatedRequest.date,
              rawTime: validatedRequest.time,
              location: `${geoResult.city}, ${geoResult.country}`,
              lat: geoResult.latitude,
              lon: geoResult.longitude,
              tzId: geoResult.timezone,
              tzOffsetMinutes: new Date().getTimezoneOffset() * -1,
            },
          },
          result: {
            create: {
              provider: 'prokerala',
              payload: horoscopeData,
              summary: this.extractSummary(horoscopeData),
            },
          },
        },
      });

      // Cache the result
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(validatedRequest);
        await advancedCacheService.set(
          cacheKey,
          horoscopeData,
          'kundli',
          validatedRequest.tags || []
        );
      }

      return {
        id: validatedRequest.id,
        success: true,
        data: horoscopeData,
        processingTime: Date.now() - startTime,
        cached: false,
        sessionId: session.id,
      };

    } catch (error) {
      console.error(`Batch processing error for ${request.id}:`, error);
      
      return {
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        cached: false,
      };
    }
  }

  /**
   * Process chunk of requests with retry logic
   */
  private async processChunk(
    requests: BatchRequest[],
    batchId: string
  ): Promise<BatchResponse[]> {
    if (this.config.enableParallelProcessing) {
      return Promise.all(
        requests.map(request => this.processWithRetry(request, batchId))
      );
    } else {
      const results: BatchResponse[] = [];
      for (const request of requests) {
        const result = await this.processWithRetry(request, batchId);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Process single request with retry logic
   */
  private async processWithRetry(
    request: BatchRequest,
    batchId: string
  ): Promise<BatchResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Update progress
        if (this.config.enableProgressTracking) {
          this.updateProcessingStatus(batchId, request.id, true);
        }

        const result = await this.processSingle(request);
        
        // Update progress
        if (this.config.enableProgressTracking) {
          this.updateProcessingStatus(batchId, request.id, false);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          // Wait before retry
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    // All retries failed
    if (this.config.enableProgressTracking) {
      this.updateProcessingStatus(batchId, request.id, false);
    }

    return {
      id: request.id,
      success: false,
      error: lastError?.message || 'All retry attempts failed',
      processingTime: 0,
      cached: false,
    };
  }

  /**
   * Get batch progress
   */
  getBatchProgress(batchId: string): BatchProgress | null {
    return this.activeBatches.get(batchId) || null;
  }

  /**
   * Get all active batches
   */
  getActiveBatches(): Map<string, BatchProgress> {
    return new Map(this.activeBatches);
  }

  /**
   * Cancel batch processing
   */
  cancelBatch(batchId: string): boolean {
    return this.activeBatches.delete(batchId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): BatchConfig {
    return { ...this.config };
  }

  // Private helper methods
  private sortByPriority(requests: BatchRequest[]): BatchRequest[] {
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    return requests.sort((a, b) => 
      (priorityOrder[b.priority || 'normal'] - priorityOrder[a.priority || 'normal'])
    );
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private generateCacheKey(request: BatchRequest): string {
    const key = `${request.name}:${request.date}:${request.time}:${request.location}:${request.ayanamsa}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private extractSummary(horoscopeData: any): any {
    return {
      ascendant: horoscopeData.kundli?.ascendant,
      moonSign: horoscopeData.kundli?.moonSign,
      sunSign: horoscopeData.kundli?.sunSign,
      currentDasha: horoscopeData.dashas?.currentPeriod,
      keyYogas: horoscopeData.kundli?.yogas?.slice(0, 5),
      charts: horoscopeData.kundli?.charts?.map((chart: any) => ({
        type: chart.chartType,
        name: chart.chartName,
        planetCount: chart.positions?.length || 0,
      })),
    };
  }

  private updateProgress(batchId: string, results: BatchResponse[]): void {
    const progress = this.activeBatches.get(batchId);
    if (!progress) return;

    results.forEach(result => {
      if (result.success) {
        progress.completed++;
      } else {
        progress.failed++;
      }
    });

    progress.processing = progress.total - progress.completed - progress.failed;
    progress.percentage = (progress.completed / progress.total) * 100;
    
    // Estimate remaining time
    if (progress.completed > 0) {
      const averageTime = progress.completed > 0 ? 5000 : 0; // 5 seconds average
      progress.estimatedTimeRemaining = (progress.processing * averageTime) / 1000;
    }
  }

  private updateProcessingStatus(batchId: string, requestId: string, isProcessing: boolean): void {
    const progress = this.activeBatches.get(batchId);
    if (!progress) return;

    if (isProcessing) {
      progress.currentBatch.push(requestId);
    } else {
      progress.currentBatch = progress.currentBatch.filter(id => id !== requestId);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const batchProcessor = new BatchProcessor();

// Export class for testing
export { BatchProcessor };



