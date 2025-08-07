'use client';

import { Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';

// Função para salvar dados no localStorage
const saveCustomerData = (name: string, phone: string) => {
  try {
    localStorage.setItem('customerData', JSON.stringify({ name, phone }));
  } catch (error) {
    console.error('Erro ao salvar dados no localStorage:', error);
  }
};

// Função para carregar dados do localStorage
const loadCustomerData = () => {
  try {
    const data = localStorage.getItem('customerData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao carregar dados do localStorage:', error);
    return null;
  }
};

interface CustomerInfoStepProps {
  customerData: {
    name: string;
    phone: string;
  };
  setCustomerData: (data: any) => void;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
  store?: {
    colors?: {
      primary: string;
    };
  } | null;
}

export default function CustomerInfoStep({
  customerData,
  setCustomerData,
  onNext,
  currentStep,
  totalSteps,
  store
}: CustomerInfoStepProps) {
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Carregar dados salvos do localStorage ao montar o componente
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
    const savedData = loadCustomerData();
    if (savedData && (!customerData.name || !customerData.phone)) {
      setCustomerData({
        name: savedData.name || '',
        phone: savedData.phone || ''
      });
    }
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!customerData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!customerData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(customerData.phone)) {
      newErrors.phone = 'Formato: (11) 99999-9999';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleNext = () => {
    if (validateForm()) {
      // Salvar dados no localStorage antes de continuar
      saveCustomerData(customerData.name, customerData.phone);
      onNext();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Seus Dados
        </h2>
        <p className="text-gray-600">
          Precisamos dessas informações para identificar seu pedido
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
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite seu nome completo"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
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
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Botão Continuar */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleNext}
          className="w-full text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-all"
          style={{ backgroundColor: store?.colors?.primary || '#2563eb' }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}