import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface UseWebSocketV2Options {
  storeSlug?: string;
  enabled?: boolean;
}

interface UseWebSocketV2Return {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocketV2({ storeSlug, enabled = true }: UseWebSocketV2Options): UseWebSocketV2Return {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !storeSlug || socketRef.current?.connected) {
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Criar nova conexão
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true,
      });

      socketRef.current = socket;

      // Eventos de conexão
      socket.on('connect', () => {
        console.log('🔌 WebSocket conectado');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);

        // Inscrever na loja
        socket.emit('subscribe_store', storeSlug);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket desconectado:', reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Reconectar apenas se não foi desconexão manual
        if (reason !== 'io client disconnect' && enabled) {
          console.log('🔄 Tentando reconectar em 3 segundos...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Erro de conexão WebSocket:', err);
        setError(err.message);
        setIsConnecting(false);
        setIsConnected(false);
      });

      // Eventos específicos da loja
      socket.on('order_created', (data) => {
        console.log('📦 Novo pedido criado:', data);
        // Aqui você pode emitir um evento customizado ou usar um callback
      });

      socket.on('order_updated', (data) => {
        console.log('📦 Pedido atualizado:', data);
        // Aqui você pode emitir um evento customizado ou usar um callback
      });

      // Conectar
      socket.connect();

    } catch (err) {
      console.error('❌ Erro ao criar conexão WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsConnecting(false);
    }
  }, [enabled, storeSlug]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, []);

  // Conectar quando storeSlug mudar
  useEffect(() => {
    if (enabled && storeSlug) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [enabled, storeSlug, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    socket: socketRef.current,
    connect,
    disconnect,
  };
}
