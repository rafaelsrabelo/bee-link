'use client';

import { MapPin, Store, Truck } from 'lucide-react';
import { useState } from 'react';

interface DeliveryStepProps {
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
  setDeliveryData: (data: any) => void;
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

export default function DeliveryStep({
  deliveryData,
  setDeliveryData,
  onNext,
  onBack,
  currentStep,
  totalSteps,
  store
}: DeliveryStepProps) {
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loadingCep, setLoadingCep] = useState(false);

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setDeliveryData({
          ...deliveryData,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
    setLoadingCep(false);
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setDeliveryData({
      ...deliveryData,
      cep: formatted
    });

    // Buscar CEP automaticamente quando completar 8 dígitos
    const numbers = formatted.replace(/\D/g, '');
    if (numbers.length === 8) {
      searchCep(numbers);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!deliveryData.type) {
      newErrors.type = 'Selecione uma opção de entrega';
    }

    if (deliveryData.type === 'delivery') {
      if (!deliveryData.cep) {
        newErrors.cep = 'CEP é obrigatório';
      }
      if (!deliveryData.address) {
        newErrors.address = 'Endereço é obrigatório';
      }
      if (!deliveryData.number) {
        newErrors.number = 'Número é obrigatório';
      }
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
          Opções de Entrega
        </h2>
        <p className="text-gray-600">
          Como você gostaria de receber seu pedido?
        </p>
      </div>

      {/* Opções de Entrega */}
      <div className="space-y-3 mb-6">
        {/* Entrega */}
        <div
          onClick={() => setDeliveryData({ ...deliveryData, type: 'delivery' })}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            deliveryData.type === 'delivery'
              ? 'bg-opacity-10 shadow-sm'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{
            borderColor: deliveryData.type === 'delivery' 
              ? store?.colors?.primary || '#3b82f6' 
              : undefined,
            backgroundColor: deliveryData.type === 'delivery' 
              ? `${store?.colors?.primary || '#3b82f6'}15` 
              : undefined
          }}
        >
          <div className="flex items-center space-x-3">
            <Truck 
              className={`w-6 h-6 ${
                deliveryData.type === 'delivery' ? '' : 'text-gray-400'
              }`} 
              style={{
                color: deliveryData.type === 'delivery' 
                  ? store?.colors?.primary || '#3b82f6' 
                  : undefined
              }}
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Entrega</h3>
              <p className="text-sm text-gray-600">Receba em casa</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 ${
              deliveryData.type === 'delivery'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {deliveryData.type === 'delivery' && (
                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
              )}
            </div>
          </div>
        </div>

        {/* Retirada */}
        <div
          onClick={() => setDeliveryData({ ...deliveryData, type: 'pickup' })}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            deliveryData.type === 'pickup'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Store className={`w-6 h-6 ${
              deliveryData.type === 'pickup' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Retirar no Local</h3>
              <p className="text-sm text-gray-600">Buscar no estabelecimento</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 ${
              deliveryData.type === 'pickup'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {deliveryData.type === 'pickup' && (
                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {errors.type && (
        <p className="mb-4 text-sm text-red-600">{errors.type}</p>
      )}

      {/* Formulário de Endereço (apenas se entrega selecionada) */}
      {deliveryData.type === 'delivery' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Endereço de Entrega</h3>
          
          {/* CEP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={deliveryData.cep}
                onChange={handleCepChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cep ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="00000-000"
                maxLength={9}
              />
              {loadingCep && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {errors.cep && (
              <p className="mt-1 text-sm text-red-600">{errors.cep}</p>
            )}
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço *
            </label>
            <input
              type="text"
              value={deliveryData.address}
              onChange={(e) => setDeliveryData({
                ...deliveryData,
                address: e.target.value
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Rua, Avenida..."
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                value={deliveryData.number}
                onChange={(e) => setDeliveryData({
                  ...deliveryData,
                  number: e.target.value
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123"
              />
              {errors.number && (
                <p className="mt-1 text-sm text-red-600">{errors.number}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                value={deliveryData.complement}
                onChange={(e) => setDeliveryData({
                  ...deliveryData,
                  complement: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Apto, Bloco..."
              />
            </div>
          </div>

          {/* Bairro, Cidade e Estado */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro
              </label>
              <input
                type="text"
                value={deliveryData.neighborhood}
                onChange={(e) => setDeliveryData({
                  ...deliveryData,
                  neighborhood: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Bairro"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={deliveryData.city}
                onChange={(e) => setDeliveryData({
                  ...deliveryData,
                  city: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cidade"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UF
              </label>
              <input
                type="text"
                value={deliveryData.state}
                onChange={(e) => setDeliveryData({
                  ...deliveryData,
                  state: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SP"
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex space-x-4 mt-8">
        <button
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