import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useQueueStore } from '../store/useQueueStore';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  sendMessage: (type: string, data?: any) => void;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { upsertTask } = useQueueStore();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isComponentMounted = useRef<boolean>(true);

  const connect = useCallback(() => {
    // If not authenticated or no window object, do not attempt
    if (typeof window === 'undefined') return;

    // Prevent duplicate active connections
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.CONNECTING ||
        socketRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const tokenQuery = encodeURIComponent(accessToken || 'nexusflow_jwt_access_token_mock_12345');
      const wsUrl = `${protocol}//${host}/ws?token=${tokenQuery}`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isComponentMounted.current) return;
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send auth handshake frame as backup
        ws.send(
          JSON.stringify({
            type: 'auth',
            token: accessToken || 'nexusflow_jwt_access_token_mock_12345',
            userId: user?.id || 'user-1',
          })
        );
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isComponentMounted.current) return;
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(parsed);

          // Route events to stores
          handleRealtimeEvent(parsed);
        } catch (err) {
          console.warn('[WebSocket Client] Received non-JSON payload:', event.data);
        }
      };

      ws.onerror = (errEvent) => {
        if (!isComponentMounted.current) return;
        setError('WebSocket error encountered');
      };

      ws.onclose = (closeEvent) => {
        if (!isComponentMounted.current) return;
        setIsConnected(false);
        socketRef.current = null;

        // Auto reconnect unless intentionally unauthorized (4001) or unmounted
        if (closeEvent.code !== 4001 && isAuthenticated) {
          scheduleReconnect();
        }
      };
    } catch (err: any) {
      setError(`Connection error: ${err.message}`);
      scheduleReconnect();
    }
  }, [accessToken, isAuthenticated, user?.id]);

  const scheduleReconnect = useCallback(() => {
    if (!isComponentMounted.current) return;
    setIsReconnecting(true);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const attempts = reconnectAttemptsRef.current + 1;
    reconnectAttemptsRef.current = attempts;

    // Exponential backoff: 1s, 2s, 4s, max 10s
    const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const handleRealtimeEvent = (msg: WebSocketMessage) => {
    const { type, data } = msg;

    // 1. Task events -> Update Task Store
    if (type.startsWith('task:')) {
      if (data?.taskId || data?.id) {
        upsertTask({
          id: data.taskId || data.id,
          status: data.status,
          progress: data.progress,
          failureReason: data.error || data.failureReason,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Map domain events -> Notifications
    if (type.includes('completed') || type.includes('due') || type.includes('ready') || type.includes('failed')) {
      addNotification({
        userId: data?.userId || user?.id || 'user-1',
        title: `Real-time Event: ${type}`,
        message: data?.message || data?.error || `Update received for ${type}`,
        type: type.includes('failed') ? 'SYSTEM_ALERT' : 'ANALYSIS_READY',
      });
    }
  };

  const sendMessage = useCallback((type: string, data: any = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    isComponentMounted.current = true;

    if (isAuthenticated) {
      connect();
    }

    return () => {
      isComponentMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, connect]);

  return {
    isConnected,
    isReconnecting,
    error,
    lastMessage,
    sendMessage,
    reconnect,
  };
}
