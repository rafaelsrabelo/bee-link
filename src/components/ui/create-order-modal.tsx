'use client';

import { useState, useEffect } from 'react';
import { Order, OrderItem } from '../../types/order';
import { toast } from 'react-hot-toast';
import { X, Plus, Minus, Search } from 'lucide-react';

interface CreateOrderModalProps {
  storeSlug: string;
  storeId: string;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
}

const orderSources = [
  { value: 'link', label: '🔗 Via Link da Loja' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'presencial', label: '🏪 Presencial' },
  { value: 'telefone', label: '📞 Telefone' },
  { value: 'instagram', label: '📱 Instagram' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'indicacao', label: '👥 Indicação' },
  { value: 'outros', label: '📝 Outros' }
];

export default function CreateOrderModal({ storeSlug, storeId, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    source: 'presencial',
    notes: ''
  });

  // Carregar produtos da loja
  useEffect(() => {
    loadProducts();
  }, [storeSlug]);

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
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
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    if (!formData.customer_phone.trim()) {
      toast.error('Telefone do cliente é obrigatório');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        storeSlug,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        items: orderItems,
        total: getTotal(),
        notes: `Origem: ${orderSources.find(s => s.value === formData.source)?.label || formData.source}${formData.notes ? `\nObservações: ${formData.notes}` : ''}`
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Criar o objeto order para adicionar à lista
        const newOrder: Order = {
          id: result.orderId,
          store_id: storeId,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_address: formData.customer_address,
          items: orderItems,
          total: getTotal(),
          status: 'pending',
          notes: orderData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        onOrderCreated(newOrder);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Criar Pedido Manual
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex h-[calc(90vh-80px)]">
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
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome do cliente"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={formData.customer_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Endereço de entrega (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Origem do Pedido */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Origem do Pedido
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {orderSources.map((source) => (
                    <button
                      key={source.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, source: source.value }))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        formData.source === source.value
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Observações adicionais..."
                />
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar produtos..."
                />
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addProduct(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                  </div>
                )}
              </div>
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
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-gray-600"
                          >
                            <Minus className="w-3 h-3 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-gray-600"
                          >
                            <Plus className="w-3 h-3 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProduct(item.id)}
                            className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded text-red-600"
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
                  <span>R$ {getTotal().toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || orderItems.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando...' : `Criar Pedido (R$ ${getTotal().toFixed(2).replace('.', ',')})`}
          </button>
        </div>
      </div>
    </div>
  );
}