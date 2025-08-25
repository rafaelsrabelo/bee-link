'use client';

import { Bell } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Order } from '../../types/order';

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
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Carregar pedidos pendentes
  const loadPendingOrders = useCallback(async () => {
    if (!storeSlug) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeSlug}/orders`);
      if (response.ok) {
        const data = await response.json();
        const pendingCount = (data.orders || []).filter((order: Order) => 
          order.status === 'pending' || order.status === 'accepted' || order.status === 'preparing'
        ).length;
        setPendingCount(pendingCount);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos pendentes:', error);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!storeSlug) return;

    loadPendingOrders();

    // Verificar se estamos no browser antes de conectar WebSocket
    if (typeof window === 'undefined') return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    // Criar áudio para notificação
    const notificationSound = new Audio('/notification.mp3');

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:3001');
        
        ws.onopen = () => {
          console.log('🔔 Badge WebSocket conectado');
          ws?.send(JSON.stringify({
            type: 'subscribe_store',
            storeSlug: storeSlug
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('🔔 Badge recebeu mensagem:', data);
            
            if (data.type === 'order_created') {
              console.log('🔔 Novo pedido! Tocando som no badge...');
              // Verificar se o som está habilitado
              const isSoundEnabled = localStorage.getItem('notification-sound-enabled') !== 'false';
              if (isSoundEnabled) {
                // Tocar som de notificação para novo pedido
                notificationSound.play().catch(error => {
                  console.log('🔇 Erro ao tocar som no badge:', error);
                });
              }
              // Recarregar contagem quando houver mudança
              loadPendingOrders();
            } else if (data.type === 'order_updated') {
              console.log('🔔 Badge atualizando contagem...');
              // Recarregar contagem quando houver mudança
              loadPendingOrders();
            }
          } catch (error) {
            console.error('Erro ao processar mensagem WebSocket do badge:', error);
          }
        };

        ws.onerror = (error) => {
          // Silenciar erro de conexão - servidor pode não estar rodando
          console.log('🔔 WebSocket do badge não disponível (servidor pode não estar rodando)');
        };

        ws.onclose = () => {
          console.log('🔔 Badge WebSocket desconectado');
          // Tentar reconectar após 5 segundos
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };

      } catch (error) {
        console.log('🔔 Erro ao inicializar WebSocket do badge:', error);
      }
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [storeSlug, loadPendingOrders]);

  // Não mostrar se não há pedidos pendentes
  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <Bell className="w-4 h-4" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
        {pendingCount > 9 ? '9+' : pendingCount}
      </span>
    </div>
  );
}