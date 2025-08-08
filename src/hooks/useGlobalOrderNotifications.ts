'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/order';

interface UseGlobalOrderNotificationsProps {
  storeSlug?: string;
  storeId?: string;
  enabled?: boolean;
}

interface UseGlobalOrderNotificationsReturn {
  pendingOrdersCount: number;
  newOrders: Order[];
  loading: boolean;
  error: string | null;
}

export function useGlobalOrderNotifications({
  storeId,
  enabled = true
}: UseGlobalOrderNotificationsProps): UseGlobalOrderNotificationsReturn {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar pedidos pendentes
  const fetchPendingOrders = useCallback(async () => {
    if (!enabled || !storeId) return;

    setLoading(true);
    setError(null);

    try {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .in('status', ['pending', 'accepted', 'preparing']);

      if (error) throw error;

      const newCount = count || 0;
      setPendingOrdersCount(newCount);
      
      if (count && count > 0) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeId)
          .in('status', ['pending', 'accepted', 'preparing'])
          .order('created_at', { ascending: false })
          .limit(5);
          
        setNewOrders(data || []);
      } else {
        setNewOrders([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [enabled, storeId]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  // Configurar Realtime
  useEffect(() => {
    if (!enabled || !storeId) return;

    const channel = supabase
      .channel(`orders-notifications-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          // Atualizar dados quando houver mudanças
          fetchPendingOrders();
        }
      )
      .subscribe((status) => {
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingOrders, enabled, storeId]);

  return {
    pendingOrdersCount,
    newOrders,
    loading,
    error
  };
}

// Hook mais simples para apenas contagem
export function usePendingOrdersCount(storeId?: string): number {
  const { pendingOrdersCount } = useGlobalOrderNotifications({
    storeId,
    enabled: !!storeId
  });
  
  return pendingOrdersCount;
}

export default useGlobalOrderNotifications;