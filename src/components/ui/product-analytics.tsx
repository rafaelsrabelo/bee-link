'use client';

import { useEffect, useState } from 'react';
import { Eye, MousePointer } from 'lucide-react';

interface ProductAnalyticsProps {
  productId: string;
  storeSlug: string;
}

interface ProductStats {
  views: number;
  clicks: number;
}

export default function ProductAnalytics({ productId, storeSlug }: ProductAnalyticsProps) {
  const [stats, setStats] = useState<ProductStats>({ views: 0, clicks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProductStats = async () => {
      try {
        const response = await fetch(`/api/stores/${storeSlug}/analytics?period=30d`);
        if (response.ok) {
          const data = await response.json();
          const product = data.top_products.find((p: { product_id: string; views?: number; clicks?: number }) => p.product_id === productId);
          if (product) {
            setStats({
              views: product.views || 0,
              clicks: product.clicks || 0
            });
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadProductStats();
  }, [productId, storeSlug]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <div className="animate-pulse bg-gray-200 h-3 w-8 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 text-xs">
      <div className="flex items-center space-x-1 text-blue-600">
        <Eye className="w-3 h-3" />
        <span>{stats.views}</span>
      </div>
      <div className="flex items-center space-x-1 text-green-600">
        <MousePointer className="w-3 h-3" />
        <span>{stats.clicks}</span>
      </div>
    </div>
  );
} 