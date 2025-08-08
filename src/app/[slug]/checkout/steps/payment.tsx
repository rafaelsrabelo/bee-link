'use client';

import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import { useState } from 'react';

interface PaymentData {
  method: string;
}

interface PaymentStepProps {
  paymentData: PaymentData;
  setPaymentData: (data: PaymentData) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  store?: {
    colors?: {
      primary: string;
    };
  } | null;
}

export default function PaymentStep({
  paymentData,
  setPaymentData,
  onNext,
  onBack,
  // currentStep,
  // totalSteps,
  store
}: PaymentStepProps) {
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const paymentMethods = [
    {
      id: 'money',
      name: 'Dinheiro',
      description: 'Pagamento em espécie',
      icon: Banknote,
      color: 'text-green-600'
    },
    {
      id: 'pix',
      name: 'PIX',
      description: 'Transferência instantânea',
      icon: Smartphone,
      color: 'text-purple-600'
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      description: 'Visa, Mastercard, etc.',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      id: 'debit_card',
      name: 'Cartão de Débito',
      description: 'Débito na conta',
      icon: CreditCard,
      color: 'text-orange-600'
    }
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!paymentData.method) {
      newErrors.method = 'Selecione uma forma de pagamento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Forma de Pagamento
        </h2>
        <p className="text-gray-600">
          Selecione como você gostaria de pagar
        </p>
      </div>

      {/* Métodos de Pagamento */}
      <div className="space-y-3 mb-6">
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              onClick={() => setPaymentData({ ...paymentData, method: method.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setPaymentData({ ...paymentData, method: method.id });
                }
              }}
              role="button"
              tabIndex={0}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentData.method === method.id
                  ? 'bg-opacity-10 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{
                borderColor: paymentData.method === method.id 
                  ? store?.colors?.primary || '#3b82f6' 
                  : undefined,
                backgroundColor: paymentData.method === method.id 
                  ? `${store?.colors?.primary || '#3b82f6'}15` 
                  : undefined
              }}
            >
              <div className="flex items-start space-x-3">
                <IconComponent 
                  className={`w-6 h-6 mt-1 ${
                    paymentData.method === method.id ? '' : method.color
                  }`} 
                  style={{
                    color: paymentData.method === method.id 
                      ? store?.colors?.primary || '#3b82f6' 
                      : undefined
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <div 
                  className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    paymentData.method === method.id ? '' : 'border-gray-300'
                  }`}
                  style={{
                    borderColor: paymentData.method === method.id 
                      ? store?.colors?.primary || '#3b82f6' 
                      : undefined,
                    backgroundColor: paymentData.method === method.id 
                      ? store?.colors?.primary || '#3b82f6' 
                      : undefined
                  }}
                >
                  {paymentData.method === method.id && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errors.method && (
        <p className="mb-4 text-sm text-red-600">{errors.method}</p>
      )}

      {/* Botões */}
      <div className="flex space-x-4 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-all"
          style={{ backgroundColor: store?.colors?.primary || '#2563eb' }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}