'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface OrderNotificationBadgeProps {
  storeSlug?: string;
  storeId?: string;
  className?: string;
}

export default function OrderNotificationBadge({ 
  storeSlug, 
  storeId, 
  className = '' 
}: OrderNotificationBadgeProps) {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Função para buscar contagem de pedidos pendentes
  const fetchPendingCount = async () => {
    if (!storeId) return;

    try {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .in('status', ['pending', 'accepted', 'preparing']);

      if (error) throw error;
      setPendingOrdersCount(count || 0);
    } catch (err) {
      console.error('Erro ao buscar contagem de pedidos:', err);
    }
  };

  // Configurar sistema de notificações em tempo real - igual ao dashboard
  useEffect(() => {
    if (!storeId) return;

    // Carregar dados iniciais
    fetchPendingCount();

    // Configuração do Realtime - exatamente igual ao dashboard
    const channel = supabase
      .channel(`badge-orders-${storeId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${storeId}` 
        },
        (payload) => {
          console.log('🔍 Badge: Novo pedido detectado:', payload.new?.id);
          // Novo pedido chegou - atualizar contagem
          fetchPendingCount();
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
          console.log('🔍 Badge: Pedido atualizado:', payload.new?.id, 'Status:', payload.new?.status);
          // Status do pedido mudou - atualizar contagem
          fetchPendingCount();
        }
      )
      .subscribe((status) => {
        console.log('🔍 Badge: Status do canal:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  if (!storeSlug || !storeId) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-all duration-200 backdrop-blur-sm">
        <Bell className="w-4 h-4 text-white drop-shadow-sm" />
      </div>
      {pendingOrdersCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg animate-pulse"
          style={{ fontSize: '10px' }}
        >
          {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
        </span>
      )}
    </div>
  );
}