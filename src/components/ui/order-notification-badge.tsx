'use client';

import { Bell } from 'lucide-react';
import { useGlobalOrderNotifications } from '../../hooks/useGlobalOrderNotifications';

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
  const { pendingOrdersCount } = useGlobalOrderNotifications({ 
    storeSlug, 
    storeId, 
    enabled: !!(storeSlug && storeId) 
  });

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