'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: 'new_order' | 'order_update' | 'order_delete' | 'notification' | 'ping' | 'pong' | 'pending_orders_count';
  data?: unknown;
  storeId?: string;
  userId?: string;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  storeId?: string;
  enabled?: boolean;
  onNewOrder?: (order: unknown) => void;
  onOrderUpdate?: (order: unknown) => void;
  onOrderDelete?: (orderId: string) => void;
  onPendingOrdersCount?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: WebSocketMessage) => void;
  subscribeToStore: (storeId: string) => void;
  unsubscribeFromStore: (storeId: string) => void;
}

export function useWebSocket({
  storeId,
  enabled = true,
  onNewOrder,
  onOrderUpdate,
  onOrderDelete,
  onPendingOrdersCount,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketOptions = {}): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL do servidor WebSocket
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

  // Função para conectar ao WebSocket
  const connect = useCallback(async () => {
    if (!enabled || socketRef.current?.connected) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Criar conexão Socket.IO
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socketRef.current = socket;

      // Eventos de conexão
      socket.on('connect', () => {
        console.log('🔌 WebSocket conectado');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        onConnect?.();

        // Inscrever na loja se fornecida
        if (storeId) {
          socket.emit('subscribe_store', storeId);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket desconectado:', reason);
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Erro de conexão WebSocket:', err);
        setError(`Erro de conexão: ${err.message}`);
        setIsConnecting(false);
        onError?.(err.message);
      });

      // Eventos de pedidos
      socket.on('new_order', (message: WebSocketMessage) => {
        console.log('🆕 Novo pedido via WebSocket:', message);
        onNewOrder?.(message.data);
      });

      socket.on('order_update', (message: WebSocketMessage) => {
        console.log('🔄 Pedido atualizado via WebSocket:', message);
        onOrderUpdate?.(message.data);
      });

      socket.on('order_delete', (message: WebSocketMessage) => {
        console.log('🗑️ Pedido deletado via WebSocket:', message);
        if (message.data && typeof message.data === 'object' && 'id' in message.data) {
          onOrderDelete?.(message.data.id as string);
        }
      });

      socket.on('pending_orders_count', (message: WebSocketMessage) => {
        console.log('📊 Contagem de pedidos pendentes via WebSocket:', message);
        if (message.data && typeof message.data === 'object' && 'count' in message.data) {
          onPendingOrdersCount?.(message.data.count as number);
        }
      });

    } catch (err) {
      console.error('❌ Erro ao conectar WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsConnecting(false);
      onError?.(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [enabled, storeId, wsUrl, onConnect, onDisconnect, onError, onNewOrder, onOrderUpdate, onOrderDelete, onPendingOrdersCount]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Função para enviar mensagem
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', message);
    } else {
      console.warn('⚠️ WebSocket não conectado, não foi possível enviar mensagem');
    }
  }, []);

  // Função para inscrever em uma loja
  const subscribeToStore = useCallback((newStoreId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_store', newStoreId);
      console.log(`📡 Inscrito na loja: ${newStoreId}`);
    }
  }, []);

  // Função para cancelar inscrição de uma loja
  const unsubscribeFromStore = useCallback((newStoreId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe_store', newStoreId);
      console.log(`📡 Cancelada inscrição na loja: ${newStoreId}`);
    }
  }, []);

  // Conectar quando o componente montar
  useEffect(() => {
    connect();

    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    subscribeToStore,
    unsubscribeFromStore
  };
}

// Hook simplificado para apenas conexão
export function useWebSocketConnection(enabled = true) {
  const { isConnected, isConnecting, error } = useWebSocket({ enabled });
  
  return {
    isConnected,
    isConnecting,
    error
  };
}
