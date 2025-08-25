'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Order } from '../types/order';

interface UseOrdersWebSocketProps {
  storeId: string;
  storeSlug: string;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
  onOrderDelete?: (orderId: string) => void;
  enabled?: boolean;
}

interface UseOrdersWebSocketReturn {
  orders: Order[];
  loading: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrdersWebSocket({
  storeId,
  storeSlug,
  onNewOrder,
  onOrderUpdate,
  onOrderDelete,
  enabled = true
}: UseOrdersWebSocketProps): UseOrdersWebSocketReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar pedidos iniciais
  const loadInitialOrders = useCallback(async () => {
    if (!storeSlug) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/stores/${storeSlug}/orders?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        setError(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  // Carregar dados iniciais
  useEffect(() => {
    if (enabled && storeSlug) {
      loadInitialOrders();
    }
  }, [enabled, storeSlug, loadInitialOrders]);

  // Simular conexão WebSocket (por enquanto, apenas carregamento inicial)
  useEffect(() => {
    if (enabled && storeSlug) {
      setIsConnecting(true);
      // Simular conexão bem-sucedida após 1 segundo
      const timer = setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [enabled, storeSlug]);

  return {
    orders,
    loading,
    isConnected,
    isConnecting,
    error,
    refetch: loadInitialOrders
  };
}
