'use client';

import { useCallback, useEffect, useState } from 'react';

interface UseGlobalOrderNotificationsWebSocketProps {
  storeId: string;
  storeSlug: string;
  enabled?: boolean;
}

interface UseGlobalOrderNotificationsWebSocketReturn {
  pendingOrdersCount: number;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGlobalOrderNotificationsWebSocket({
  storeId,
  storeSlug,
  enabled = true
}: UseGlobalOrderNotificationsWebSocketProps): UseGlobalOrderNotificationsWebSocketReturn {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar contagem de pedidos pendentes
  const fetchPendingOrders = useCallback(async () => {
    if (!storeSlug) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/stores/${storeSlug}/orders?select=id&status=in.(pending,accepted,preparing)`);
      if (response.ok) {
        const data = await response.json();
        setPendingOrdersCount(data.orders?.length || 0);
      } else {
        setError(`Erro ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos pendentes:', error);
      setError('Erro de conexão');
    }
  }, [storeSlug]);

  // Carregar dados iniciais
  useEffect(() => {
    if (enabled && storeSlug) {
      fetchPendingOrders();
    }
  }, [enabled, storeSlug, fetchPendingOrders]);

  return {
    pendingOrdersCount,
    isConnected,
    isConnecting,
    error,
    refetch: fetchPendingOrders
  };
}

// Hook mais simples para apenas contagem
export function usePendingOrdersCountWebSocket(storeId?: string): number {
  const { pendingOrdersCount } = useGlobalOrderNotificationsWebSocket({
    storeId,
    enabled: !!storeId
  });
  
  return pendingOrdersCount;
}

export default useGlobalOrderNotificationsWebSocket;
