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
      <Bell className="w-6 h-6" />
      {pendingOrdersCount > 0 && (
        <span 
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse"
        >
          {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
        </span>
      )}
    </div>
  );
}