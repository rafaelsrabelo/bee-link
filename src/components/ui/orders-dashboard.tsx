'use client';

  import { 
    AlertTriangle,
    BarChart3,
    Bell,
    Calendar,
    Check,
    CheckCircle, 
    ChefHat, 
    Clock, 
    MapPin,
    MessageCircle,
    Package, 
    Phone,
    Plus,
    Truck, 
    X,
    XCircle
  } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types/order';
import CreateOrderModal from './create-order-modal';

interface OrdersDashboardProps {
  storeSlug: string;
  storeId: string;
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  accepted: {
    label: 'Aceito',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  preparing: {
    label: 'Preparando',
    icon: ChefHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  delivering: {
    label: 'Entregando',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  delivered: {
    label: 'Entregue',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

export default function OrdersDashboard({ storeSlug, storeId }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'polling' | 'error'>('connecting');

  // Função para verificar se um pedido é do dia atual
  const isToday = (dateString: string) => {
    const today = new Date();
    const orderDate = new Date(dateString);
    return today.toDateString() === orderDate.toDateString();
  };

  // Calcular estatísticas do dia
  const todayOrders = orders.filter(order => isToday(order.created_at));
  
  const stats = {
    total: todayOrders.length,
    pending: todayOrders.filter(order => ['pending', 'accepted', 'preparing'].includes(order.status)).length,
    delivered: todayOrders.filter(order => order.status === 'delivered').length,
    cancelled: todayOrders.filter(order => order.status === 'cancelled').length,
    revenue: todayOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.total, 0)
  };

  // Carregar pedidos iniciais (otimizado - apenas de hoje)
  const loadOrders = async () => {
    try {
      // Carregar apenas pedidos de hoje para melhor performance
      const response = await fetch(`/api/stores/${storeSlug}/orders?onlyToday=true&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Configurar sistema de notificações em tempo real
  useEffect(() => {
    loadOrders();

    let pollingInterval: NodeJS.Timeout;

    // Configuração simples do Realtime
    
    const channel = supabase
      .channel(`orders-${storeId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${storeId}` 
        },
        (payload) => {
          // Novo pedido chegou!
          const newOrder = payload.new as Order;
          
          // Verificar se é do store correto
          if (newOrder.store_id !== storeId) {
            return;
          }
          
          // Tocar som de notificação
          playNotificationSound();
          
          // Atualizar lista local (sempre adicionar, não filtrar por data)
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
          filter: `store_id=eq.${storeId}` 
        },
        (payload) => {
          // Status do pedido mudou
          const updatedOrder = payload.new as Order;
          
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );
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
      console.log('🔄 Iniciando polling a cada 5 segundos...');
      setConnectionStatus('polling');
      pollingInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/stores/${storeSlug}/orders?onlyToday=true&limit=50`);
          if (response.ok) {
            const data = await response.json();
            const newOrders = data.orders || [];
            
            // Verificar se há novos pedidos
            setOrders(prev => {
              const currentIds = new Set(prev.map(o => o.id));
              const newOrdersToAdd = newOrders.filter((o: Order) => !currentIds.has(o.id));
              
              if (newOrdersToAdd.length > 0) {
                console.log('🔔 NOVOS PEDIDOS VIA POLLING!', newOrdersToAdd);
                playNotificationSound();
                
                // Usar setTimeout para evitar setState durante render
                setTimeout(() => {
                  for (const order of newOrdersToAdd) {
                    toast.success(`🔔 Novo pedido de ${order.customer_name}!`, {
                      duration: 5000,
                      icon: '🛒'
                    });
                  }
                }, 0);
                
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

    // Se Realtime não conectar em 3 segundos, ativar polling
    const timeoutId = setTimeout(() => {
      if (connectionStatus === 'connecting') {
        startPolling();
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeoutId);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [storeSlug, storeId]);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      // Gerar beep duplo chamativo
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Primeiro beep
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.value = 800;
      gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.2);
      
      // Segundo beep após pequena pausa
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 1000;
        gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.3);
      }, 300);
      
    } catch (error) {
      // Fallback para navegadores mais antigos
      // Silencioso em produção
    }
  };

  // Função para atualizar status do pedido com nota
  const updateOrderStatusWithNote = async (orderId: string, newStatus: Order['status'], note: string) => {
    setUpdatingStatus(orderId);
    
    // Encontrar o pedido atual
    const currentOrder = orders.find(order => order.id === orderId);
    if (!currentOrder) {
      toast.error('Pedido não encontrado');
      setUpdatingStatus(null);
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          notes: `${currentOrder.notes ? currentOrder.notes + '\n' : ''}${note}` 
        }),
      });

      if (response.ok) {
        await response.json();
        toast.success('Status atualizado e cliente notificado via WhatsApp!', {
          duration: 4000,
          icon: '✅'
        });
        
        // Recarregar a lista de pedidos
        await loadOrders();
      } else {
        const errorData = await response.json();
        console.error('Erro na API:', errorData);
        toast.error(`Erro ao atualizar status: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Função para atualizar status do pedido
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatus(orderId);
    
    // Encontrar o pedido atual
    const currentOrder = orders.find(order => order.id === orderId);
    if (!currentOrder) {
      toast.error('Pedido não encontrado');
      setUpdatingStatus(null);
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await response.json();
        toast.success('Status atualizado e cliente notificado via WhatsApp!', {
          duration: 4000,
          icon: '✅'
        });
        
        // Recarregar a lista de pedidos
        await loadOrders();
      } else {
        const errorData = await response.json();
        console.error('Erro na API:', errorData);
        toast.error(`Erro ao atualizar status: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingStatus(null);
    }
  };



  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header com botão de adicionar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Pedidos de Hoje
          </h2>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pedido
          </button>
        </div>
        
        {/* Estado vazio */}
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum pedido ainda
          </h3>
          <p className="text-gray-600 mb-6">
            Quando chegarem pedidos, eles aparecerão aqui em tempo real!
          </p>
          
          {/* Botão de ação principal */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Pedido
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Registre vendas do balcão ou pedidos por telefone
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Pedidos de Hoje
          </h2>
          
          {/* Indicador de status da conexão */}
          <div className="flex items-center gap-2">
            {connectionStatus === 'connecting' && (
              <div className="flex items-center gap-1 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-xs">Conectando...</span>
              </div>
            )}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs">Tempo real</span>
              </div>
            )}
            {connectionStatus === 'polling' && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs">Polling</span>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs">Erro</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href={`/admin/${storeSlug}/reports`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </a>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pedido
          </button>
          <div className="text-sm text-gray-500">
            {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Pedidos Feitos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Pedidos Feitos</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Em Aberto */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Em Aberto</p>
              <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Entregues */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Entregues</p>
              <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Cancelados */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Cancelados</p>
              <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Total Vendido - Por último */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Vendido</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatPrice(stats.revenue)}
              </p>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Título da Lista */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Pedidos de Hoje ({todayOrders.length})
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Atualizações em tempo real</span>
          {todayOrders.length !== orders.length && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              +{orders.length - todayOrders.length} anteriores
            </span>
          )}
        </div>
      </div>

      {todayOrders.map((order) => {
        const statusInfo = statusConfig[order.status];
        const StatusIcon = statusInfo.icon;

        return (
          <div
            key={order.id}
            className={`border rounded-lg p-4 ${statusInfo.borderColor} ${statusInfo.bgColor}`}
          >
            {/* Header do pedido */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                <span className={`font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                #{order.id.slice(0, 8)}
              </div>
            </div>

            {/* Informações do cliente */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900">
                  {order.customer_name}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{order.customer_phone}</span>
                </div>
                {order.customer_address && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{order.customer_address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Informações de entrega e pagamento */}
            {(order.delivery_type || order.payment_method) && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Detalhes do pedido:
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {order.delivery_type && (
                    <div className="flex items-center space-x-1">
                      <Truck className="w-4 h-4" />
                      <span>
                        {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                        {order.delivery_type === 'delivery' && order.delivery_city && (
                          <span> - {order.delivery_city}/{order.delivery_state}</span>
                        )}
                      </span>
                    </div>
                  )}
                  {order.payment_method && (
                    <div className="flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>
                        {order.payment_method === 'money' && 'Dinheiro'}
                        {order.payment_method === 'pix' && 'PIX'}
                        {order.payment_method === 'credit_card' && 'Cartão de Crédito'}
                        {order.payment_method === 'debit_card' && 'Cartão de Débito'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Itens do pedido */}
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Itens do pedido:
              </div>
              <div className="space-y-1">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total e observações */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold text-gray-900">
                Total: {formatPrice(order.total)}
              </div>
            </div>

            {order.notes && (
              <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
                <span className="font-medium">Observações:</span> {order.notes}
              </div>
            )}

            {/* Botões de ação */}
            {order.status === 'pending' && (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, 'accepted')}
                    disabled={updatingStatus === order.id}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {updatingStatus === order.id ? 'Aceitando...' : 'Aceitar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    disabled={updatingStatus === order.id}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    {updatingStatus === order.id ? 'Cancelando...' : 'Cancelar'}
                  </button>
                </div>
                
                {/* Botões específicos do WhatsApp */}
                <div className="text-xs text-gray-500 text-center">Finalização via WhatsApp:</div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => updateOrderStatusWithNote(order.id, 'delivered', 'Concluído via WhatsApp')}
                    disabled={updatingStatus === order.id}
                    className="flex-1 bg-green-700 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {updatingStatus === order.id ? 'Atualizando...' : '✅ Concluído'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderStatusWithNote(order.id, 'cancelled', 'Não finalizado via WhatsApp')}
                    disabled={updatingStatus === order.id}
                    className="flex-1 bg-orange-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {updatingStatus === order.id ? 'Atualizando...' : '❌ Não Finalizado'}
                  </button>
                </div>
              </div>
            )}

            {order.status === 'accepted' && (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    disabled={updatingStatus === order.id}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    {updatingStatus === order.id ? 'Atualizando...' : 'Preparar'}
                  </button>
                </div>
                
                {/* Botões específicos do WhatsApp */}
                <div className="text-xs text-gray-500 text-center">Finalização via WhatsApp:</div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => updateOrderStatusWithNote(order.id, 'delivered', 'Concluído via WhatsApp')}
                    disabled={updatingStatus === order.id}
                    className="flex-1 bg-green-700 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {updatingStatus === order.id ? 'Atualizando...' : '✅ Concluído'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderStatusWithNote(order.id, 'cancelled', 'Não finalizado via WhatsApp')}
                    disabled={updatingStatus === order.id}
                    className="flex-1 bg-orange-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {updatingStatus === order.id ? 'Atualizando...' : '❌ Não Finalizado'}
                  </button>
                </div>
              </div>
            )}

            {order.status === 'preparing' && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'delivering')}
                  disabled={updatingStatus === order.id}
                  className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  {updatingStatus === order.id ? 'Atualizando...' : 'Sair p/ Entrega'}
                </button>
              </div>
            )}

            {order.status === 'delivering' && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                  disabled={updatingStatus === order.id}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  {updatingStatus === order.id ? 'Atualizando...' : 'Marcar Entregue'}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Mensagem quando não há pedidos hoje */}
      {todayOrders.length === 0 && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum pedido hoje ainda
          </h3>
          <p className="text-gray-500 mb-4">
            Quando chegarem novos pedidos, eles aparecerão aqui automaticamente.
          </p>
          
          {/* Botão para criar pedido */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Venda do Balcão
          </button>
        </div>
      )}

      {/* Link para relatórios */}
      {orders.length > todayOrders.length && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-2">
            Há {orders.length - todayOrders.length} pedidos de dias anteriores
          </p>
        </div>
      )}

      {/* Modal de Criar Pedido */}
      {showCreateModal && (
        <CreateOrderModal
          storeSlug={storeSlug}
          storeId={storeId}
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={(newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
            setShowCreateModal(false);
            toast.success('Pedido criado com sucesso!');
          }}
        />
      )}
    </div>
  );
} 