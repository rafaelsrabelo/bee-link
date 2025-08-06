'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types/order';

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

  // Função para buscar pedidos pendentes (otimizada)
  const fetchPendingOrders = useCallback(async () => {
    if (!enabled || !storeId) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar apenas a contagem para melhor performance
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingOrdersCount(count || 0);
      
      // Se houver pedidos pendentes, buscar os detalhes apenas se necessário
      if (count && count > 0) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5); // Limitar a 5 pedidos mais recentes
          
        setNewOrders(data || []);
      } else {
        setNewOrders([]);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos pendentes:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [enabled, storeId]);

  // Efeito para buscar pedidos quando o hook é inicializado
  useEffect(() => {
    fetchPendingOrders();
  }, [storeId, enabled, fetchPendingOrders]);

  // Configurar realtime para escutar novos pedidos
  useEffect(() => {
    if (!enabled || !storeId) return;

    // Canal para escutar mudanças na tabela orders
    const channel = supabase
      .channel('orders-notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('Mudança em pedido detectada:', payload);
          
          // Atualizar a contagem quando houver mudanças
          fetchPendingOrders();

          // Se for um novo pedido pendente, mostrar notificação
          if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
            // Aqui você pode adicionar notificação toast, som, etc.
            console.log('Novo pedido recebido!', payload.new);
          }

          // Se um pedido foi aceito, reduzir a contagem
          if (payload.eventType === 'UPDATE' && 
              payload.old?.status === 'pending' && 
              payload.new?.status !== 'pending') {
            console.log('Pedido atualizado de pendente para:', payload.new?.status);
          }
        }
      )
      .subscribe();

    // Cleanup na desmontagem
    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, enabled, fetchPendingOrders]);

  return {
    pendingOrdersCount,
    newOrders,
    loading,
    error
  };
}

// Hook mais simples para apenas contagem (retrocompatibilidade)
export function usePendingOrdersCount(storeId?: string): number {
  const { pendingOrdersCount } = useGlobalOrderNotifications({
    storeId,
    enabled: !!storeId
  });
  
  return pendingOrdersCount;
}

export default useGlobalOrderNotifications;