'use client';

import CouponCard from '@/components/store/coupon-card';
import PriceWithDiscount from '@/components/ui/price-with-discount';
import { AlertCircle, CreditCard, MapPin, ShoppingBag, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
    selectedColor?: string | null;
    selectedSize?: string | null;
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
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponCode: string;
    calculated_discount: number;
  } | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number>(0);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryPossible, setDeliveryPossible] = useState<boolean>(true);
  const [deliveryCalculated, setDeliveryCalculated] = useState<boolean>(false);
  const { clearCart } = useCartStore();

  // Calcular total
  const subtotal = cart.reduce((sum, item) => {
    // Garantir que price seja uma string antes de usar replace
    const priceString = typeof item.price === 'string' ? item.price : String(item.price);
    const price = Number.parseFloat(priceString.replace('R$', '').replace(',', '.').trim());
    
    return sum + (price * item.quantity);
  }, 0);

  // Calcular total com desconto e taxa de entrega
  const totalWithDiscount = appliedCoupon ? subtotal - appliedCoupon.calculated_discount : subtotal;
  const total = totalWithDiscount + deliveryFee;

  // Função para calcular taxa de entrega
  const calculateDeliveryFee = useCallback(async () => {
    if (deliveryData.type !== 'delivery' || !store?.slug) {
      setDeliveryFee(0);
      setDeliveryDistance(0);
      setDeliveryError(null);
      setDeliveryPossible(true);
      setDeliveryCalculated(true);
      setIsCalculatingDelivery(false);
      return;
    }

    setIsCalculatingDelivery(true);
    setDeliveryError(null);
    setDeliveryCalculated(false);
    
    try {
      // Montar endereço completo do cliente
      const customerAddress = `${deliveryData.address}, ${deliveryData.number}, ${deliveryData.neighborhood}, ${deliveryData.city}/${deliveryData.state}, ${deliveryData.cep}`;

      const response = await fetch(`/api/stores/${store.slug}/calculate-delivery-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_address: customerAddress,
          order_total: totalWithDiscount,
          subtotal: subtotal, // Enviar subtotal original para cálculo correto do frete grátis
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryFee(data.delivery_fee || 0);
        setDeliveryDistance(data.distance_km || 0);
        setDeliveryPossible(data.delivery_possible || false);
        setDeliveryCalculated(true);
        
        // Se a entrega não for possível, mostrar erro
        if (!data.delivery_possible) {
          setDeliveryError(data.reason || 'Entrega não disponível para este endereço');
        }
      } else {
        const data = await response.json();
        console.error('Erro ao calcular taxa de entrega:', data.error);
        setDeliveryError(data.error || 'Erro ao calcular taxa de entrega');
        setDeliveryFee(0);
        setDeliveryDistance(0);
        setDeliveryPossible(false);
        setDeliveryCalculated(true);
      }
    } catch (error) {
      console.error('Erro ao calcular taxa de entrega:', error);
      setDeliveryError('Erro ao conectar com o servidor. Tente novamente.');
      setDeliveryFee(0);
      setDeliveryDistance(0);
      setDeliveryPossible(false);
      setDeliveryCalculated(true);
    } finally {
      setIsCalculatingDelivery(false);
    }
  }, [deliveryData, store?.slug, totalWithDiscount, subtotal]);

  // Calcular taxa de entrega quando o componente montar ou quando mudar o tipo de entrega
  useEffect(() => {
    calculateDeliveryFee();
  }, [calculateDeliveryFee]);

  // Função para lidar com cupom aplicado
  const handleCouponApplied = (couponData: {
    is_valid: boolean;
    code?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    calculated_discount?: number;
    message: string;
    couponCode?: string;
  }) => {
    if (couponData.is_valid && couponData.couponCode && couponData.calculated_discount) {
      setAppliedCoupon({
        couponCode: couponData.couponCode,
        calculated_discount: couponData.calculated_discount
      });
    }
  };

  // Função para remover cupom
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success('Cupom removido');
  };

  // Mapear nomes de pagamento
  const paymentMethodNames: {[key: string]: string} = {
    money: 'Dinheiro',
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito'
  };

  // Verificar se pode finalizar o pedido
  const canFinalizeOrder = () => {
    // Se for retirada, sempre pode finalizar
    if (deliveryData.type === 'pickup') {
      return true;
    }
    
    // Se for entrega, verificar se foi calculada e é possível
    if (deliveryData.type === 'delivery') {
      return deliveryCalculated && deliveryPossible && !deliveryError;
    }
    
    return false;
  };

  // Função para tentar recalcular entrega
  const retryDeliveryCalculation = () => {
    if (deliveryData.type === 'delivery') {
      calculateDeliveryFee();
    }
  };
  
  const handleFinalize = async () => {
    // Validação adicional antes de finalizar
    if (deliveryData.type === 'delivery' && (!deliveryCalculated || !deliveryPossible)) {
      toast.error('Não é possível finalizar o pedido. Verifique as informações de entrega.');
      return;
    }

    if (!store) {
      toast.error('Dados da loja não encontrados');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Finalizando pedido...');
    
    try {

      // 1. Preparar dados para API existente
      const orderItems = cart.map(item => {
        // Garantir que price seja uma string antes de usar replace
        const priceString = typeof item.price === 'string' ? item.price : String(item.price);
        const priceNumber = Number.parseFloat(priceString.replace('R$', '').replace(',', '.').trim());
        return {
          id: item.name.toLowerCase().replace(/\s+/g, '-'),
          name: item.name,
          price: priceNumber, // API espera number, não string
          quantity: item.quantity,
          image: item.image,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize
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
        subtotal,
        delivery_fee: deliveryData.type === 'delivery' ? deliveryFee : 0,
        delivery_distance_km: deliveryData.type === 'delivery' ? deliveryDistance : 0,
        coupon_code: appliedCoupon?.couponCode || null,
        coupon_discount: appliedCoupon?.calculated_discount || 0,
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
      
      // Registrar uso do cupom se aplicado
      if (appliedCoupon) {
        try {
          await fetch(`/api/stores/${store.slug}/register-coupon-usage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coupon_code: appliedCoupon.couponCode,
              order_id: result.orderId // Associar ao pedido criado
            }),
          });
        } catch{
        }
      }
      
      // Sucesso - remover loading toast
      toast.success('Pedido criado com sucesso!', { id: loadingToast });

      // 4. Gerar mensagem do WhatsApp
      const itemsList = cart.map(item => {
        let itemName = `${item.quantity}x ${item.name}`;
        
        // Adicionar cor e tamanho se especificados
        const attributes = [];
        if (item.selectedColor) attributes.push(`Cor: ${item.selectedColor}`);
        if (item.selectedSize) attributes.push(`Tamanho: ${item.selectedSize}`);
        
        if (attributes.length > 0) {
          itemName += ` (${attributes.join(', ')})`;
        }
        
        return `• ${itemName} - R$ ${item.price}`;
      }).join('\n');

      const deliveryInfo = deliveryData.type === 'delivery' 
        ? `📍 *Entrega:*\n${deliveryData.address}, ${deliveryData.number}${deliveryData.complement ? `, ${deliveryData.complement}` : ''}\n${deliveryData.neighborhood} - ${deliveryData.city}/${deliveryData.state}\nCEP: ${deliveryData.cep}`
        : '🏪 *Retirada:* No estabelecimento';

      // Preparar informações de desconto e entrega
      const discountInfo = appliedCoupon 
        ? `\n🎫 *Desconto (${appliedCoupon.couponCode}):* - R$ ${appliedCoupon.calculated_discount.toFixed(2).replace('.', ',')}`
        : '';
      
      const deliveryFeeInfo = deliveryData.type === 'delivery' && deliveryFee > 0
        ? `\n🚚 *Taxa de Entrega (${deliveryDistance.toFixed(1)}km):* + R$ ${deliveryFee.toFixed(2).replace('.', ',')}`
        : '';

      const message = `🛒 *NOVO PEDIDO* #${result.orderId?.slice(0, 8) || 'NOVO'}

👤 *Cliente:* ${customerData.name}
📱 *Telefone:* ${customerData.phone}

📦 *Itens:*
${itemsList}

${deliveryInfo}

💳 *Pagamento:* ${paymentMethodNames[paymentData.method]}

💰 *Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}*${discountInfo}${deliveryFeeInfo}

💵 *Total Final: R$ ${total.toFixed(2).replace('.', ',')}*

---
Pedido feito pelo site 🐝 Bee Link`;

      // 5. Redirecionar automaticamente para WhatsApp
      const whatsappNumber = store.social_networks?.whatsapp?.replace(/\D/g, '') || '5511999999999';
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Redirecionar diretamente para o WhatsApp
      window.location.href = whatsappUrl;

      // 6. Limpar carrinho antes do redirecionamento
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
      
      // O redirecionamento para WhatsApp já foi feito acima
      // Após o usuário sair do WhatsApp, ele pode voltar para a página de confirmação
      // usando o botão "Voltar" do navegador ou acessando diretamente:
      // /${store.slug}/order-confirmation?orderId=${result.orderId}
      
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
          {cart.map((item, index) => (
            <div key={`${item.name}-${item.selectedColor || 'no-color'}-${item.selectedSize || 'no-size'}-${index}`} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                {(item.selectedColor || item.selectedSize) && (
                  <p className="text-xs text-gray-500">
                    {item.selectedColor && `Cor: ${item.selectedColor}`}
                    {item.selectedColor && item.selectedSize && ' • '}
                    {item.selectedSize && `Tamanho: ${item.selectedSize}`}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {item.quantity}x R$ {item.price}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  R$ {(Number.parseFloat((typeof item.price === 'string' ? item.price : String(item.price)).replace('R$', '').replace(',', '.').trim()) * item.quantity).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Cupom */}
        <div className="border-t pt-3 mt-3">
          <CouponCard
            storeSlug={store?.slug || ''}
            orderValue={subtotal}
            appliedCoupon={appliedCoupon}
            onCouponApplied={handleCouponApplied}
            onRemoveCoupon={handleRemoveCoupon}
          />
        </div>
        
        {/* Total */}
        <div className="border-t pt-3 mt-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm text-gray-600">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Desconto ({appliedCoupon.couponCode}):</span>
                <span className="text-sm">- R$ {appliedCoupon.calculated_discount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            
            {deliveryData.type === 'delivery' && (
              <div className="flex justify-between items-center text-blue-600">
                <span className="text-sm">Taxa de Entrega:</span>
                {isCalculatingDelivery ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                    <span className="text-sm">Calculando...</span>
                  </div>
                ) : deliveryFee > 0 ? (
                  <span className="text-sm">+ R$ {deliveryFee.toFixed(2).replace('.', ',')} ({deliveryDistance.toFixed(1)}km)</span>
                ) : (
                  <span className="text-sm">Grátis</span>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de erro de entrega */}
      {deliveryData.type === 'delivery' && deliveryError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                {deliveryDistance > 0 ? 'Endereço fora da área de entrega' : 'Problema com a entrega'}
              </h4>
              <p className="text-sm text-red-700 mb-3">
                {deliveryDistance > 0 
                  ? `${deliveryError} (Distância: ${deliveryDistance.toFixed(1)}km)`
                  : deliveryError
                }
              </p>
              <button
                type="button"
                onClick={retryDeliveryCalculation}
                disabled={isCalculatingDelivery}
                className="text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                {isCalculatingDelivery ? 'Tentando novamente...' : 'Tentar novamente'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          disabled={isSubmitting || !canFinalizeOrder()}
          className="flex-1 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

      {/* Mensagem explicativa quando botão está desabilitado */}
      {deliveryData.type === 'delivery' && !canFinalizeOrder() && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 text-center">
            {!deliveryCalculated 
              ? 'Aguardando cálculo da distância...' 
              : !deliveryPossible 
                ? 'Endereço fora da área de entrega' 
                : 'Verifique as informações de entrega'
            }
          </p>
        </div>
      )}
    </div>
  );
}