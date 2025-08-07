'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Buscar pedidos em aberto
  useEffect(() => {
    if (!storeSlug) return;
    
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch(`/api/stores/${storeSlug}/orders?onlyToday=true&limit=50`);
        if (response.ok) {
          const data = await response.json();
          const pending = data.orders?.filter((order: { status: string }) => order.status === 'pending') || [];
          setPendingCount(pending.length);
        }
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
      }
    };
    
    fetchPendingOrders();
    
    // Atualizar a cada 3 segundos
    const interval = setInterval(fetchPendingOrders, 3000);
    
    return () => clearInterval(interval);
  }, [storeSlug]);

  if (!storeSlug || !storeId) return null;

  return (
    <div className={`relative ${className}`}>
      <div 
        className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-all duration-200 backdrop-blur-sm cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowDropdown(!showDropdown);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <Bell className="w-4 h-4 text-white drop-shadow-sm" />
      </div>
      
      {pendingCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg animate-pulse"
          style={{ fontSize: '10px' }}
        >
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}

      {/* Dropdown de notificações */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            <div className="p-4 text-center text-gray-500">
              {pendingCount > 0 
                ? `${pendingCount} pedido(s) pendente(s)` 
                : 'Nenhuma notificação'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}