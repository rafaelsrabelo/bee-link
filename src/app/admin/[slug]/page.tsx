'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { BarChart3, Eye, MousePointer, TrendingUp, Star, ShoppingCart } from 'lucide-react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import LottieLoader from '../../../components/ui/lottie-loader';
import AdminHeader from '../../../components/ui/admin-header';
import loadingAnimation from '../../../../public/animations/loading-dots-blue.json';

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  user_id: string;
}

export default function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const { user } = useAuth();
  const router = useRouter();
  const { slug } = use(params);

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user, slug]);

  useEffect(() => {
    if (store) {
      loadAnalytics();
    }
  }, [period, store]);

  const loadStore = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/stores/${slug}`);
      if (!response.ok) {
        toast.error('Loja não encontrada');
        router.push('/create-store');
        return;
      }
      const storeData = await response.json();
      setStore(storeData);
    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/stores/${slug}/analytics?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setAnalytics({ total_views: 0, total_clicks: 0, unique_visitors: 0, avg_views_per_session: 0, top_products: [], daily_stats: [] });
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast.error('Erro ao carregar dados de analytics');
    }
  };

  if (loading || !store) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
          <LottieLoader 
            animationData={loadingAnimation}
            text="Carregando..."
          />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <AdminHeader
          store={store}
          currentPage="dashboard"
          title="Painel Administrativo"
          icon={Store}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Analytics Section */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Analytics</h3>
              <p className="text-gray-600">Acompanhe o desempenho da sua loja em tempo real</p>
            </div>
            
            {/* Filtros de período */}
            <div className="flex space-x-2 mb-6">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
                </button>
              ))}
            </div>

            {/* Cards de métricas */}
            {!analytics ? (
              <div className="space-y-6 mb-8">
                {/* Loading - Linha 1: Métricas de Visitação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Loading - Linha 2: Métricas de Conversão */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                {/* Linha 1: Métricas de Visitação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Visualizações</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.total_views.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Eye className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Cliques</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.total_clicks.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <MousePointer className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Visitantes únicos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.unique_visitors.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linha 2: Métricas de Conversão */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Carrinho</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.total_cart_clicks?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Carrinho Header</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.total_header_cart_clicks?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Média/sessão</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.avg_views_per_session.toFixed(1)}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Produtos mais clicados */}
            {!analytics ? (
              <div className="mt-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : analytics.top_products && analytics.top_products.length > 0 ? (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🏆 Produtos mais clicados</h4>
                <div className="space-y-3">
                  {analytics.top_products.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center relative">
                          <span className="text-sm font-semibold text-purple-600">#{product.rank}</span>
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          {index === 0 && (
                            <span className="text-xs text-yellow-600 font-medium">⭐ Mais clicado</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{product.clicks} cliques</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Produtos mais clicados no carrinho */}
            {!analytics ? (
              <div className="mt-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : analytics.top_cart_products && analytics.top_cart_products.length > 0 ? (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🛒 Produtos mais adicionados ao carrinho</h4>
                <div className="space-y-3">
                  {analytics.top_cart_products.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center relative">
                          <span className="text-sm font-semibold text-red-600">#{product.rank}</span>
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1">
                              <ShoppingCart className="w-4 h-4 text-red-500 fill-red-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          {index === 0 && (
                            <span className="text-xs text-red-600 font-medium">🛒 Mais adicionado</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{product.cart_clicks} adições</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Atividade diária */}
            {!analytics ? (
              <div className="mt-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : analytics.daily_stats && analytics.daily_stats.length > 0 ? (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Atividade diária</h4>
                <div className="space-y-2">
                  {analytics.daily_stats.slice(0, 7).map((stat: any) => (
                    <div key={stat.date} className="flex items-center justify-between p-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          {new Date(stat.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{stat.views} visualizações</span>
                        <span className="text-sm text-gray-600">{stat.unique_sessions} sessões</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}