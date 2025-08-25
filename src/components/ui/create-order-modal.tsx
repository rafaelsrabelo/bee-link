'use client';

import { Minus, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { fixCorruptedPrice } from '../../lib/price-utils';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  onOrderCreated: (newOrder?: unknown) => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function CreateOrderModal({ 
  isOpen, 
  onClose, 
  storeSlug, 
  onOrderCreated 
}: CreateOrderModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    orderDate: new Date().toISOString().split('T')[0], // Data atual como padrão
    deliveryType: 'pickup',
    address: '',
    paymentMethod: 'credit_card',
    items: [] as Array<{ name: string; price: string; quantity: number }>
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar produtos da loja
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, storeSlug]);

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}/products-public`);
      if (response.ok) {
        const data = await response.json();
        const productsWithCorrectPrice = (data.products || []).map((product: {price: string | number; [key: string]: unknown}) => ({
          ...product,
          price: typeof product.price === 'string' 
            ? fixCorruptedPrice(product.price) / 100 // Converter para reais
            : product.price
        }));
        setProducts(productsWithCorrectPrice);
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setOrderItems(prev => prev.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeProduct = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== productId));
  };

  const getTotal = () => {
    return orderItems.reduce((sum, item) => {
      // Garantir que o preço seja um número válido
      const price = typeof item.price === 'number' ? item.price : 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  const formatPrice = (price: number) => {
    // Detectar se o valor está em centavos ou reais
    let priceInReais = price;
    if (price > 1000) {
      // Provavelmente está em centavos, converter para reais
      priceInReais = price / 100;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(priceInReais);
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryType: 'pickup',
      address: '',
      paymentMethod: 'credit_card',
      items: []
    });
    setOrderItems([]);
    setSearchTerm('');
  };

  // Função para fechar o modal e limpar dados
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        items: orderItems.map(item => ({
          name: item.name,
          price: item.price, // Manter em reais (não converter para centavos)
          quantity: item.quantity
        })),
        delivery_type: formData.deliveryType,
        delivery_address: formData.deliveryType === 'delivery' ? formData.address : '',
        payment_method: formData.paymentMethod,
        total: getTotal(), // Manter em reais (não converter para centavos)
        order_date: formData.orderDate,
        status: 'delivered', // Pedido já finalizado
        isManualOrder: true // Flag para identificar que é do admin
      };

      const response = await fetch(`/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderData,
          storeSlug
        }),
      });

      if (response.ok) {
        toast.success('Pedido criado com sucesso!');
        onOrderCreated();
        onClose();
        // Reset form
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', price: '', quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Criar Pedido Manual
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Criando pedido...</p>
                <p className="text-sm text-gray-500">Aguarde um momento</p>
              </div>
            </div>
          )}
          
          {/* Coluna da Esquerda - Formulário */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <div className="space-y-4">
              {/* Dados do Cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Dados do Cliente
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Nome do cliente"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="(11) 99999-9999"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data do Pedido *
                    </label>
                    <input
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Entrega */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Entrega
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Entrega
                    </label>
                    <select
                      value={formData.deliveryType}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      <option value="pickup">Retirada no estabelecimento</option>
                      <option value="delivery">Entrega</option>
                    </select>
                  </div>

                  {formData.deliveryType === 'delivery' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço de Entrega
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        rows={3}
                        placeholder="Endereço de entrega"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Método de Pagamento */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Pagamento
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pagamento
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Produtos */}
          <div className="w-1/2 flex flex-col">
            {/* Busca de Produtos */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Adicionar Produtos
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Buscar produtos..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="flex-1 overflow-y-auto p-6">
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">Nenhum produto cadastrado</div>
                  <div className="text-xs">Cadastre produtos na seção Produtos</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(searchTerm ? filteredProducts : products).map((product) => {
                    const currentItem = orderItems.find(item => item.id === product.id);
                    const currentQuantity = currentItem?.quantity || 0;
                    
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatPrice(product.price)}
                          </div>
                          {currentQuantity > 0 && (
                            <div className="text-xs text-blue-600 font-medium">
                              {currentQuantity} no pedido
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {currentQuantity > 0 ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, -1)}
                                disabled={loading}
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{currentQuantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, 1)}
                                disabled={loading}
                                className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addProduct(product)}
                              disabled={loading}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {searchTerm && filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum produto encontrado para &quot;{searchTerm}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Carrinho */}
            {orderItems.length > 0 && (
              <div className="border-t p-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Itens do Pedido ({orderItems.length})
                </h4>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.quantity}x {item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={loading}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={loading}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProduct(item.id)}
                            disabled={loading}
                            className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-3 h-3 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {orderItems.length} {orderItems.length === 1 ? 'item' : 'itens'} selecionados
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || orderItems.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>🛍️ Criar Pedido - {formatPrice(getTotal())}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}