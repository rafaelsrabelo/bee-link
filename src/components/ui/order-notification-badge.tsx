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
  // Desabilitado temporariamente
  return null;
}