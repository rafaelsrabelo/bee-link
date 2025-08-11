'use client';

import { 
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Eye, 
  Link,
  Minus,
  MousePointer, 
  Package,
  ShoppingCart,
  TrendingUp, 
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AnalyticsFilters, StoreAnalytics } from '../../types/analytics';

interface AnalyticsDashboardProps {
  storeSlug: string;
}

export default function AnalyticsDashboard({ storeSlug }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    // Evitar Date.now() no lado servidor para problemas de hidratação
    if (typeof window === 'undefined') {
      return {
        start_date: '',
        end_date: '',
        period: '30d'
      };
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    return {
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
      period: '30d'
    };
  });

  useEffect(() => {
    loadAnalytics();
  }, [storeSlug, filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/stores/${storeSlug}/analytics?period=${filters.period}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: '7d' | '30d' | '90d' | '1y') => {
    const today = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(today.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(today.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    setFilters({
      start_date: startDate.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
      period
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          Nenhum dado de analytics disponível
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Período de Análise</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filters.period === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === '7d' && '7 dias'}
              {period === '30d' && '30 dias'}
              {period === '90d' && '90 dias'}
              {period === '1y' && '1 ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Visualizações</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_views.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cliques em Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_clicks.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <MousePointer className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Adições ao Carrinho</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_cart_clicks?.toLocaleString() || 0}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Visitantes Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.unique_visitors.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Links Diretos</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.direct_links.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Link className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Média/Sessão</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.avg_views_per_session.toFixed(1)}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Produtos Mais Visitados */}
      {analytics.top_products && analytics.top_products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Visitados</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.top_products.slice(0, 5).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">{product.clicks} visualizações</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{product.clicks}</div>
                  <div className="text-xs text-gray-500">cliques</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produtos Mais Clicados (na lista de produtos) */}
      {analytics.top_products && analytics.top_products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Clicados</h3>
            <MousePointer className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.top_products.slice(0, 5).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">{product.clicks} cliques</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{product.clicks}</div>
                  <div className="text-xs text-gray-500">vezes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produtos Mais Adicionados ao Carrinho */}
      {analytics.top_cart_products && analytics.top_cart_products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Adicionados ao Carrinho</h3>
            <ShoppingCart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.top_cart_products.slice(0, 5).map((product, index) => {
              return (
                <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-red-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.product_name}</p>
                      <p className="text-sm text-gray-500">{product.clicks || 0} adições</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{product.clicks || 0}</div>
                    <div className="text-xs text-gray-500">vezes</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estatísticas Diárias */}
      {analytics.daily_stats && analytics.daily_stats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tendência Diária</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            {analytics.daily_stats.slice(-7).map((stat) => (
              <div key={stat.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">
                  {new Date(stat.date).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{stat.views} visualizações</span>
                  <span className="text-sm text-gray-600">{stat.unique_sessions} sessões</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 