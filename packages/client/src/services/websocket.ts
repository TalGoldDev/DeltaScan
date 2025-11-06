import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@deltascan/shared';
import type { ArbitrageOpportunity } from '@deltascan/shared';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket?.emit(WS_EVENTS.SUBSCRIBE_MARKETS);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    // Set up event listeners
    this.socket.on(WS_EVENTS.ARBITRAGE_OPPORTUNITY, (data: ArbitrageOpportunity[]) => {
      this.emit(WS_EVENTS.ARBITRAGE_OPPORTUNITY, data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit(WS_EVENTS.UNSUBSCRIBE_MARKETS);
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}

export const wsService = new WebSocketService();
