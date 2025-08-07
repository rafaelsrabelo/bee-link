'use client';

import { CreditCard, MapPin, ShoppingBag, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCartStore } from '../../../stores/cartStore';

interface SummaryStepProps {
  customerData: {
    name: string;
    phone: string;
  };
  deliveryData: {
    type: string;
    cep: string;
    address: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  paymentData: {
    method: string;
  };
  cart: Array<{
    name: string;
    price: string;
    quantity: number;
    image?: string;
  }>;
  store: {
    id: string;
    store_name: string;
    slug: string;
    colors?: {
      primary: string;
    };
    social_networks?: {
      whatsapp?: string;
    };
  } | null;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export default function SummaryStep({
  customerData,
  deliveryData,
  paymentData,
  cart,
  store,
  onBack,
  // currentStep,
  // totalSteps
}: SummaryStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clearCart } = useCartStore();

  // Calcular total
  const total = cart.reduce((sum, item) => {
    const price = Number.parseFloat(item.price.replace('R$', '').replace(',', '.').trim());
    return sum + (price * item.quantity);
  }, 0);

  // Mapear nomes de pagamento
  const paymentMethodNames: {[key: string]: string} = {
    money: 'Dinheiro',
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito'
  };

  
  const handleFinalize = async () => {
    if (!store) {
      toast.error('Dados da loja não encontrados');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Finalizando pedido...');
    
    try {

      // 1. Preparar dados para API existente
      const orderItems = cart.map(item => {
        const priceNumber = Number.parseFloat(item.price.replace('R$', '').replace(',', '.').trim());
        return {
          id: item.name.toLowerCase().replace(/\s+/g, '-'),
          name: item.name,
          price: priceNumber, // API espera number, não string
          quantity: item.quantity,
          image: item.image
        };
      });

      const existingApiData = {
        storeSlug: store.slug,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_address: deliveryData.type === 'delivery' 
          ? `${deliveryData.address}, ${deliveryData.number}${deliveryData.complement ? `, ${deliveryData.complement}` : ''} - ${deliveryData.neighborhood}, ${deliveryData.city}/${deliveryData.state} - CEP: ${deliveryData.cep}`
          : 'Retirada no estabelecimento',
        items: orderItems,
        total,
        source: 'checkout',
        notes: `Forma de pagamento: ${paymentMethodNames[paymentData.method]}${deliveryData.type === 'pickup' ? ' | Retirada no estabelecimento' : ''}`,
        // Novas informações estruturadas
        delivery_type: deliveryData.type,
        delivery_cep: deliveryData.type === 'delivery' ? deliveryData.cep : undefined,
        delivery_city: deliveryData.type === 'delivery' ? deliveryData.city : undefined,
        delivery_state: deliveryData.type === 'delivery' ? deliveryData.state : undefined,
        payment_method: paymentData.method
      };

      // 4. Criar pedido na API existente
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(existingApiData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Erro ao criar pedido');
      }

      const result = await orderResponse.json();
      
      // Sucesso - remover loading toast
      toast.success('Pedido criado com sucesso!', { id: loadingToast });

      // 4. Gerar mensagem do WhatsApp
      const itemsList = cart.map(item => 
        `• ${item.quantity}x ${item.name} - R$ ${item.price}`
      ).join('\n');

      const deliveryInfo = deliveryData.type === 'delivery' 
        ? `📍 *Entrega:*\n${deliveryData.address}, ${deliveryData.number}${deliveryData.complement ? `, ${deliveryData.complement}` : ''}\n${deliveryData.neighborhood} - ${deliveryData.city}/${deliveryData.state}\nCEP: ${deliveryData.cep}`
        : '🏪 *Retirada:* No estabelecimento';

      const message = `🛒 *NOVO PEDIDO* #${result.orderId?.slice(0, 8) || 'NOVO'}

👤 *Cliente:* ${customerData.name}
📱 *Telefone:* ${customerData.phone}

📦 *Itens:*
${itemsList}

${deliveryInfo}

💳 *Pagamento:* ${paymentMethodNames[paymentData.method]}

💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*

---
Pedido feito pelo site 🐝 Bee Link`;

      // 5. Abrir WhatsApp IMEDIATAMENTE (antes do setTimeout para evitar bloqueio de pop-up)
      const whatsappNumber = store.social_networks?.whatsapp?.replace(/\D/g, '') || '5511999999999';
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Em produção, sempre mostrar o toast com link clicável para evitar problemas de pop-up
      toast.success(
        <div>
          <p>✅ Pedido criado com sucesso!</p>
          <p className="mt-2">Clique no botão abaixo para abrir o WhatsApp:</p>
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            📱 Abrir WhatsApp
          </a>
        </div>,
        { 
          id: loadingToast,
          duration: 15000 // 15 segundos para dar tempo de clicar
        }
      );

      // 6. Limpar carrinho e redirecionar para a página de confirmação do pedido
      setTimeout(() => {
        try {
          // Limpar carrinho usando o store
          clearCart();
          
          // Também limpar localStorage para garantir
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cart');
            localStorage.removeItem('cart-storage'); // Limpar também o storage do Zustand
            // Disparar evento para atualizar o carrinho em outras páginas
            window.dispatchEvent(new CustomEvent('cartCleared'));
          }
        } catch (error) {
          console.error('Erro ao limpar carrinho:', error);
          // Mesmo com erro, continuar com o redirecionamento
        }
        
        window.location.href = `/${store.slug}/order-confirmation?orderId=${result.orderId}`;
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      // Não mostrar erro técnico do Next.js, apenas mensagem amigável
      toast.error('Erro ao finalizar pedido. Tente novamente.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Resumo do Pedido
        </h2>
        <p className="text-gray-600">
          Confira todos os dados antes de finalizar
        </p>
      </div>

      {/* Dados do Cliente */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <User className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Seus Dados</h3>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Nome:</span> {customerData.name}</p>
          <p><span className="font-medium">Telefone:</span> {customerData.phone}</p>
        </div>
      </div>

      {/* Entrega */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <MapPin className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Entrega</h3>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          {deliveryData.type === 'delivery' ? (
            <>
              <p><span className="font-medium">Tipo:</span> Entrega</p>
              <p><span className="font-medium">Endereço:</span> {deliveryData.address}, {deliveryData.number}</p>
              {deliveryData.complement && (
                <p><span className="font-medium">Complemento:</span> {deliveryData.complement}</p>
              )}
              <p><span className="font-medium">Bairro:</span> {deliveryData.neighborhood}</p>
              <p><span className="font-medium">Cidade:</span> {deliveryData.city}/{deliveryData.state}</p>
              <p><span className="font-medium">CEP:</span> {deliveryData.cep}</p>
            </>
          ) : (
            <p><span className="font-medium">Tipo:</span> Retirada no estabelecimento</p>
          )}
        </div>
      </div>

      {/* Pagamento */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <CreditCard className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Pagamento</h3>
        </div>
        <div className="text-sm text-gray-600">
          <p><span className="font-medium">Forma:</span> {paymentMethodNames[paymentData.method]}</p>
        </div>
      </div>

      {/* Itens do Pedido */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <ShoppingBag className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Itens do Pedido</h3>
        </div>
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={`${item.name}-${item.quantity}`} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">
                  {item.quantity}x R$ {item.price}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  R$ {(Number.parseFloat(item.price.replace('R$', '').replace(',', '.').trim()) * item.quantity).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-green-600">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleFinalize}
          disabled={isSubmitting}
          className="flex-1 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
          style={{ backgroundColor: store?.colors?.primary || '#16a34a' }}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Finalizando...
            </>
          ) : (
            'Finalizar Pedido'
          )}
        </button>
      </div>
    </div>
  );
}