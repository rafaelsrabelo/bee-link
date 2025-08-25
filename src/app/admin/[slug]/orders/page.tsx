'use client';

import CreateOrderModal from '@/components/ui/create-order-modal';
import SoundToggle from '@/components/ui/sound-toggle';
import { BarChart3, Bell, Calendar, CheckCircle, Clock, DollarSign, Loader2, MapPin, Package, Phone, Plus, Search, ShoppingBag, Truck, User, Wifi, WifiOff, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AdminHeader from '../../../../components/ui/admin-header';
import LottieLoader from '../../../../components/ui/lottie-loader';
import { useAuth } from '../../../../contexts/AuthContext';
import { useStoreCache } from '../../../../hooks/useStoreCache';
import { supabase } from '../../../../lib/supabase';
import type { Order } from '../../../../types/order';

interface WebSocketStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

function WebSocketStatus({ isConnected, isConnecting, error }: WebSocketStatusProps) {
  if (isConnecting) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Conectando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Erro de conexão</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <Wifi className="w-4 h-4" />
        <span className="text-sm">Tempo Real Ativo</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm">Desconectado</span>
    </div>
  );
}

export default function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const { slug } = use(params);
  const router = useRouter();
  
  // Estados para pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'>('all');
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  
  // Estados para WebSocket
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar cache para a loja
  const { store, loading: storeLoading, error: storeError } = useStoreCache(slug, user?.id);

  // Função para carregar pedidos iniciais
  const loadInitialOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/stores/${slug}/orders`);
      if (response.ok) {
        const data = await response.json();
        const allOrders = data.orders || [];
        
        // Filtrar pedidos: apenas do dia OU não finalizados/cancelados
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredOrders = allOrders.filter((order: Order) => {
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);
          
          const isFromToday = orderDate.getTime() === today.getTime();
          const isNotFinished = order.status !== 'delivered' && order.status !== 'cancelled';
          
          return isFromToday || isNotFinished;
        });
        
        setOrders(filteredOrders);
      } else {
        toast.error(`Erro ao carregar pedidos: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Função para atualizar status do pedido
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Atualizar o pedido na lista
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Atualizar pedido selecionado se for o mesmo
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        
        toast.success(`Status atualizado para ${getStatusLabel(newStatus)}`);
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  }, [selectedOrder]);

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceito';
      case 'preparing': return 'Preparando';
      case 'delivering': return 'Saiu para Entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-yellow-400 bg-yellow-50 text-yellow-800';
      case 'accepted': return 'border-blue-400 bg-blue-50 text-blue-800';
      case 'preparing': return 'border-orange-400 bg-orange-50 text-orange-800';
      case 'delivering': return 'border-purple-400 bg-purple-50 text-purple-800';
      case 'delivered': return 'border-green-400 bg-green-50 text-green-800';
      case 'cancelled': return 'border-red-400 bg-red-50 text-red-800';
      default: return 'border-gray-400 bg-gray-50 text-gray-800';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'delivering': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Função para obter prioridade do status (menor número = maior prioridade)
    const getStatusPriority = (status: string) => {
      switch (status) {
        case 'pending': return 1;
        case 'accepted': return 2;
        case 'preparing': return 3;
        case 'delivering': return 4;
        case 'delivered': return 5;
        case 'cancelled': return 6;
        default: return 7;
      }
    };

    // Ordenar por prioridade do status primeiro
    const priorityA = getStatusPriority(a.status);
    const priorityB = getStatusPriority(b.status);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Se mesmo status, ordenar por data de criação (mais recente primeiro)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Calcular estatísticas
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalValue: orders.reduce((sum, order) => sum + order.total, 0)
  };

  // Função para criar beep de notificação usando Web Audio API
  const createNotificationSound = useCallback(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequência do beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('🔊 Beep de notificação criado');
    }
  }, []);

  // Criar áudio para notificação de novo pedido (fora do useEffect)
  const notificationSound = useMemo(() => {
    if (typeof window !== 'undefined') {
      // Tentar carregar o arquivo de áudio primeiro
      const audio = new Audio('/notification.mp3');
      audio.preload = 'auto';
      audio.volume = 0.7; // Volume em 70%
      
      // Log para debug
      console.log('🔊 Áudio de notificação criado:', audio);
      
      return audio;
    }
    return null;
  }, []);

  // WebSocket simples e funcional
  useEffect(() => {
    if (!store?.slug) return;

    setIsConnecting(true);
    
    // Criar conexão WebSocket simples
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🔌 WebSocket conectado!');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      
      // Inscrever na loja
      ws.send(JSON.stringify({
        type: 'subscribe_store',
        storeSlug: store.slug
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📦 Mensagem WebSocket recebida:', data);
        
        if (data.type === 'order_created') {
          console.log('🆕 Novo pedido recebido! Tocando som...');
          // Verificar se o som está habilitado
          const isSoundEnabled = localStorage.getItem('notification-sound-enabled') !== 'false';
          console.log('🔊 Som habilitado:', isSoundEnabled);
          console.log('🔊 Áudio disponível:', !!notificationSound);
          
          if (isSoundEnabled) {
            console.log('🔊 Tentando tocar som...');
            
            // Tentar tocar o arquivo de áudio primeiro
            if (notificationSound) {
              notificationSound.currentTime = 0; // Reset para o início
              notificationSound.play()
                .then(() => {
                  console.log('🔊 Som tocado com sucesso!');
                })
                .catch(error => {
                  console.log('🔇 Erro ao tocar arquivo de áudio:', error);
                  // Se falhar, usar o beep gerado
                  console.log('🔊 Usando beep gerado...');
                  createNotificationSound();
                });
            } else {
              // Se não há arquivo de áudio, usar o beep gerado
              console.log('🔊 Usando beep gerado...');
              createNotificationSound();
            }
          } else {
            console.log('🔇 Som não tocado - habilitado:', isSoundEnabled);
          }
          loadInitialOrders();
        } else if (data.type === 'order_updated') {
          console.log('🔄 Pedido atualizado');
          loadInitialOrders();
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      setIsConnected(false);
      setIsConnecting(false);
    };
    
    ws.onerror = (error) => {
      console.error('❌ Erro WebSocket:', error);
      setError('Erro de conexão');
      setIsConnecting(false);
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      ws.close();
    };
  }, [store?.slug, loadInitialOrders, notificationSound, createNotificationSound]);

  // Carregar dados iniciais
  useEffect(() => {
    if (store?.slug) {
      loadInitialOrders();
    }
  }, [store?.slug, loadInitialOrders]);

  if (storeLoading || !user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <div className="flex items-center justify-center min-h-screen">
            <LottieLoader 
              animationData={loadingAnimation}
              size="lg"
              text="Carregando..."
            />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!store || storeError) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loja não encontrada
              </h3>
              <p className="text-gray-600">
                A loja que você está procurando não existe.
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <AdminHeader
          store={store}
          currentPage="orders"
          title="Gerenciar Pedidos"
          icon={ShoppingBag}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-24">
          {/* Header com status WebSocket */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pedidos</h1>
            <WebSocketStatus 
              isConnected={isConnected}
              isConnecting={isConnecting}
                error={error}
              />
            </div>
            <div className="flex items-center space-x-2">
              <SoundToggle />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3 mb-6">
            <button 
              onClick={() => router.push(`/admin/${slug}/reports`)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-500 transition-colors" 
              type="button"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Relatórios</span>
            </button>
            <button 
              onClick={() => setShowCreateOrderModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors" 
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Pedido</span>
            </button>
            <button 
              onClick={() => {
                console.log('🔊 Testando som...');
                if (notificationSound) {
                  notificationSound.currentTime = 0;
                  notificationSound.play().then(() => {
                    console.log('🔊 Teste de som funcionou!');
                  }).catch(err => {
                    console.log('🔇 Erro no teste de som:', err);
                    console.log('🔊 Usando beep gerado...');
                    createNotificationSound();
                  });
                } else {
                  console.log('🔊 Usando beep gerado...');
                  createNotificationSound();
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-blue-400 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors" 
              type="button"
            >
              <Bell className="w-4 h-4" />
              <span>Testar Som</span>
            </button>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Pedidos Feitos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-600 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Em Aberto</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.pending + stats.accepted + stats.preparing}</p>
                  <p className="text-xs text-orange-600 font-medium">PEDIDOS AGUARDANDO</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Entregues</p>
                  <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
                </div>
                <Package className="w-8 h-8 text-green-600 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">Cancelados</p>
                  <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
                </div>
                <X className="w-8 h-8 text-red-600 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Total Vendido</p>
                  <p className="text-2xl font-bold text-gray-900">R$ {stats.totalValue.toFixed(2).replace('.', ',')}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-600 opacity-80" />
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pedidos */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lista de Pedidos</h2>
                
                {/* Busca */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, ID ou produto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'all' 
                        ? 'border border-gray-400 bg-gray-50 text-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos ({stats.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'pending' 
                        ? 'border border-gray-400 bg-gray-50 text-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Em Aberto ({stats.pending + stats.accepted + stats.preparing})
                  </button>
                  <button
                    onClick={() => setStatusFilter('delivered')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'delivered' 
                        ? 'border border-gray-400 bg-gray-50 text-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Entregues ({stats.delivered})
                  </button>
                  <button
                    onClick={() => setStatusFilter('cancelled')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'cancelled' 
                        ? 'border border-gray-400 bg-gray-50 text-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancelados ({stats.cancelled})
                  </button>
                </div>

                {/* Lista */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LottieLoader 
                animationData={loadingAnimation}
                size="md"
                text="Carregando pedidos..."
              />
            </div>
                ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                      {searchTerm ? 'Nenhum pedido corresponde à busca.' : 'Quando houver pedidos, eles aparecerão aqui.'}
              </p>
            </div>
          ) : (
                  <div className="space-y-2">
                    {filteredOrders.map((order) => (
                <div
                  key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedOrder?.id === order.id 
                            ? 'border-purple-500 bg-purple-50' 
                            : order.status === 'pending'
                            ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-sm hover:shadow-md'
                            : order.status === 'accepted'
                            ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md'
                            : order.status === 'preparing'
                            ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 hover:shadow-md'
                            : order.status === 'delivering'
                            ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-md'
                            : order.status === 'delivered'
                            ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md'
                            : order.status === 'cancelled'
                            ? 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50 hover:shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              order.status === 'pending'
                                ? 'bg-yellow-100 border-2 border-yellow-400'
                                : order.status === 'accepted'
                                ? 'bg-blue-100 border-2 border-blue-400'
                                : order.status === 'preparing'
                                ? 'bg-orange-100 border-2 border-orange-400'
                                : order.status === 'delivering'
                                ? 'bg-purple-100 border-2 border-purple-400'
                                : order.status === 'delivered'
                                ? 'bg-green-100 border-2 border-green-400'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 border-2 border-red-400'
                                : 'bg-gray-100 border-2 border-gray-300'
                            }`}>
                              <span className={`text-xs font-bold ${
                                order.status === 'pending'
                                  ? 'text-yellow-700'
                                  : order.status === 'accepted'
                                  ? 'text-blue-700'
                                  : order.status === 'preparing'
                                  ? 'text-orange-700'
                                  : order.status === 'delivering'
                                  ? 'text-purple-700'
                                  : order.status === 'delivered'
                                  ? 'text-green-700'
                                  : order.status === 'cancelled'
                                  ? 'text-red-700'
                                  : 'text-gray-600'
                              }`}>#</span>
                            </div>
                            <div>
                              <p className={`font-medium ${
                                order.status === 'pending'
                                  ? 'text-yellow-900'
                                  : 'text-gray-900'
                              }`}>
                                {order.id.slice(-8).toUpperCase()}
                                {order.status === 'pending' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                                    ⚡ ATENÇÃO
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="w-3 h-3" />
                                <span>{order.customer_name}</span>
                                <Phone className="w-3 h-3" />
                                <span>{order.customer_phone}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes do Pedido */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {selectedOrder ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Detalhes do Pedido</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Informações do Pedido */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Pedido #{selectedOrder.id.slice(-8).toUpperCase()}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{selectedOrder.customer_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{selectedOrder.customer_phone}</span>
                        </div>
                        {selectedOrder.customer_address && (
                    <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedOrder.customer_address}</span>
                          </div>
                        )}
                      </div>
                  </div>

                    {/* Itens */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Itens</h4>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-900 font-medium">
                          R$ {item.price}
                        </span>
                      </div>
                    ))}
                      </div>
                  </div>

                  {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          R$ {selectedOrder.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* Status Atual */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Status Atual</h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedOrder.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                    </div>
                  </div>

                  {/* Ações */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 mb-2">Ações</h4>
                      
                      {selectedOrder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, 'accepted')}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Aceitar Pedido</span>
                          </button>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                            className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancelar Pedido</span>
                          </button>
                        </>
                      )}
                      
                      {selectedOrder.status === 'accepted' && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                          className="w-full px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Package className="w-4 h-4" />
                          <span>Preparar Pedido</span>
                        </button>
                      )}
                      
                      {selectedOrder.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'delivering')}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Saiu para Entrega</span>
                        </button>
                    )}
                      
                      {selectedOrder.status === 'delivering' && (
                      <button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                          className="w-full px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                      >
                          <CheckCircle className="w-4 h-4" />
                          <span>Entregue</span>
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione um pedido
                  </h3>
                  <p className="text-gray-600">
                    Clique em um pedido da lista ao lado para gerenciar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Criar Pedido */}
        <CreateOrderModal
          isOpen={showCreateOrderModal}
          onClose={() => setShowCreateOrderModal(false)}
          storeSlug={slug}
          onOrderCreated={loadInitialOrders}
        />
      </div>
    </ProtectedRoute>
  );
}
