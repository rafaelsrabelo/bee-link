'use client';

import { ArrowLeft, Package, Phone, Store, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  status: string;
  source?: string;
  notes?: string;
  created_at: string;
}

interface StoreData {
  store_name: string;
  slug: string;
  logo: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
}

interface PedidosPageProps {
  params: Promise<{ slug: string }>;
}

export default function PedidosPage({ params }: PedidosPageProps) {
  const router = useRouter();
  const { slug } = use(params);
  const [store, setStore] = useState<StoreData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: ''
  });
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [hasAutoLoginAttempted, setHasAutoLoginAttempted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Função para salvar dados do cliente no localStorage
  const saveCustomerData = (name: string, phone: string) => {
    try {
      localStorage.setItem('customerData', JSON.stringify({ name, phone }));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  };

  // Função para carregar dados do cliente do localStorage
  const loadCustomerData = () => {
    try {
      const saved = localStorage.getItem('customerData');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      return null;
    }
  };

  // Buscar dados da loja e carregar dados salvos do cliente
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`/api/stores/${slug}`);
        if (response.ok) {
          const storeData = await response.json();
          setStore(storeData);
        }
      } catch (error) {
        console.error('Erro ao buscar loja:', error);
      }
    };

    fetchStore();

    // Carregar dados salvos do cliente e fazer consulta automática
    const savedData = loadCustomerData();
    if (savedData && savedData.name && savedData.phone) {
      setCustomerData({
        name: savedData.name,
        phone: savedData.phone
      });
      
      // Fazer consulta automática se tiver dados salvos
      setTimeout(() => {
        handleAutoLogin(savedData.name, savedData.phone);
        setHasAutoLoginAttempted(true);
      }, 500); // Pequeno delay para garantir que a loja foi carregada
    } else {
      setHasAutoLoginAttempted(true);
    }
  }, [slug]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setCustomerData({
      ...customerData,
      phone: formatted
    });
  };

  const handleAutoLogin = async (name: string, phone: string) => {
    setAuthenticating(true);
    
    try {
      // Buscar pedidos do cliente
      const response = await fetch(`/api/orders?store_slug=${slug}&customer_phone=${encodeURIComponent(phone)}`);
      
      if (response.ok) {
        const customerOrders = await response.json();
        setOrders(customerOrders);
        setShowLoginForm(false);
        
        // Removido toast desnecessário - não precisa mostrar número de pedidos
      } else {
        toast.error('Erro ao buscar pedidos');
      }
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      toast.error('Erro ao buscar pedidos');
    } finally {
      setAuthenticating(false);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!customerData.name.trim() || !customerData.phone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    setAuthenticating(true);
    
    try {
      // Salvar dados do cliente no localStorage
      saveCustomerData(customerData.name, customerData.phone);
      
      // Buscar pedidos do cliente
      const response = await fetch(`/api/orders?store_slug=${slug}&customer_phone=${encodeURIComponent(customerData.phone)}`);
      
      if (response.ok) {
        const customerOrders = await response.json();
        setOrders(customerOrders);
        setShowLoginForm(false);
        
        // Removido toast desnecessário - não precisa mostrar número de pedidos
      } else {
        toast.error('Erro ao buscar pedidos');
      }
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      toast.error('Erro ao buscar pedidos');
    } finally {
      setAuthenticating(false);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceito';
      case 'preparing': return 'Preparando';
      case 'delivering': return 'Entregando';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Função para filtrar pedidos por status
  const filterOrdersByStatus = (orders: Order[], status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  // Atualizar pedidos filtrados quando orders ou statusFilter mudar
  useEffect(() => {
    setFilteredOrders(filterOrdersByStatus(orders, statusFilter));
  }, [orders, statusFilter]);

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/${slug}`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                {showLoginForm ? 'Meus Pedidos' : `Pedidos de ${customerData.name}`}
              </h1>
              <p className="text-sm text-gray-500">
                {store.store_name}
              </p>
            </div>
            
            {!showLoginForm && (
              <button
                onClick={() => router.push(`/${slug}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <Store className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {!hasAutoLoginAttempted ? (
          /* Loading enquanto tenta login automático */
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando seus pedidos...</p>
          </div>
        ) : showLoginForm ? (
          /* Formulário de Login */
          <div className="p-6">
            <div className="text-center mb-6">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Consulte seus pedidos
              </h2>
              <p className="text-gray-600">
                Digite seu nome e telefone para ver o histórico de pedidos
              </p>


            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Nome *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({
                      ...customerData,
                      name: e.target.value
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite seu nome completo"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Telefone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Botão Consultar */}
            <div className="mt-8">
              <button
                onClick={handleLogin}
                disabled={authenticating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                type="button"
              >
                {authenticating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Consultando...
                  </>
                ) : (
                  'Consultar Pedidos'
                )}
              </button>
            </div>

            {/* Botão para limpar dados salvos */}
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  localStorage.removeItem('customerData');
                  setCustomerData({ name: '', phone: '' });
                  toast.success('Dados salvos removidos!');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
                type="button"
              >
                Limpar dados salvos
              </button>
            </div>
          </div>
        ) : (
          /* Lista de Pedidos */
          <div className="p-4">
            {/* Botão para consultar com outro usuário */}
            <div className="mb-6 text-center">
              <button
                onClick={() => {
                  setShowLoginForm(true);
                  setOrders([]);
                  setLoading(false);
                }}
                className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 underline"
                type="button"
              >
                <User className="w-4 h-4" />
                <span>Consultar com outro usuário</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Carregando pedidos...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Você ainda não fez pedidos nesta loja
                </p>
                <button
                  onClick={() => router.push(`/${store.slug}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  Ver Produtos
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Filtros de Status */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrar por status:</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'all' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Todos ({orders.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Pendentes ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('accepted')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'accepted' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Aceitos ({orders.filter(o => o.status === 'accepted').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('preparing')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'preparing' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Preparando ({orders.filter(o => o.status === 'preparing').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('delivering')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'delivering' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Entregando ({orders.filter(o => o.status === 'delivering').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('delivered')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Entregues ({orders.filter(o => o.status === 'delivered').length})
                    </button>
                  </div>
                </div>

                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${slug}/order-confirmation?orderId=${order.id}`)}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">{item.quantity}x {item.name}</span>
                            <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                          {(item.selectedColor || item.selectedSize) && (
                            <div className="text-xs text-gray-500 ml-4">
                              {item.selectedColor && `Cor: ${item.selectedColor}`}
                              {item.selectedColor && item.selectedSize && ' • '}
                              {item.selectedSize && `Tamanho: ${item.selectedSize}`}
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-sm text-gray-500 text-center py-1">
                          +{order.items.length - 2} mais itens
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <span className="text-xs text-blue-600 font-medium">Clique para ver detalhes</span>
                    </div>
                  </div>
                ))}

                {/* Botão para fazer novo pedido */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => router.push(`/${store.slug}`)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    type="button"
                  >
                    Fazer Novo Pedido
                  </button>
                </div>
              </div>
            )}

            {/* Botão para sair */}
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setShowLoginForm(true);
                  setOrders([]);
                  setCustomerData({ name: '', phone: '' });
                }}
                className="text-gray-600 hover:text-gray-800 text-sm"
                type="button"
              >
                Consultar outro telefone
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}