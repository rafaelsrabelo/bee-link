'use client';

import { Instagram, MapPin, MessageCircle, Music, Palette, Save, Settings, Store as StoreIcon, Upload, Youtube } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AdminHeader from '../../../../components/ui/admin-header';
import CategorySelector from '../../../../components/ui/category-selector';
import LayoutSelector from '../../../../components/ui/layout-selector';
import LottieLoader from '../../../../components/ui/lottie-loader';
import MobileImageUpload from '../../../../components/ui/mobile-image-upload';

import PromotionsManager from '../../../../components/ui/promotions-manager';
import StorePreview from '../../../../components/ui/store-preview';
import Tabs from '../../../../components/ui/tabs';
import { useAuth } from '../../../../contexts/AuthContext';
import type { Store } from '../../../../contexts/StoreContext';

interface StoreData {
  id: string;
  name: string;
  store_name: string;
  slug: string;
  description: string;
  logo: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
  };
  layout_type?: 'default' | 'banner';
  banner_image?: string;
  show_products_by_category?: boolean;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  social_networks: {
    instagram?: string;
    whatsapp?: string;
    tiktok?: string;
    spotify?: string;
    youtube?: string;
  };
  user_id: string;
  address?: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  latitude?: number;
  longitude?: number;
}

export default function StoreSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchingCep, setSearchingCep] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    category_id: undefined as number | undefined,
    layout_type: 'default' as 'default' | 'banner',
    banner_image: '',
    show_products_by_category: false,
    colors: {
      background: '#F8F9FA',
      primary: '#8B5CF6',
      text: '#1A202C',
      header: '#8B5CF6'
    },
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: ''
    },
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    social_networks: {
      instagram: '',
      whatsapp: '',
      tiktok: '',
      spotify: '',
      youtube: ''
    },
    layout_settings: {
      // Componentes de banner
      show_banner: false,
      banner_type: 'single' as 'single' | 'carousel',
      banner_images: [],
      banner_height: 'medium' as 'small' | 'medium' | 'large',
      banner_rounded: false,
      banner_padding: false,
      
      // Configurações de exibição
      show_store_description: true,
      show_social_links: true,
      show_contact_info: true,
      
      // Layout de produtos
      products_per_row: 3 as 2 | 3 | 4,
      show_product_badges: true,
      show_quick_add: true,
      
      // Configurações de carrinho
      show_floating_cart: true,
      cart_position: 'bottom-right' as 'bottom-right' | 'bottom-left',
      
      // Configurações de categoria
      category_display: 'filters' as 'tabs' | 'filters' | 'none',
      show_category_icons: true
    }
  });

  // Cores pré-definidas
  const predefinedColors = [
    {
      name: 'Roxo Elegante',
      background: '#F8F9FA',
      primary: '#8B5CF6',
      text: '#1A202C',
      header: '#8B5CF6'
    },
    {
      name: 'Azul Profissional',
      background: '#F0F9FF',
      primary: '#3B82F6',
      text: '#1A202C',
      header: '#3B82F6'
    },
    {
      name: 'Verde Natureza',
      background: '#F0FDF4',
      primary: '#10B981',
      text: '#1A202C',
      header: '#10B981'
    },
    {
      name: 'Rosa Moderno',
      background: '#FDF2F8',
      primary: '#EC4899',
      text: '#1A202C',
      header: '#EC4899'
    },
    {
      name: 'Laranja Energia',
      background: '#FFF7ED',
      primary: '#F97316',
      text: '#1A202C',
      header: '#F97316'
    },
    {
      name: 'Vermelho Clássico',
      background: '#FEF2F2',
      primary: '#EF4444',
      text: '#1A202C',
      header: '#EF4444'
    }
  ];

  // Tabs
  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: <StoreIcon className="w-4 h-4" /> },
    { id: 'address', label: 'Endereço', icon: <MapPin className="w-4 h-4" /> },
    { id: 'layout', label: 'Layout da Loja', icon: <Palette className="w-4 h-4" /> }
  ];

  const { user } = useAuth();
  const router = useRouter();
  const { slug } = use(params);

  // Função para verificar mudanças
  const checkForChanges = (newFormData: typeof formData) => {
    if (!originalFormData) return false;
    return JSON.stringify(newFormData) !== JSON.stringify(originalFormData);
  };

  // Função para atualizar formData com verificação de mudanças
  const updateFormData = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    setHasUnsavedChanges(checkForChanges(newFormData));
  };

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user]);

  const loadStore = async () => {
    try {
      const response = await fetch(`/api/stores/${slug}`);
      if (!response.ok) {
        toast.error('Loja não encontrada');
        router.push('/create-store');
        return;
      }
      const storeData = await response.json();
      setStore(storeData);

      // Verificar se o usuário é dono da loja
      if (storeData.user_id !== user?.id) {
        toast.error('Você não tem permissão para acessar esta loja');
        router.push('/');
        return;
      }

      // Preencher formulário com dados da loja
      const initialFormData = {
        name: storeData.name || '',
        slug: storeData.slug || '',
        description: storeData.description || '',
        logo: storeData.logo || '',
        category_id: storeData.category_id || undefined,
        layout_type: storeData.layout_type || 'default',
        banner_image: storeData.banner_image || '',
        show_products_by_category: storeData.show_products_by_category || false,
        colors: storeData.colors || {
          background: '#F8F9FA',
          primary: '#8B5CF6',
          text: '#1A202C',
          header: '#8B5CF6'
        },
        address: {
          street: storeData.address?.street || '',
          number: storeData.address?.number || '',
          complement: storeData.address?.complement || '',
          neighborhood: storeData.address?.neighborhood || '',
          city: storeData.address?.city || '',
          state: storeData.address?.state || '',
          zip_code: storeData.address?.zip_code || ''
        },
        latitude: storeData.latitude || undefined,
        longitude: storeData.longitude || undefined,
        social_networks: {
          instagram: storeData.social_networks?.instagram || '',
          whatsapp: storeData.social_networks?.whatsapp || '',
          tiktok: storeData.social_networks?.tiktok || '',
          spotify: storeData.social_networks?.spotify || '',
          youtube: storeData.social_networks?.youtube || ''
        },
        layout_settings: storeData.layout_settings || {
          // Componentes de banner
          show_banner: false,
          banner_type: 'single' as 'single' | 'carousel',
          banner_images: [],
          banner_height: 'medium' as 'small' | 'medium' | 'large',
          banner_rounded: false,
          banner_padding: false,
          
          // Configurações de exibição
          show_store_description: true,
          show_social_links: true,
          show_contact_info: true,
          
          // Layout de produtos
          products_per_row: 3 as 2 | 3 | 4,
          show_product_badges: true,
          show_quick_add: true,
          
          // Configurações de carrinho
          show_floating_cart: true,
          cart_position: 'bottom-right' as 'bottom-right' | 'bottom-left',
          
          // Configurações de categoria
          category_display: 'filters' as 'tabs' | 'filters' | 'none',
          show_category_icons: true
        }
      };

      setFormData(initialFormData);
      setOriginalFormData(JSON.parse(JSON.stringify(initialFormData))); // Deep copy
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updateFormData({ logo: data.imageUrl });
        toast.success('Logo enviada com sucesso!');
      } else {
        toast.error('Erro ao enviar logo');
      }
    } catch (error) {
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updateFormData({ banner_image: data.imageUrl });
        toast.success('Banner enviado com sucesso!');
      } else {
        toast.error('Erro ao enviar banner');
      }
    } catch (error) {
      toast.error('Erro ao enviar banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Função para buscar CEP
  const searchCep = async (cep: string) => {
    if (cep.length !== 8) return;

    setSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      // Preencher campos automaticamente
      updateFormData({
        address: {
          ...formData.address,
          zip_code: cep.replace(/(\d{5})(\d{3})/, '$1-$2'),
          street: data.logradouro || formData.address?.street || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }
      });

      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setSearchingCep(false);
    }
  };

  // Função para tratar mudança do CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    // Aplica máscara
    if (value.length > 5) {
      value = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }

    updateFormData({
      address: { ...formData.address, zip_code: value }
    });

    // Busca automaticamente quando completar o CEP
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      searchCep(cleanCep);
    }
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address?.street || !formData.address?.city || !formData.address?.state) {
      toast.error('Preencha pelo menos rua, cidade e estado');
      return;
    }

    try {
      const address = `${formData.address.street}, ${formData.address.number || ''}, ${formData.address.neighborhood || ''}, ${formData.address.city}, ${formData.address.state}, ${formData.address.zip_code || ''}`;
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const coords = {
            lat: Number.parseFloat(data[0].lat),
            lng: Number.parseFloat(data[0].lon)
          };
          
          updateFormData({
            latitude: coords.lat,
            longitude: coords.lng
          });
          
          toast.success(`Coordenadas calculadas: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        } else {
          toast.error('Não foi possível encontrar as coordenadas para este endereço');
        }
      } else {
        toast.error('Erro ao calcular coordenadas');
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      toast.error('Erro ao calcular coordenadas');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/stores/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Loja atualizada com sucesso!');
        await loadStore(); // Recarregar dados
        setHasUnsavedChanges(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar loja');
      }
    } catch (error) {
      toast.error('Erro ao salvar loja');
    } finally {
      setSaving(false);
    }
  };

  // Criar objeto store atualizado para preview em tempo real
  const previewStore = store ? {
    ...store,
    name: formData.name,
    logo: formData.logo,
    banner_image: formData.banner_image,
    layout_type: formData.layout_type,
    show_products_by_category: formData.show_products_by_category,
    colors: formData.colors,
    // Converter address de objeto para string para compatibilidade com StorePreview
    address: formData.address ? 
      `${formData.address.street}, ${formData.address.number}${formData.address.complement ? ', ' + formData.address.complement : ''} - ${formData.address.neighborhood}, ${formData.address.city}/${formData.address.state} - CEP: ${formData.address.zip_code}` 
      : store.address
  } as Store : null;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LottieLoader animationData={loadingAnimation} text="Carregando..." />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        {store && (
          <AdminHeader
            store={store}
            currentPage="store"
            title="Minha Loja"
            icon={Settings}
          />
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className={`grid gap-8 ${activeTab === 'layout' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
            {/* Coluna Esquerda - Formulário */}
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Header com Tabs e Botão Salvar */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    {hasUnsavedChanges && (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Alterações não salvas</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className={`px-6 py-2 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      hasUnsavedChanges 
                        ? 'opacity-100 shadow-md hover:shadow-lg' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ 
                      backgroundColor: formData.colors.primary,
                    }}
                    onMouseEnter={(e) => {
                      if (!saving && hasUnsavedChanges) {
                        e.currentTarget.style.backgroundColor = formData.colors.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving && hasUnsavedChanges) {
                        e.currentTarget.style.backgroundColor = formData.colors.primary;
                      }
                    }}
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
                
                {/* Tabs */}
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>

              {/* Conteúdo das Tabs */}
              <div className="p-6">
                {activeTab === 'basic' && (
                  <div className="space-y-8">
                    {/* Informações Básicas */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome da Loja *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateFormData({ name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Nome da sua loja"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL da Loja
                          </label>
                          <input
                            type="text"
                            value={formData.slug}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            placeholder="URL da loja"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            A URL não pode ser alterada após a criação
                          </p>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => updateFormData({ description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Descreva sua loja..."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria da Loja
                          </label>
                          <CategorySelector
                            value={formData.category_id}
                            onChange={(categoryId) => updateFormData({ category_id: categoryId })}
                            placeholder="Selecione a categoria da sua loja"
                            className="w-full"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Escolha a categoria que melhor representa sua loja.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Logo */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo da Loja</h2>
                      <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          {formData.logo ? (
                            <Image
                              src={formData.logo}
                              alt="Logo"
                              width={96}
                              height={96}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <MobileImageUpload
                            onImageSelect={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Envie uma imagem quadrada para melhor resultado
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Redes Sociais */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociais</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp *
                          </label>
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="w-5 h-5 text-green-600" />
                            <div className="flex-1 relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                                +55
                              </div>
                              <input
                                type="text"
                                value={formData.social_networks.whatsapp.replace(/^\+?55/, '')}
                                onChange={(e) => {
                                  // Remove tudo que não é número
                                  let value = e.target.value.replace(/\D/g, '');
                                  
                                  // Aplica máscara (11) 99999-9999
                                  if (value.length >= 11) {
                                    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                                  } else if (value.length >= 7) {
                                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                                  } else if (value.length >= 3) {
                                    value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                                  } else if (value.length >= 1) {
                                    value = value.replace(/(\d{0,2})/, '($1');
                                  }
                                  
                                  // Sempre salva com +55 no backend
                                  const fullNumber = value ? `+55${value.replace(/\D/g, '')}` : '';
                                  updateFormData({
                                    social_networks: { ...formData.social_networks, whatsapp: fullNumber }
                                  });
                                }}
                                className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Digite apenas o número com DDD. O código do país (+55) será adicionado automaticamente.
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            💡 Exemplo: (11) 99999-9999 será salvo como +5511999999999
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instagram
                          </label>
                          <div className="flex items-center space-x-2">
                            <Instagram className="w-5 h-5 text-pink-600" />
                            <input
                              type="text"
                              value={formData.social_networks.instagram}
                              onChange={(e) => updateFormData({
                                social_networks: { ...formData.social_networks, instagram: e.target.value }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              placeholder="@seuinstagram"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            TikTok
                          </label>
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                            </svg>
                            <input
                              type="text"
                              value={formData.social_networks.tiktok}
                              onChange={(e) => updateFormData({
                                social_networks: { ...formData.social_networks, tiktok: e.target.value }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              placeholder="@seutiktok"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Spotify
                          </label>
                          <div className="flex items-center space-x-2">
                            <Music className="w-5 h-5 text-green-600" />
                            <input
                              type="text"
                              value={formData.social_networks.spotify}
                              onChange={(e) => updateFormData({
                                social_networks: { ...formData.social_networks, spotify: e.target.value }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              placeholder="Link do seu perfil Spotify"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            YouTube
                          </label>
                          <div className="flex items-center space-x-2">
                            <Youtube className="w-5 h-5 text-red-600" />
                            <input
                              type="text"
                              value={formData.social_networks.youtube}
                              onChange={(e) => updateFormData({
                                social_networks: { ...formData.social_networks, youtube: e.target.value }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              placeholder="@seucanal"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'address' && (
                  <div className="space-y-8">
                    {/* Endereço da Loja */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Endereço da Loja</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CEP - PRIMEIRO CAMPO */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CEP *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.address?.zip_code || ''}
                              onChange={handleCepChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="12345-678"
                              maxLength={9}
                            />
                            {searchingCep && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Digite o CEP para buscar automaticamente o endereço
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rua *
                          </label>
                          <input
                            type="text"
                            value={formData.address?.street || ''}
                            onChange={(e) => updateFormData({
                              address: { ...formData.address, street: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Rua das Flores"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número *
                          </label>
                          <input
                            type="text"
                            value={formData.address?.number || ''}
                            onChange={(e) => updateFormData({
                              address: { ...formData.address, number: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="123"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Complemento
                          </label>
                          <input
                            type="text"
                            value={formData.address?.complement || ''}
                            onChange={(e) => updateFormData({
                              address: { ...formData.address, complement: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Apto 101, Bloco B"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bairro
                          </label>
                          <input
                            type="text"
                            value={formData.address?.neighborhood || ''}
                            onChange={(e) => updateFormData({
                              address: { ...formData.address, neighborhood: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Centro"
                            readOnly={searchingCep}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cidade *
                          </label>
                          <input
                            type="text"
                            value={formData.address?.city || ''}
                            onChange={(e) => updateFormData({
                              address: { ...formData.address, city: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="São Paulo"
                            readOnly={searchingCep}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado *
                          </label>
                          <input
                            type="text"
                            value={formData.address?.state || ''}
                            onChange={(e) => updateFormData({
                              address: { ...formData.address, state: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="SP"
                            maxLength={2}
                            readOnly={searchingCep}
                          />
                        </div>
                      </div>
                      
                      {/* Botão para geocodificar endereço */}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={handleGeocodeAddress}
                          disabled={!formData.address?.street || !formData.address?.city || !formData.address?.state}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          📍 Calcular Coordenadas do Endereço
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Clique para calcular as coordenadas da loja (necessário para cálculo de frete). Preencha o endereço completo primeiro.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'layout' && (
                  <div className="space-y-8">
                    {/* Layout da Loja */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Layout da Loja</h2>
                      <LayoutSelector
                        value={formData.layout_type}
                        onChange={(layoutType) => updateFormData({ layout_type: layoutType })}
                        showCategory={formData.show_products_by_category}
                        onShowCategoryChange={(show) => updateFormData({ show_products_by_category: show })}
                        className="mb-6"
                      />

                      {/* Upload de Banner (apenas se layout for banner) */}
                      {formData.layout_type === 'banner' && (
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Banner da Loja
                          </label>
                          <div className="w-full">
                            <MobileImageUpload
                              onImageSelect={handleBannerUpload}
                              disabled={uploadingBanner}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              Envie uma imagem horizontal para o banner (recomendado: 1200x400px)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cores da Loja */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cores da Loja</h2>
                      
                      {/* Cores Pré-definidas */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Escolha um tema pré-definido
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {predefinedColors.map((theme, index) => (
                            <button
                              key={index}
                              onClick={() => updateFormData({
                                colors: {
                                  background: theme.background,
                                  primary: theme.primary,
                                  text: theme.text,
                                  header: theme.header
                                }
                              })}
                              className="p-3 border-2 rounded-lg hover:border-gray-500 transition-colors text-left"
                              style={{
                                borderColor: formData.colors.background === theme.background &&
                                formData.colors.primary === theme.primary &&
                                formData.colors.text === theme.text &&
                                formData.colors.header === theme.header ? '#6B7280' : '#E5E7EB'
                              }}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.background }}></div>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.text }}></div>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.header }}></div>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                                             {/* Cores Personalizadas */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cor de Fundo
                          </label>
                          <div className="flex space-x-2">
                            <div className="relative flex-shrink-0">
                              <input
                                type="color"
                                value={formData.colors.background}
                                onChange={(e) => updateFormData({
                                  colors: { ...formData.colors, background: e.target.value }
                                })}
                                className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                                style={{ backgroundColor: formData.colors.background }}
                              />
                              <div 
                                className="absolute inset-0 rounded-lg border-2 border-white shadow-sm pointer-events-none"
                                style={{ backgroundColor: formData.colors.background }}
                              />
                            </div>
                            <input
                              type="text"
                              value={formData.colors.background}
                              onChange={(e) => updateFormData({
                                colors: { ...formData.colors, background: e.target.value }
                              })}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Cor de fundo da loja</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cor Primária
                          </label>
                          <div className="flex space-x-2">
                            <div className="relative flex-shrink-0">
                              <input
                                type="color"
                                value={formData.colors.primary}
                                onChange={(e) => updateFormData({
                                  colors: { ...formData.colors, primary: e.target.value }
                                })}
                                className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                                style={{ backgroundColor: formData.colors.primary }}
                              />
                              <div 
                                className="absolute inset-0 rounded-lg border-2 border-white shadow-sm pointer-events-none"
                                style={{ backgroundColor: formData.colors.primary }}
                              />
                            </div>
                            <input
                              type="text"
                              value={formData.colors.primary}
                              onChange={(e) => updateFormData({
                                colors: { ...formData.colors, primary: e.target.value }
                              })}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Cor principal dos botões e elementos</p>
                        </div>
                        
                        
                         
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                             Cor do Texto
                           </label>
                           <div className="flex space-x-2">
                             <div className="relative flex-shrink-0">
                               <input
                                 type="color"
                                 value={formData.colors.text}
                                 onChange={(e) => updateFormData({
                                   colors: { ...formData.colors, text: e.target.value }
                                 })}
                                                                 className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                                style={{ backgroundColor: formData.colors.text }}
                               />
                               <div 
                                 className="absolute inset-0 rounded-lg border-2 border-white shadow-sm pointer-events-none"
                                 style={{ backgroundColor: formData.colors.text }}
                               />
                             </div>
                             <input
                               type="text"
                               value={formData.colors.text}
                               onChange={(e) => updateFormData({
                                 colors: { ...formData.colors, text: e.target.value }
                               })}
                               className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                             />
                           </div>
                           <p className="text-xs text-gray-500 mt-1">Cor principal dos textos</p>
                         </div>
                       </div>
                       
                       {/* Cor do Header - Separada para não quebrar layout */}
                       <div className="mt-6">
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Cor do Header da Vitrine
                         </label>
                         <div className="flex space-x-2">
                           <div className="relative flex-shrink-0">
                             <input
                               type="color"
                               value={formData.colors.header}
                               onChange={(e) => updateFormData({
                                 colors: { ...formData.colors, header: e.target.value }
                               })}
                               className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                               style={{ backgroundColor: formData.colors.header }}
                             />
                             <div 
                               className="absolute inset-0 rounded-lg border-2 border-white shadow-sm pointer-events-none"
                               style={{ backgroundColor: formData.colors.header }}
                             />
                           </div>
                           <input
                             type="text"
                             value={formData.colors.header}
                             onChange={(e) => updateFormData({
                               colors: { ...formData.colors, header: e.target.value }
                             })}
                             className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                           />
                         </div>
                         <p className="text-xs text-gray-500 mt-1">Cor do header da vitrine (página do cliente)</p>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'promotions' && (
                  <div className="space-y-8">
                    <PromotionsManager 
                      storeSlug={slug} 
                      onPromotionChange={() => {
                        // Recarregar dados se necessário
                      }}
                    />
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-8">
                    {/* Configurações de Banner */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Banner</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mostrar Banner
                            </label>
                            <p className="text-xs text-gray-500">
                              Ative para exibir um banner na página da loja
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.layout_settings?.show_banner || false}
                              onChange={(e) => updateFormData({
                                layout_settings: {
                                  ...formData.layout_settings,
                                  show_banner: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Configurações de Layout de Produtos */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Layout de Produtos</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Produtos por Linha
                          </label>
                          <select
                            value={formData.layout_settings?.products_per_row || 3}
                            onChange={(e) => updateFormData({
                              layout_settings: {
                                ...formData.layout_settings,
                                products_per_row: Number.parseInt(e.target.value) as 2 | 3 | 4
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value={2}>2 produtos</option>
                            <option value={3}>3 produtos</option>
                            <option value={4}>4 produtos</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mostrar Badges nos Produtos
                            </label>
                            <p className="text-xs text-gray-500">
                              Exibe badges como &quot;Pronta entrega&quot; nos produtos
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.layout_settings?.show_product_badges !== false}
                              onChange={(e) => updateFormData({
                                layout_settings: {
                                  ...formData.layout_settings,
                                  show_product_badges: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Configurações de Carrinho */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Carrinho</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Carrinho Flutuante
                            </label>
                            <p className="text-xs text-gray-500">
                              Mostra o carrinho flutuante na página
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.layout_settings?.show_floating_cart !== false}
                              onChange={(e) => updateFormData({
                                layout_settings: {
                                  ...formData.layout_settings,
                                  show_floating_cart: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {formData.layout_settings?.show_floating_cart !== false && (
                          <div className="pl-4 border-l-2 border-gray-200">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Posição do Carrinho
                              </label>
                              <select
                                value={formData.layout_settings?.cart_position || 'bottom-right'}
                                onChange={(e) => updateFormData({
                                  layout_settings: {
                                    ...formData.layout_settings,
                                    cart_position: e.target.value as 'bottom-right' | 'bottom-left'
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="bottom-right">Canto inferior direito</option>
                                <option value="bottom-left">Canto inferior esquerdo</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita - Preview (apenas quando tab de layout está ativo) */}
            {activeTab === 'layout' && previewStore && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview da Loja</h2>
                <StorePreview
                  store={previewStore}
                  layoutType={formData.layout_type}
                  className="max-w-md mx-auto"
                  isLivePreview={hasUnsavedChanges}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}