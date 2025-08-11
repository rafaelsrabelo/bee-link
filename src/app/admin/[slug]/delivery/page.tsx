'use client';
import { Calculator, Clock, MapPin, RefreshCw, Save } from 'lucide-react';
import { Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AdminHeader from '../../../../components/ui/admin-header';

interface DeliverySettings {
  id: string;
  store_id: string;
  delivery_enabled: boolean;
  delivery_radius_km: number;
  price_per_km: number;
  minimum_delivery_fee: number;
  free_delivery_threshold: number;
  estimated_delivery_time_from: string;
  estimated_delivery_time_to: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  user_id: string;
}

export default function DeliveryManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  const [store, setStore] = useState<Store | null>(null);
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testDistance, setTestDistance] = useState(2);
  const [testOrderTotal, setTestOrderTotal] = useState(30);
  const [calculatedFee, setCalculatedFee] = useState(0);

  const { slug } = use(params);

  useEffect(() => {
    if (slug) {
      loadStore();
    }
  }, [slug]);

  useEffect(() => {
    if (store) {
      loadDeliverySettings();
    }
  }, [store]);

  const loadStore = async () => {
    try {
      const response = await fetch(`/api/stores/${slug}`);
      if (response.ok) {
        const storeData = await response.json();
        setStore(storeData);
      } else {
        toast.error('Loja não encontrada');
      }
    } catch (error) {
      toast.error('Erro ao carregar dados da loja');
    }
  };

  const loadDeliverySettings = async () => {
    try {
      const response = await fetch(`/api/stores/${slug}/delivery-settings`);
      if (response.ok) {
        const data = await response.json();
        // Garantir que os campos de tempo tenham valores padrão
        const settingsWithDefaults = {
          ...data,
          estimated_delivery_time_from: data.estimated_delivery_time_from || "00:30",
          estimated_delivery_time_to: data.estimated_delivery_time_to || "01:00"
        };
        setSettings(settingsWithDefaults);
      } else {
        toast.error('Erro ao carregar configurações de entrega');
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações de entrega');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // Preparar dados para envio (apenas campos corretos)
      const dataToSend = {
        delivery_enabled: settings.delivery_enabled,
        delivery_radius_km: settings.delivery_radius_km,
        price_per_km: settings.price_per_km,
        minimum_delivery_fee: settings.minimum_delivery_fee,
        free_delivery_threshold: settings.free_delivery_threshold,
        estimated_delivery_time_from: settings.estimated_delivery_time_from,
        estimated_delivery_time_to: settings.estimated_delivery_time_to,
      };

      const response = await fetch(`/api/stores/${slug}/delivery-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Configurações salvas com sucesso!');
        
        // Recarregar configurações para garantir sincronização
        await loadDeliverySettings();
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao salvar configurações:', errorData);
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('❌ Erro completo ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const calculateTestFee = async () => {
    if (!settings) return;
    
    try {
      const response = await fetch(`/api/stores/${slug}/calculate-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distance_km: testDistance,
          order_total: testOrderTotal,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCalculatedFee(data.delivery_fee);
      }
    } catch (error) {
      toast.error('Erro ao calcular taxa de entrega');
    }
  };

  const updateSetting = (field: keyof DeliverySettings, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <AdminHeader 
            store={store} 
            currentPage="delivery"
            title="Gestão de Entregas"
            icon={Truck}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <AdminHeader 
          store={store} 
          currentPage="delivery"
          title="Gestão de Entregas"
          icon={Truck}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-24">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Entregas</h1>
            </div>
            <p className="text-gray-600">
              Configure as opções de entrega da sua loja, incluindo raio de entrega, preços por km e condições especiais.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configurações Principais */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                Configurações de Entrega
              </h2>

              <div className="space-y-6">
                {/* Switch de Ativação */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ativar Entregas</label>
                    <p className="text-xs text-gray-500">Habilita o sistema de entregas para sua loja</p>
                  </div>
                  <button
                    onClick={() => updateSetting('delivery_enabled', !settings?.delivery_enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings?.delivery_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings?.delivery_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Raio de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raio de Entrega (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={settings?.delivery_radius_km || 0}
                    onChange={(e) => updateSetting('delivery_radius_km', Number.parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Distância máxima que você entrega
                  </p>
                </div>

                {/* Preço por KM */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço por KM (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings?.price_per_km || 0}
                    onChange={(e) => updateSetting('price_per_km', Number.parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor cobrado por quilômetro de distância
                  </p>
                </div>

                {/* Taxa Mínima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa Mínima de Entrega (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings?.minimum_delivery_fee || 0}
                    onChange={(e) => updateSetting('minimum_delivery_fee', Number.parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor mínimo cobrado mesmo para distâncias pequenas
                  </p>
                </div>

                {/* Pedido Mínimo para Entrega Grátis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pedido Mínimo para Entrega Grátis (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings?.free_delivery_threshold || 0}
                    onChange={(e) => updateSetting('free_delivery_threshold', Number.parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pedidos acima deste valor têm entrega gratuita
                  </p>
                </div>

                {/* Tempo Estimado de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Estimado de Entrega
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">De:</label>
                      <input
                        type="time"
                        value={settings?.estimated_delivery_time_from || "00:30"}
                        onChange={(e) => updateSetting('estimated_delivery_time_from', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Até:</label>
                      <input
                        type="time"
                        value={settings?.estimated_delivery_time_to || "01:00"}
                        onChange={(e) => updateSetting('estimated_delivery_time_to', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 00:30 a 01:00 = entre 30 min e 1 hora
                  </p>
                </div>

                {/* Botão Salvar */}
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>

            {/* Calculadora de Teste */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Calculator className="w-5 h-5 text-green-600 mr-2" />
                Calculadora de Taxa de Entrega
              </h2>

              <div className="space-y-6">
                <p className="text-sm text-gray-600">
                  Teste como ficaria a taxa de entrega com as configurações atuais:
                </p>

                {/* Distância de Teste */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distância (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={testDistance}
                    onChange={(e) => setTestDistance(Number.parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="2.0"
                  />
                </div>

                {/* Valor do Pedido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Pedido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={testOrderTotal}
                    onChange={(e) => setTestOrderTotal(Number.parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="30.00"
                  />
                </div>

                {/* Botão Calcular */}
                <button
                  onClick={calculateTestFee}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Calcular Taxa
                </button>

                {/* Resultado */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Resultado:</h3>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {calculatedFee.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Taxa de entrega calculada
                  </p>
                </div>

                {/* Informações Adicionais */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Informações Importantes
                  </h3>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• Entrega gratuita para pedidos acima de R$ {settings?.free_delivery_threshold?.toFixed(2) || '0.00'}</li>
                    <li>• Taxa mínima de R$ {settings?.minimum_delivery_fee?.toFixed(2) || '0.00'}</li>
                    <li>• Raio máximo de {settings?.delivery_radius_km || 0} km</li>
                    <li>• Tempo estimado: {settings?.estimated_delivery_time_from || "00:30"} a {settings?.estimated_delivery_time_to || "01:00"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
