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
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { usePendingOrdersStore } from '../../stores/pendingOrdersStore';
import type { Order } from '../../types/order';
import CreateOrderModal from './create-order-modal';

interface OrderDetailsPanelProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdateStatusWithNote: (orderId: string, newStatus: Order['status'], note: string) => void;
  updatingStatus: string | null;
  formatDate: (dateString: string) => string;
  formatPrice: (price: number) => string;
}

function OrderDetailsPanel({ 
  order, 
  onUpdateStatus, 
  onUpdateStatusWithNote, 
  updatingStatus, 
  formatDate, 
  formatPrice 
}: OrderDetailsPanelProps) {
  const statusInfo = statusConfig[order.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header do Pedido */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </h2>
              {order.notes && (
                <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Com observações</span>
                </div>
              )}
            </div>
            <p className="text-gray-600">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <div className={`flex items-center space-x-2 mb-2 ${statusInfo.color}`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-semibold">{statusInfo.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(order.total)}
            </p>
          </div>
        </div>

        {/* Botões de Ação Principais - Visíveis no Header */}
        {order.status === 'pending' && (
          <div className="flex space-x-3 mt-4">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'accepted')}
              disabled={updatingStatus === order.id}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{updatingStatus === order.id ? 'Aceitando...' : 'Aceitar'}</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              disabled={updatingStatus === order.id}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{updatingStatus === order.id ? 'Cancelando...' : 'Cancelar'}</span>
            </button>
          </div>
        )}

        {order.status === 'accepted' && (
          <div className="flex space-x-3 mt-4">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              disabled={updatingStatus === order.id}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <ChefHat className="w-4 h-4" />
              <span>{updatingStatus === order.id ? 'Preparando...' : 'Preparar'}</span>
            </button>
          </div>
        )}

        {order.status === 'preparing' && (
          <div className="flex space-x-3 mt-4">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'delivering')}
              disabled={updatingStatus === order.id}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>{updatingStatus === order.id ? 'Enviando...' : 'Sair p/ Entrega'}</span>
            </button>
          </div>
        )}

        {order.status === 'delivering' && (
          <div className="flex space-x-3 mt-4">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'delivered')}
              disabled={updatingStatus === order.id}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>{updatingStatus === order.id ? 'Finalizando...' : 'Marcar Entregue'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Scrollável */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Informações do Cliente */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Cliente</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold text-gray-900">{order.customer_phone}</p>
                  </div>
                </div>
                {order.customer_address && (
                  <div className="md:col-span-2 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Endereço</p>
                      <p className="font-semibold text-gray-900">{order.customer_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detalhes de Entrega e Pagamento */}
          {(order.delivery_type || order.payment_method) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalhes do Pedido</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {order.delivery_type && (
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Entrega</p>
                      <p className="font-semibold text-gray-900">
                        {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                        {order.delivery_type === 'delivery' && order.delivery_city && (
                          <span> - {`${order.delivery_city}/${order.delivery_state}`}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {order.payment_method && (
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Forma de Pagamento</p>
                      <p className="font-semibold text-gray-900">
                        {order.payment_method === 'money' && 'Dinheiro'}
                        {order.payment_method === 'pix' && 'PIX'}
                        {order.payment_method === 'credit_card' && 'Cartão de Crédito'}
                        {order.payment_method === 'debit_card' && 'Cartão de Débito'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Itens do Pedido */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={`item-${order.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Preço unitário: {formatPrice(item.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          {order.notes && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <MessageCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Observações do Cliente</h3>
              </div>
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-amber-900 font-medium leading-relaxed">{order.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer com Ações Especiais do WhatsApp */}
      {(order.status === 'pending' || order.status === 'accepted') && (
        <div className="p-4 border-t bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Finalização Rápida via WhatsApp:</p>
            <div className="flex space-x-3 justify-center">
              <button
                type="button"
                onClick={() => onUpdateStatusWithNote(order.id, 'delivered', 'Concluído via WhatsApp')}
                disabled={updatingStatus === order.id}
                className="flex items-center space-x-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{updatingStatus === order.id ? 'Concluindo...' : 'Marcar Concluído'}</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatusWithNote(order.id, 'cancelled', 'Não finalizado via WhatsApp')}
                disabled={updatingStatus === order.id}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{updatingStatus === order.id ? 'Cancelando...' : 'Não Finalizado'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {(order.status === 'delivered' || order.status === 'cancelled') && (
        <div className="p-4 border-t bg-gray-50">
          <div className="text-center">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
              order.status === 'delivered' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-medium">
                Pedido {order.status === 'delivered' ? 'entregue com sucesso' : 'foi cancelado'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'polling' | 'error'>('connecting');
  const [forceUpdate, setForceUpdate] = useState(0); // Força re-render quando necessário
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Store para salvar pedidos em aberto
  const { setPendingCount, incrementCount, decrementCount } = usePendingOrdersStore();
  

  


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

  // Função para filtrar pedidos por status
  const filterOrdersByStatus = (orders: Order[], status: string) => {
    if (status === 'all') return orders;
    if (status === 'pending') return orders.filter(order => ['pending', 'accepted', 'preparing'].includes(order.status));
    return orders.filter(order => order.status === status);
  };

  // Pedidos filtrados
  const filteredOrders = filterOrdersByStatus(todayOrders, statusFilter);



  // Carregar pedidos iniciais (otimizado - apenas de hoje)
  const loadOrders = React.useCallback(async () => {
    try {
  
      
      // Carregar apenas pedidos de hoje para melhor performance
      const response = await fetch(`/api/stores/${storeSlug}/orders?onlyToday=true&limit=50`);
      
      if (response.ok) {
        const data = await response.json();

        setOrders(data.orders || []);
        
        // Marcar que o carregamento inicial foi concluído
        setIsInitialLoad(false);
        
        // Salvar no store o valor de pedidos em aberto
        const pendingCount = (data.orders || []).filter((order: Order) => 
          ['pending', 'accepted', 'preparing'].includes(order.status)
        ).length;
        setPendingCount(pendingCount);
      } else {
        toast.error(`Erro ao carregar pedidos: ${response.status}`);
      }
    } catch (error) {
      // Verificar se é erro de rede
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        toast.error('Erro ao carregar pedidos');
      }
    } finally {
      setLoading(false);
    }
  }, [storeSlug, setPendingCount]);

  // Configurar sistema de notificações em tempo real
  useEffect(() => {
    if (!storeId) {
      return;
    }

    // Carregar pedidos iniciais
    loadOrders();

    let pollingInterval: NodeJS.Timeout;

    // Usar apenas polling para evitar conflitos com outros canais Realtime
    const startPolling = () => {
      setConnectionStatus('polling');
      
      pollingInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/stores/${storeSlug}/orders?onlyToday=true&limit=50`);
          if (response.ok) {
            const data = await response.json();
            const newOrders = data.orders || [];
            
            // Verificar se há novos pedidos
            const currentIds = new Set(orders.map(o => o.id));
            const newOrdersToAdd = newOrders.filter((o: Order) => !currentIds.has(o.id));
            
            if (newOrdersToAdd.length > 0 && !isInitialLoad) {
              // Chamar som imediatamente
              playNotificationSound();
              
              // Tentar novamente após 1 segundo
              setTimeout(() => {
                playNotificationSound();
              }, 1000);
              
              // Tentar uma terceira vez após 2 segundos
              setTimeout(() => {
                playNotificationSound();
              }, 2000);
              
              // Mostrar toast para cada novo pedido (fora do setState)
              for (const order of newOrdersToAdd) {
                toast.success(`🔔 Novo pedido de ${order.customer_name}!`, {
                  duration: 5000,
                  icon: '🛒'
                });
              }
              
              // Incrementar contador no store
              incrementCount();
              
              // Atualizar lista (evitar duplicatas)
              setOrders(prev => {
                const existingIds = new Set(prev.map((o: Order) => o.id));
                const uniqueNewOrders = newOrdersToAdd.filter((o: Order) => !existingIds.has(o.id));
                return [...uniqueNewOrders, ...prev];
              });
            } else {
              // Apenas atualizar se não há novos pedidos
              setOrders(newOrders);
            }
          }
        } catch (error) {
          // Erro no polling
        }
      }, 2000); // Polling a cada 2 segundos (mais rápido)
    };

    // Iniciar polling imediatamente
    startPolling();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [storeSlug, storeId, loadOrders, incrementCount, orders, isInitialLoad]);

  // Função para marcar notificação como lida
  const markNotificationAsRead = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notification_read: true })
        .eq('id', orderId);

      if (error) throw error;
    } catch (err) {
      // Erro ao marcar notificação como lida
    }
  };

    // Função para tocar som de notificação
  const playNotificationSound = () => {
    // TOAST GARANTIDO (sempre funciona)
    toast.success('🔔🔔🔔 NOVO PEDIDO CHEGOU! 🔔🔔🔔', {
      duration: 3000,
      icon: '🛒'
    });
    
    // Som com múltiplas tentativas
    const playBeep = () => {
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
      } catch (error) {
        // Erro no som
      }
    };
    
    // Tentar tocar o som imediatamente
    playBeep();
    
    // Tentar novamente após um pequeno delay (para casos onde o contexto está suspenso)
    setTimeout(playBeep, 100);
    setTimeout(playBeep, 500);
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
          notes: `${currentOrder.notes ? `${currentOrder.notes}\n` : ''}${note}` 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Status atualizado e cliente notificado via WhatsApp!', {
          duration: 4000,
          icon: '✅'
        });
        
        // Atualizar localmente imediatamente
        const updatedOrder = { 
          ...currentOrder, 
          status: newStatus,
          notes: `${currentOrder.notes ? `${currentOrder.notes}\n` : ''}${note}`
        };
        
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId ? updatedOrder : order
          )
        );
        
        // Atualizar selectedOrder se for o mesmo pedido
        setSelectedOrder(prev => 
          prev?.id === orderId ? updatedOrder : prev
        );
        
        // Forçar re-render para atualizar estatísticas
        setForceUpdate(prev => prev + 1);
        

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
        const result = await response.json();

        
        toast.success('Status atualizado e cliente notificado via WhatsApp!', {
          duration: 4000,
          icon: '✅'
        });
        
        // Atualizar localmente imediatamente
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Atualizar selectedOrder se for o mesmo pedido
        setSelectedOrder(prev => 
          prev?.id === orderId ? { ...prev, status: newStatus } : prev
        );
        
        // Forçar re-render para atualizar estatísticas
        setForceUpdate(prev => prev + 1);
        

      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
        
        let errorData: { error?: string } = {};
        try {
          errorData = await response.json();
          console.error('❌ Dados do erro:', errorData);
        } catch (jsonError) {
          console.error('❌ Erro ao ler JSON da resposta:', jsonError);
          errorData = { error: 'Erro ao processar resposta da API' };
        }
        
        toast.error(`Erro ao atualizar status: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
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
            <div className="bg-gray-200 h-32 rounded-lg" />
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
            type="button"
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
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header principal */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Gerenciar Pedidos
        </h2>
            
            {/* Indicador de conexão */}
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
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

                  <div className={`${stats.pending > 0 ? 'bg-gradient-to-r from-orange-100 to-red-50 border-2 border-orange-300 shadow-lg' : 'bg-orange-50 border border-orange-200'} rounded-lg p-4 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-orange-600">Em Aberto</p>
                  {stats.pending > 0 && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <p className={`text-2xl font-bold ${stats.pending > 0 ? 'text-red-700' : 'text-orange-900'}`}>
                  {stats.pending}
                </p>
                {stats.pending > 0 && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    {stats.pending === 1 ? 'PEDIDO AGUARDANDO' : 'PEDIDOS AGUARDANDO'}
                  </p>
                )}
              </div>
              <div className={`${stats.pending > 0 ? 'bg-red-100' : 'bg-orange-100'} p-2 rounded-lg`}>
                <Clock className={`w-5 h-5 ${stats.pending > 0 ? 'text-red-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </div>

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
      </div>

      {/* Layout Horizontal - Lista + Detalhes */}
      <div className="grid grid-cols-12 gap-6" style={{ height: 'calc(100vh - 400px)' }}>
        {/* Lista de Pedidos - Lado Esquerdo */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Header da Lista */}
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Pedidos</h3>
                <span className="text-sm text-gray-500">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>

              {/* Filtros */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  Todos ({todayOrders.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'pending' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  Em Aberto ({stats.pending})
                </button>
                <button
                  onClick={() => setStatusFilter('delivered')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'delivered' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  Entregues ({stats.delivered})
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'cancelled' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  Cancelados ({stats.cancelled})
                </button>
              </div>
            </div>

            {/* Lista Scrollável de Pedidos - Altura fixa com scroll independente */}
            <div className="overflow-hidden" style={{ height: 'calc(6 * 120px + 1rem)' }}>
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                    <p className="text-gray-600">Carregando...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 px-6">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {statusFilter === 'all' 
                      ? 'Nenhum pedido hoje ainda' 
                      : `Nenhum pedido ${statusFilter === 'pending' ? 'em aberto' : statusFilter === 'delivered' ? 'entregue' : 'cancelado'}`
                    }
                  </p>
                  {statusFilter === 'all' && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      type="button"
                    >
                      Criar Pedido
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-1 p-2">
                    {filteredOrders.map((order) => {
                      const statusInfo = statusConfig[order.status];
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedOrder(order);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedOrder?.id === order.id
                              ? 'bg-blue-50 border-2 border-blue-200'
                              : order.status === 'pending'
                              ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 shadow-md hover:shadow-lg'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </h4>
                                {order.notes && (
                                  <div className="flex items-center space-x-1 text-amber-600" title="Pedido com observações">
                                    <MessageCircle className="w-3 h-3" />
                                    <span className="text-xs font-medium">Obs</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{order.customer_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`flex items-center space-x-1 mb-1 ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                <span className="text-xs font-medium">{statusInfo.label}</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900">
                                {formatPrice(order.total)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                          </div>
                          
                          {order.status === 'pending' && (
                            <div className="mt-2 flex items-center space-x-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                              <span className="text-orange-700 text-xs font-semibold">AGUARDANDO APROVAÇÃO</span>
                            </div>
                          )}
                          
                          {selectedOrder?.id === order.id && (
                            <div className="mt-2">
                              <span className="text-blue-600 text-xs font-medium">Selecionado</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalhes do Pedido - Lado Direito */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
            {!selectedOrder ? (
              <div className="p-8">
                <div className="text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">
                    Selecione um pedido
                  </h3>
                  <p className="text-gray-400">
                    Clique em um pedido da lista ao lado para gerenciar
                  </p>
                </div>
              </div>
            ) : (
              <OrderDetailsPanel 
                order={selectedOrder} 
                onUpdateStatus={updateOrderStatus}
                onUpdateStatusWithNote={updateOrderStatusWithNote}
                updatingStatus={updatingStatus}
                formatDate={formatDate}
                formatPrice={formatPrice}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criar Pedido */}
      {showCreateModal && (
        <CreateOrderModal
          storeSlug={storeSlug}
          storeId={storeId}
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={(newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
            setShowCreateModal(false);
            setSelectedOrder(newOrder);
            toast.success('Pedido criado com sucesso!');
          }}
        />
      )}
    </div>
  );
} 