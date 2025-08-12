import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/order';

interface UseOrdersRealtimeProps {
  storeId: string;
  storeSlug: string;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
}

export function useOrdersRealtime({ 
  storeId, 
  storeSlug, 
  onNewOrder, 
  onOrderUpdate 
}: UseOrdersRealtimeProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar pedidos iniciais
  const loadInitialOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeSlug}/orders?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos iniciais:', error);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  // Configurar WebSocket real
  useEffect(() => {
    if (!storeId) return;

    setConnectionStatus('connecting');

    // Carregar dados iniciais
    loadInitialOrders();

    // Configurar canal Realtime para pedidos
    const channel = supabase
      .channel(`orders-${storeId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${storeId}` 
        },
        (payload) => {
          const newOrder = payload.new as Order;
          console.log('🆕 Novo pedido via WebSocket:', newOrder);
          
          // Verificar se é pedido real da plataforma
          const isRealOrder = newOrder.status === 'pending' && 
                             newOrder.source === 'link' && 
                             !newOrder.notes?.includes('Origem:');
          
          if (isRealOrder && onNewOrder) {
            onNewOrder(newOrder);
          }
          
          // Adicionar à lista
          setOrders(prev => {
            const exists = prev.some(o => o.id === newOrder.id);
            if (exists) return prev;
            return [newOrder, ...prev];
          });
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${storeId}` 
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          console.log('🔄 Pedido atualizado via WebSocket:', updatedOrder);
          
          if (onOrderUpdate) {
            onOrderUpdate(updatedOrder);
          }
          
          // Atualizar na lista
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${storeId}` 
        },
        (payload) => {
          const deletedOrderId = payload.old.id;
          console.log('🗑️ Pedido deletado via WebSocket:', deletedOrderId);
          
          // Remover da lista
          setOrders(prev => 
            prev.filter(order => order.id !== deletedOrderId)
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do WebSocket:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'error');
      });

    // Cleanup
    return () => {
      console.log('🔌 Desconectando WebSocket...');
      supabase.removeChannel(channel);
    };
  }, [storeId, storeSlug, loadInitialOrders, onNewOrder, onOrderUpdate]);

  return {
    orders,
    loading,
    connectionStatus,
    refetch: loadInitialOrders
  };
}
