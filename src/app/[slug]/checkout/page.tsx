'use client';

import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import CustomerInfoStep from './steps/customer-info';
import DeliveryStep from './steps/delivery';
import PaymentStep from './steps/payment';
import SummaryStep from './steps/summary';

interface StoreData {
  id: string;
  store_name: string;
  slug: string;
  logo: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  social_networks: {
    whatsapp: string;
  };
}

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter();
  const { cart, setStoreSlug } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [store, setStore] = useState<StoreData | null>(null);
  
  // Unwrap params usando React.use()
  const resolvedParams = use(params);
  
  // Buscar dados da loja e definir storeSlug
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`/api/stores/${resolvedParams.slug}`);
        if (response.ok) {
          const storeData = await response.json();
          setStore(storeData);
          setStoreSlug(resolvedParams.slug);
        }
      } catch (error) {
        console.error('Erro ao buscar loja:', error);
      }
    };

    fetchStore();
  }, [resolvedParams.slug, setStoreSlug]);
  
  // Dados do checkout
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: ''
  });
  
  const [deliveryData, setDeliveryData] = useState({
    type: '', // 'delivery' ou 'pickup'
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    method: '' // 'money', 'credit_card', 'debit_card', 'pix'
  });

  // Se não há itens no carrinho, redirecionar
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Carrinho Vazio
          </h2>
          <p className="text-gray-600 mb-4">
            Adicione produtos ao carrinho antes de finalizar o pedido.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar às Compras
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Seus Dados', component: CustomerInfoStep },
    { number: 2, title: 'Entrega', component: DeliveryStep },
    { number: 3, title: 'Pagamento', component: PaymentStep },
    { number: 4, title: 'Resumo', component: SummaryStep }
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  router.back();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Finalizar Pedido
              </h1>
              <p className="text-sm text-gray-500">
                Passo {currentStep} de {steps.length}: {steps[currentStep - 1].title}
              </p>
              {store && (
                <p className="text-xs text-gray-400 mt-1">
                  {store.store_name}
                </p>
              )}
            </div>

            {/* Botão Continuar Comprando */}
            <button
              type="button"
              onClick={() => router.push(`/${resolvedParams.slug}`)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: store?.colors?.primary || '#10b981' }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>+ Produtos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex space-x-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  step.number <= currentStep
                    ? 'shadow-sm'
                    : 'bg-gray-200'
                }`}
                style={{
                  backgroundColor: step.number <= currentStep 
                    ? store?.colors?.primary || '#10b981' 
                    : undefined
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        {/* Dica para adicionar mais produtos */}
        {currentStep === 1 && (
          <div className="mx-4 mb-4 p-3 rounded-lg border border-blue-100 bg-blue-50">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                <span className="font-medium">Dica:</span> Você pode adicionar mais produtos clicando em &quot;
                <span className="font-semibold">+ Produtos</span>&quot; no topo da tela.
              </p>
            </div>
          </div>
        )}
        
        <CurrentStepComponent
          customerData={customerData}
          setCustomerData={setCustomerData}
          deliveryData={deliveryData}
          setDeliveryData={setDeliveryData}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          cart={cart}
          store={store}
          onNext={() => setCurrentStep(currentStep + 1)}
          onBack={() => setCurrentStep(currentStep - 1)}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      </div>
    </div>
  );
}