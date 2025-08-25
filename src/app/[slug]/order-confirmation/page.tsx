'use client';

import { ArrowLeft, CheckCircle, MapPin, Package, Phone, Store, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface OrderConfirmationProps {
  params: Promise<{ slug: string }>;
}

interface StoreData {
  store_name: string;
  logo: string;
  colors: {
    primary: string;
    background: string;
    text: string;
    header: string;
  };
  social_networks: {
    whatsapp: string;
  };
}

interface OrderData {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  delivery_type: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

const statusSteps = [
  { id: 'pending', label: 'Pedido Realizado', icon: CheckCircle, color: 'text-green-600' },
  { id: 'accepted', label: 'Pedido Confirmado', icon: CheckCircle, color: 'text-green-600' },
  { id: 'preparing', label: 'Em Preparação', icon: Package, color: 'text-orange-600' },
  { id: 'delivering', label: 'Em Entrega', icon: Package, color: 'text-blue-600' },
  { id: 'delivered', label: 'Entregue', icon: CheckCircle, color: 'text-green-600' }
];

export default function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const [store, setStore] = useState<StoreData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { slug } = use(params);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId && slug) {
      loadOrderData();
    }
  }, [orderId, slug]);

  const loadOrderData = async () => {
    try {
      // Carregar dados da loja
      const storeResponse = await fetch(`/api/stores/${slug}`);
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        setStore(storeData);
      }

      // Carregar dados do pedido
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData);
      } else {
        toast.error('Pedido não encontrado');
        router.push(`/${slug}`);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do pedido');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex(step => step.id === order.status);
  };

  // Função para obter o horário de cada status
  const getStatusTime = (stepId: string) => {
    if (!order) return null;
    
    // Para o primeiro status (pending), usar created_at
    if (stepId === 'pending') {
      return order.created_at;
    }
    
    // Para outros status, usar updated_at se o status atual for maior ou igual
    const currentStepIndex = getCurrentStepIndex();
    const stepIndex = statusSteps.findIndex(step => step.id === stepId);
    
    if (stepIndex <= currentStepIndex) {
      return order.updated_at;
    }
    
    return null;
  };

  // Função para formatar apenas a hora
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const formatPrice = (price: number) => {
    // Detectar se o valor está em centavos ou reais
    let priceInReais = price;
    if (price > 1000) {
      // Provavelmente está em centavos, converter para reais
      priceInReais = price / 100;
    }
    return priceInReais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'money': 'Dinheiro',
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getDeliveryTypeLabel = (type: string) => {
    return type === 'delivery' ? 'Entrega' : 'Retirada';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: store?.colors?.background || '#f8fafc' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: store?.colors?.primary || '#3b82f6' }}></div>
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: store?.colors?.background || '#f8fafc' }}>
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pedido não encontrado</h3>
          <p className="text-gray-600 mb-4">O pedido que você está procurando não existe.</p>
          <button
            onClick={() => router.push(`/${slug}`)}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: store?.colors?.primary || '#3b82f6' }}
          >
            Voltar à loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: store.colors.background }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/${slug}/pedidos`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Detalhes do Pedido
              </h1>
              <p className="text-sm text-gray-500">
                {store.store_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Order ID */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-sm text-gray-600">
              Pedido realizado com sucesso!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Status do Pedido</h3>
          
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= getCurrentStepIndex();
              const isCurrent = index === getCurrentStepIndex();
              const IconComponent = step.icon;
              
              return (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-100 border-2 border-green-200' 
                      : 'bg-gray-100 border-2 border-gray-200'
                  }`}>
                    <IconComponent 
                      className={`w-5 h-5 ${
                        isCompleted 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${
                        isCompleted 
                          ? 'text-gray-900' 
                          : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                      {isCompleted && getStatusTime(step.id) && (
                        <span className="text-xs text-gray-500">
                          {formatTime(getStatusTime(step.id) || '')}
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <p className="text-xs text-gray-500 mt-1">
                        Aguardando confirmação do estabelecimento
                      </p>
                    )}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`w-0.5 h-8 ml-5 ${
                      isCompleted ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Detalhes do Pedido</h3>
          
          {/* Customer Info */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{order.customer_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{order.customer_phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{order.customer_address}</span>
            </div>
          </div>

          {/* Delivery Type */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              {order.delivery_type === 'pickup' ? (
                <Store className="w-5 h-5 text-blue-600" />
              ) : (
                <MapPin className="w-5 h-5 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getDeliveryTypeLabel(order.delivery_type)}
                </p>
                <p className="text-xs text-gray-500">
                  {order.delivery_type === 'pickup' 
                    ? 'Retire seu pedido no estabelecimento' 
                    : 'Entregaremos no endereço informado'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">$</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getPaymentMethodLabel(order.payment_method)}
                </p>
                <p className="text-xs text-gray-500">
                  Forma de pagamento selecionada
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Itens do Pedido</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">{item.quantity}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold" style={{ color: store.colors.primary }}>
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Precisa de ajuda?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Entre em contato conosco se tiver alguma dúvida sobre seu pedido.
          </p>
          <a
            href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Falar no WhatsApp</span>
          </a>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/${slug}/pedidos`)}
            className="w-full px-4 py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: store.colors.primary }}
          >
            Ver Meus Pedidos
          </button>
          <button
            onClick={() => router.push(`/${slug}`)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
} 