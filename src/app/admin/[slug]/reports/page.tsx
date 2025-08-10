'use client';

import { 
  BarChart3,
  DollarSign,
  Filter, 
  Package, 
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AdminHeader from '../../../../components/ui/admin-header';
import LottieLoader from '../../../../components/ui/lottie-loader';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';
import type { Order } from '../../../../types/order';

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  user_id: string;
}

const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'accepted', label: 'Aceito' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'delivering', label: 'Entregando' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
];

export default function ReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'polling' | 'error'>('connecting');
  const { user } = useAuth();
  const router = useRouter();
  const { slug } = use(params);

  // Filtros
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear() // 2025
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Aumentado para 20 itens por página
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user]);

  useEffect(() => {
    if (store) {
      loadOrders();
    }
  }, [store]);

  useEffect(() => {
    let filtered = [...orders];
    
    // Resetar para primeira página quando aplicar filtros
    setCurrentPage(1);

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtro por data personalizada
    if (filters.dateFrom && filters.dateTo) {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Incluir o dia inteiro
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    } else {
      // Filtro por mês/ano se não houver data personalizada
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() + 1 === filters.month && 
               orderDate.getFullYear() === filters.year;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  useEffect(() => {
    // Calcular paginação quando filteredOrders ou currentPage mudarem
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Configurar sistema de notificações em tempo real
  useEffect(() => {
    if (!store?.id) return;



    let pollingInterval: NodeJS.Timeout;

    // Configuração do Realtime para relatórios
    const channel = supabase
      .channel(`reports-orders-${store.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${store.id}` 
        },
        (payload) => {
          // Novo pedido chegou!
          const newOrder = payload.new as Order;
          

          
          // Verificar se é do store correto
          if (newOrder.store_id !== store.id) {
            return;
          }
          
          // Atualizar lista local
          setOrders(prev => {
            // Verificar se já existe
            const exists = prev.some(o => o.id === newOrder.id);
            if (exists) {
              return prev;
            }
            
            const updatedOrders = [newOrder, ...prev];
            
            return updatedOrders;
          });
          
          // Mostrar toast de notificação
          toast.success(`🔔 Novo pedido de ${newOrder.customer_name}!`, {
            duration: 5000,
            icon: '🛒'
          });
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${store.id}` 
        },
        (payload) => {
          // Status do pedido mudou
          const updatedOrder = payload.new as Order;
          

          
          setOrders(prev => {
            const updated = prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            );
            
            return updated;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('polling');
          startPolling();
        }
      });

    // Função de polling como fallback
    const startPolling = () => {
      setConnectionStatus('polling');
      pollingInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/stores/${store.slug}/orders`);
          if (response.ok) {
            const data = await response.json();
            const newOrders = data.orders || [];
            
            // Verificar se há novos pedidos
            setOrders(prev => {
              const currentIds = new Set(prev.map(o => o.id));
              const newOrdersToAdd = newOrders.filter((o: Order) => !currentIds.has(o.id));
              
              if (newOrdersToAdd.length > 0) {
                return [...newOrdersToAdd, ...prev];
              }
              
              return newOrders;
            });
          }
        } catch (error) {
          console.error('Erro no polling:', error);
        }
      }, 5000); // Polling a cada 5 segundos
    };

    // Se Realtime não conectar em 5 segundos, ativar polling
    const timeoutId = setTimeout(() => {
      setConnectionStatus(current => {
        if (current === 'connecting') {
          startPolling();
          return 'polling';
        }
        return current;
      });
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeoutId);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [store?.id, store?.slug]);

  const loadStore = async () => {
    if (!slug) return;
    try {
      const response = await fetch(`/api/stores/${slug}`);
      if (!response.ok) {
        toast.error('Loja não encontrada');
        router.push('/create-store');
        return;
      }
      const storeData = await response.json();
      setStore(storeData);
    } catch (_error) {
      toast.error('Erro ao carregar dados da loja');
    }
  };

  const loadOrders = async () => {
    if (!store) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/stores/${store.slug}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };



  const getStatistics = () => {
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(order => 
      ['delivered', 'completed_whatsapp'].includes(order.status)
    ).length;
    const totalRevenue = filteredOrders
      .filter(order => ['delivered', 'completed_whatsapp'].includes(order.status))
      .reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    return {
      totalOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
      conversionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = getStatistics();

  if (loading || !user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <div className="flex items-center justify-center min-h-screen">
            <LottieLoader 
              animationData={loadingAnimation}
              size="lg"
              text="Carregando relatórios..."
            />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!store) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loja não encontrada
              </h3>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex flex-col">
        <AdminHeader
          store={store}
          currentPage="reports"
          title="Relatórios de Pedidos"
          icon={BarChart3}
        />

        <div className="flex-1 overflow-hidden mt-24">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
            
            {/* Status da Conexão */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'polling' ? 'bg-yellow-500' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'connected' ? 'Conectado em tempo real' :
                   connectionStatus === 'polling' ? 'Atualizando automaticamente' :
                   connectionStatus === 'error' ? 'Erro de conexão' : 'Conectando...'}
                </span>
              </div>
            </div>
            
            {/* Filtros - Altura fixa */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data até
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês/Ano
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={filters.month}
                      onChange={(e) => setFilters(prev => ({ ...prev, month: Number.parseInt(e.target.value) }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!!(filters.dateFrom && filters.dateTo)}
                    >
                      {Array.from({length: 12}, (_, i) => {
                        const monthNumber = i + 1;
                        return (
                          <option key={monthNumber} value={monthNumber}>
                            {new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      value={filters.year}
                      onChange={(e) => setFilters(prev => ({ ...prev, year: Number.parseInt(e.target.value) }))}
                      className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!!(filters.dateFrom && filters.dateTo)}
                    >
                      {Array.from({length: 5}, (_, i) => {
                        const currentYear = new Date().getFullYear();
                        const year = currentYear - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setFilters({
                    dateFrom: '',
                    dateTo: '',
                    status: 'all',
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                  })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpar Filtros
                </button>
                <span className="text-sm text-gray-500">
                  {filteredOrders.length} pedidos encontrados
                </span>
              </div>
            </div>

            {/* Estatísticas - Altura fixa */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalRevenue)}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-orange-600">{formatPrice(stats.averageOrderValue)}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Pedidos - Container com scroll independente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lista de Pedidos
                </h2>
              </div>

              <div className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                      <p className="text-gray-500 mt-2">Carregando pedidos...</p>
                    </div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum pedido encontrado para os filtros selecionados</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Tabela com scroll */}
                    <div className="flex-1 overflow-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                              Pedido
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                              Cliente
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                              Data
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  #{order.id.slice(0, 8)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{order.customer_name}</div>
                                <div className="text-sm text-gray-500">{order.customer_phone}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(order.created_at)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  order.status === 'delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {statusOptions.find(s => s.value === order.status)?.label || order.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatPrice(order.total)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação Melhorada */}
                    <div className="border-t border-gray-200 p-6 flex-shrink-0">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {filteredOrders.length > 0 
                              ? `Mostrando ${((currentPage - 1) * itemsPerPage) + 1} até ${Math.min(currentPage * itemsPerPage, filteredOrders.length)} de ${filteredOrders.length} pedidos`
                              : 'Nenhum pedido encontrado'
                            }
                          </span>
                          {filteredOrders.length > itemsPerPage && (
                            <span className="text-gray-500 ml-2">
                              (Página {currentPage} de {Math.ceil(filteredOrders.length / itemsPerPage)})
                            </span>
                          )}
                        </div>
                        
                        {filteredOrders.length > itemsPerPage && (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              ← Anterior
                            </button>
                            
                            <div className="flex items-center space-x-1">
                              {(() => {
                                const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
                                const pages = [];
                                
                                // Sempre mostrar primeira página
                                if (currentPage > 3) {
                                  pages.push(1);
                                  if (currentPage > 4) pages.push('...');
                                }
                                
                                // Páginas ao redor da atual
                                for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                                  pages.push(i);
                                }
                                
                                // Sempre mostrar última página
                                if (currentPage < totalPages - 2) {
                                  if (currentPage < totalPages - 3) pages.push('...');
                                  pages.push(totalPages);
                                }
                                
                                return pages.map((page, index) => (
                                  <div key={`page-${page}-${index}`}>
                                    {page === '...' ? (
                                      <span className="px-3 py-2 text-gray-400">...</span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                          currentPage === page
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    )}
                                  </div>
                                ));
                              })()}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setCurrentPage(Math.min(Math.ceil(filteredOrders.length / itemsPerPage), currentPage + 1))}
                              disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Próximo →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}