import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prokeralaService, BirthData } from './prokerala';
import { advancedCacheService } from './advanced-cache';
import { prisma } from '@/server/lib/prisma';
import EventEmitter from 'events';

export interface RealtimeUpdate {
  id: string;
  type: 'dasha_update' | 'chart_update' | 'progress_update' | 'error_update';
  sessionId: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealtimeConfig {
  enableWebSocket: boolean;
  updateInterval: number; // milliseconds
  maxConnections: number;
  enableDashaUpdates: boolean;
  enableChartUpdates: boolean;
  enableProgressUpdates: boolean;
  enableErrorNotifications: boolean;
}

export interface ConnectionInfo {
  id: string;
  userId?: string;
  sessionId?: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: string[];
}

class RealtimeUpdateService extends EventEmitter {
  private io: SocketIOServer | null = null;
  private config: RealtimeConfig;
  private connections: Map<string, ConnectionInfo> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor(config: Partial<RealtimeConfig> = {}) {
    super();
    this.config = {
      enableWebSocket: config.enableWebSocket !== false,
      updateInterval: config.updateInterval || 30000, // 30 seconds
      maxConnections: config.maxConnections || 1000,
      enableDashaUpdates: config.enableDashaUpdates !== false,
      enableChartUpdates: config.enableChartUpdates !== false,
      enableProgressUpdates: config.enableProgressUpdates !== false,
      enableErrorNotifications: config.enableErrorNotifications !== false,
    };
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    if (!this.config.enableWebSocket || this.isInitialized) {
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      maxHttpBufferSize: 1e6, // 1MB
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    this.isInitialized = true;
    
    console.log('Realtime Update Service initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const connectionInfo: ConnectionInfo = {
        id: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date(),
        subscriptions: [],
      };

      this.connections.set(socket.id, connectionInfo);

      // Handle user authentication
      socket.on('authenticate', (data: { userId: string }) => {
        connectionInfo.userId = data.userId;
        this.connections.set(socket.id, connectionInfo);
        socket.emit('authenticated', { success: true });
      });

      // Handle session subscription
      socket.on('subscribe_session', (data: { sessionId: string }) => {
        connectionInfo.sessionId = data.sessionId;
        connectionInfo.subscriptions.push(data.sessionId);
        this.connections.set(socket.id, connectionInfo);
        
        // Start real-time updates for this session
        this.startSessionUpdates(data.sessionId);
        
        socket.emit('subscribed', { sessionId: data.sessionId });
      });

      // Handle session unsubscription
      socket.on('unsubscribe_session', (data: { sessionId: string }) => {
        connectionInfo.subscriptions = connectionInfo.subscriptions.filter(
          id => id !== data.sessionId
        );
        this.connections.set(socket.id, connectionInfo);
        
        // Stop real-time updates if no one is subscribed
        this.stopSessionUpdates(data.sessionId);
        
        socket.emit('unsubscribed', { sessionId: data.sessionId });
      });

      // Handle custom subscriptions
      socket.on('subscribe_updates', (data: { types: string[] }) => {
        connectionInfo.subscriptions.push(...data.types);
        this.connections.set(socket.id, connectionInfo);
        socket.emit('subscribed_updates', { types: data.types });
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        connectionInfo.lastActivity = new Date();
        this.connections.set(socket.id, connectionInfo);
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connections.delete(socket.id);
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Start real-time updates for a session
   */
  private startSessionUpdates(sessionId: string): void {
    if (this.updateIntervals.has(sessionId)) {
      return; // Already running
    }

    const interval = setInterval(async () => {
      try {
        await this.updateSessionData(sessionId);
      } catch (error) {
        console.error(`Error updating session ${sessionId}:`, error);
        this.broadcastUpdate({
          id: crypto.randomUUID(),
          type: 'error_update',
          sessionId,
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          priority: 'high',
        });
      }
    }, this.config.updateInterval);

    this.updateIntervals.set(sessionId, interval);
  }

  /**
   * Stop real-time updates for a session
   */
  private stopSessionUpdates(sessionId: string): void {
    const interval = this.updateIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(sessionId);
    }
  }

  /**
   * Update session data
   */
  private async updateSessionData(sessionId: string): Promise<void> {
    try {
      // Get session from database
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          birth: true,
          result: true,
        },
      });

      if (!session || !session.birth) {
        return;
      }

      // Check if we have subscribers for this session
      const subscribers = Array.from(this.connections.values()).filter(
        conn => conn.subscriptions.includes(sessionId)
      );

      if (subscribers.length === 0) {
        return;
      }

      // Get current time for dasha calculations
      const now = new Date();
      const birthData: BirthData = {
        name: session.birth.name || 'Unknown',
        date: session.birth.date.toISOString().split('T')[0],
        time: session.birth.date.toISOString().split('T')[1].split('.')[0],
        latitude: session.birth.lat,
        longitude: session.birth.lon,
        timezone: session.birth.tzId,
        ayanamsa: 1,
      };

      // Get updated dasha information
      if (this.config.enableDashaUpdates) {
        const dashas = await prokeralaService.getDashas(birthData);
        
        this.broadcastUpdate({
          id: crypto.randomUUID(),
          type: 'dasha_update',
          sessionId,
          data: {
            currentDasha: dashas.currentPeriod,
            vimshottari: dashas.vimshottari,
            antardasha: dashas.antardasha,
            pratyantardasha: dashas.pratyantardasha,
            sookshmaDasha: dashas.sookshmaDasha,
            yoginiDasha: dashas.yoginiDasha,
          },
          timestamp: now,
          priority: 'medium',
        });
      }

      // Get updated chart information
      if (this.config.enableChartUpdates) {
        const kundli = await prokeralaService.getKundli(birthData);
        
        this.broadcastUpdate({
          id: crypto.randomUUID(),
          type: 'chart_update',
          sessionId,
          data: {
            ascendant: kundli.ascendant,
            moonSign: kundli.moonSign,
            sunSign: kundli.sunSign,
            yogas: kundli.yogas,
            charts: kundli.charts,
          },
          timestamp: now,
          priority: 'low',
        });
      }

    } catch (error) {
      console.error(`Error updating session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Broadcast update to subscribers
   */
  private broadcastUpdate(update: RealtimeUpdate): void {
    if (!this.io) return;

    // Find subscribers for this session
    const subscribers = Array.from(this.connections.values()).filter(
      conn => conn.subscriptions.includes(update.sessionId)
    );

    if (subscribers.length === 0) {
      return;
    }

    // Send to all subscribers
    subscribers.forEach(subscriber => {
      const socket = this.io!.sockets.sockets.get(subscriber.id);
      if (socket) {
        socket.emit('realtime_update', update);
      }
    });

    // Emit event for other services
    this.emit('update_broadcasted', update);
  }

  /**
   * Send progress update
   */
  sendProgressUpdate(sessionId: string, progress: any): void {
    if (!this.config.enableProgressUpdates) return;

    this.broadcastUpdate({
      id: crypto.randomUUID(),
      type: 'progress_update',
      sessionId,
      data: progress,
      timestamp: new Date(),
      priority: 'medium',
    });
  }

  /**
   * Send error notification
   */
  sendErrorNotification(sessionId: string, error: any): void {
    if (!this.config.enableErrorNotifications) return;

    this.broadcastUpdate({
      id: crypto.randomUUID(),
      type: 'error_update',
      sessionId,
      data: { error },
      timestamp: new Date(),
      priority: 'critical',
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    totalSubscriptions: number;
    averageConnectionTime: number;
  } {
    const now = new Date();
    const connections = Array.from(this.connections.values());
    
    const totalConnections = connections.length;
    const activeConnections = connections.filter(
      conn => now.getTime() - conn.lastActivity.getTime() < 60000 // 1 minute
    ).length;
    
    const totalSubscriptions = connections.reduce(
      (sum, conn) => sum + conn.subscriptions.length,
      0
    );
    
    const averageConnectionTime = connections.length > 0
      ? connections.reduce(
          (sum, conn) => sum + (now.getTime() - conn.connectedAt.getTime()),
          0
        ) / connections.length / 1000 // Convert to seconds
      : 0;

    return {
      totalConnections,
      activeConnections,
      totalSubscriptions,
      averageConnectionTime,
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): string[] {
    const sessions = new Set<string>();
    Array.from(this.connections.values()).forEach(conn => {
      conn.subscriptions.forEach(sessionId => sessions.add(sessionId));
    });
    return Array.from(sessions);
  }

  /**
   * Force update for a specific session
   */
  async forceUpdate(sessionId: string): Promise<void> {
    await this.updateSessionData(sessionId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RealtimeConfig {
    return { ...this.config };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();

    // Disconnect all clients
    if (this.io) {
      this.io.disconnectSockets();
      this.io.close();
    }

    // Clear connections
    this.connections.clear();
    
    this.isInitialized = false;
    console.log('Realtime Update Service shutdown');
  }
}

// Export singleton instance
export const realtimeUpdateService = new RealtimeUpdateService();

// Export class for testing
export { RealtimeUpdateService };




