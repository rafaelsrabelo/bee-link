'use client';

import { Check, Instagram, MapPin, MessageCircle, Music, Palette, Printer, Save, Settings, Store as StoreIcon, Upload, Youtube } from 'lucide-react';
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
import type { LayoutSettings } from '../../../../types/layout-settings';

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
  layout_settings?: LayoutSettings;
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
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  
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
      banner_height: 'medium' as 'small' | 'medium' | 'large' | 'full',
      banner_rounded: false,
      banner_padding: false,
      
      // Configurações de exibição
      show_store_description: true,
      show_social_links: true,
      show_contact_info: true,
      
      // Layout de produtos
      products_per_row: 3 as 2 | 3 | 4,
      card_layout: 'grid' as 'grid' | 'horizontal',
      show_product_badges: true,
      show_quick_add: true,
      
      // Configurações de carrinho
      show_floating_cart: true,
      cart_position: 'bottom-right' as 'bottom-right' | 'bottom-left',
      
      // Configurações de categoria
      category_display: 'filters' as 'tabs' | 'filters' | 'none',
      show_category_icons: true
    },
    print_settings: {
      default_printer: '',
      auto_print: false,
      print_format: 'thermal' as 'thermal' | 'a4',
      paper_width: 80,
      auto_cut: true,
      print_logo: true,
      print_address: true
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
    { id: 'layout', label: 'Layout da Loja', icon: <Palette className="w-4 h-4" /> },
    { id: 'printing', label: 'Configurações de Impressão', icon: <Printer className="w-4 h-4" /> }
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

  // Carregar impressoras quando acessar a aba de impressão
  useEffect(() => {
    if (activeTab === 'printing' && availablePrinters.length === 0) {
      loadAvailablePrinters();
    }
  }, [activeTab, availablePrinters.length]);

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
          banner_height: 'medium' as 'small' | 'medium' | 'large' | 'full',
          banner_rounded: true,
          banner_padding: true,
          
          // Configurações de exibição
          show_store_description: true,
          show_social_links: true,
          show_contact_info: true,
          
          // Layout de produtos
          products_per_row: 3 as 2 | 3 | 4,
          card_layout: 'grid' as 'grid' | 'horizontal',
          show_product_badges: true,
          show_product_description: true,
          show_product_price: true,
          show_product_rating: false,
          show_product_stock: true,
          show_quick_add: true,
          
          // Configurações de carrinho
          show_floating_cart: true,
          cart_position: 'bottom-right' as 'bottom-right' | 'bottom-left',
          
          // Configurações de categoria
          category_display: 'filters' as 'tabs' | 'filters' | 'none',
          show_category_icons: true
        },
        print_settings: storeData.print_settings || {
          default_printer: '',
          auto_print: false,
          print_format: 'thermal' as 'thermal' | 'a4',
          paper_width: 80,
          auto_cut: true,
          print_logo: true,
          print_address: true
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

  const calculateCoordinates = async (address: {
    street: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    zip_code?: string;
  }) => {
    if (!address?.street || !address?.city || !address?.state) {
      return null;
    }

    try {
      const addressString = `${address.street}, ${address.number || ''}, ${address.neighborhood || ''}, ${address.city}, ${address.state}, ${address.zip_code || ''}`;
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          return {
            lat: Number.parseFloat(data[0].lat),
            lng: Number.parseFloat(data[0].lon)
          };
        }
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
    }
    
    return null;
  };

  // Função para descobrir impressoras disponíveis
  const loadAvailablePrinters = async () => {
    setLoadingPrinters(true);
    try {
      // Lista de impressoras comuns mais utilizadas
      const commonPrinters = [
        'Impressora Padrão do Sistema',
        'Microsoft Print to PDF',
        'Microsoft XPS Document Writer'
      ];

      // Tentar usar API do navegador para descobrir impressoras (se disponível)
      if ('getInstalledRelatedApps' in navigator) {
        // API experimental - pode não funcionar em todos os navegadores
        try {
          const printers = await (navigator as unknown as { getInstalledRelatedApps: () => Promise<Array<{ name: string }>> }).getInstalledRelatedApps();
          const printerNames = printers
            .filter((app) => app.name.toLowerCase().includes('print'))
            .map((app) => app.name);
          
          setAvailablePrinters([...commonPrinters, ...printerNames]);
        } catch {
          setAvailablePrinters(commonPrinters);
        }
      } else {
        // Fallback: lista de impressoras comuns
        setAvailablePrinters(commonPrinters);
      }
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error);
      setAvailablePrinters(['Impressora Padrão do Sistema']);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Calcular coordenadas automaticamente se o endereço foi preenchido
      const dataToSave = { ...formData };
      
      if (formData.address?.street && formData.address?.city && formData.address?.state) {
        const coords = await calculateCoordinates(formData.address);
        if (coords) {
          dataToSave.latitude = coords.lat;
          dataToSave.longitude = coords.lng;
          toast.success('Coordenadas calculadas automaticamente!');
        }
      }

      const response = await fetch(`/api/stores/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
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
    layout_settings: formData.layout_settings,
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
        <div className="max-w-7xl mx-auto px-4 py-8 mt-24">
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
                    disabled={saving}
                    className={`px-6 py-2 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      saving 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'opacity-100 shadow-md hover:shadow-lg'
                    }`}
                    style={{ 
                      backgroundColor: formData.colors.primary,
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundColor = formData.colors.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) {
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
                        <p className="text-xs text-gray-500">
                          💡 As coordenadas serão calculadas automaticamente quando você salvar o formulário (necessário para cálculo de frete).
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

                      {/* Estilo dos Cards de Produto */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Estilo dos Cards de Produto
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Card Vertical/Grid */}
                          <button
                            type="button"
                            onClick={() => updateFormData({
                              layout_settings: {
                                ...formData.layout_settings,
                                card_layout: 'grid'
                              }
                            })}
                            className={`relative w-full cursor-pointer p-4 border-2 rounded-lg transition-all duration-200 ${
                              (formData.layout_settings?.card_layout || 'grid') === 'grid'
                                ? 'border-gray-500 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Ícone de Check quando selecionado */}
                            {(formData.layout_settings?.card_layout || 'grid') === 'grid' && (
                              <div className="absolute top-2 right-2">
                                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="space-y-3">
                              <h3 className="font-medium text-gray-900 text-sm">Vertical</h3>
                              
                              {/* Preview Visual do Card Vertical */}
                              <div className="bg-white border rounded-lg p-3 shadow-sm">
                                {/* Imagem em cima */}
                                <div className="bg-gray-200 rounded-md h-16 mb-3 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">Imagem</span>
                                </div>
                                {/* Informações embaixo */}
                                <div className="space-y-2">
                                  <div className="bg-gray-400 h-2.5 rounded w-4/5" />
                                  <div className="bg-gray-300 h-2 rounded w-3/5" />
                                  <div className="bg-gray-500 h-2.5 rounded w-2/5 mt-2" />
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-600">
                                Imagem em cima, informações embaixo
                              </p>
                            </div>
                          </button>

                          {/* Card Horizontal */}
                          <button
                            type="button"
                            onClick={() => updateFormData({
                              layout_settings: {
                                ...formData.layout_settings,
                                card_layout: 'horizontal'
                              }
                            })}
                            className={`relative w-full cursor-pointer p-4 border-2 rounded-lg transition-all duration-200 ${
                              formData.layout_settings?.card_layout === 'horizontal'
                                ? 'border-gray-500 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Ícone de Check quando selecionado */}
                            {formData.layout_settings?.card_layout === 'horizontal' && (
                              <div className="absolute top-2 right-2">
                                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="space-y-3">
                              <h3 className="font-medium text-gray-900 text-sm">Horizontal</h3>
                              
                              {/* Preview Visual do Card Horizontal */}
                              <div className="bg-white border rounded-lg p-3 shadow-sm">
                                <div className="flex space-x-3">
                                  {/* Imagem à esquerda */}
                                  <div className="bg-gray-200 rounded-md w-16 h-16 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-xs text-gray-500 transform -rotate-90">IMG</span>
                                  </div>
                                  {/* Informações à direita */}
                                  <div className="flex-1 space-y-2 py-1">
                                    <div className="bg-gray-400 h-2.5 rounded w-full" />
                                    <div className="bg-gray-300 h-2 rounded w-4/5" />
                                    <div className="bg-gray-500 h-2.5 rounded w-3/5" />
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-600">
                                Imagem ao lado, informações à direita
                              </p>
                            </div>
                          </button>
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Escolha o estilo:</strong> O layout vertical é melhor para mostrar produtos em destaque. 
                            O horizontal economiza espaço e mostra mais produtos.
                          </p>
                        </div>
                      </div>
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

                        {formData.layout_settings?.show_banner && (
                          <div className="pl-4 border-l-2 border-gray-200 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Banner
                              </label>
                              <select
                                value={formData.layout_settings?.banner_type || 'single'}
                                onChange={(e) => updateFormData({
                                  layout_settings: {
                                    ...formData.layout_settings,
                                    banner_type: e.target.value as 'single' | 'carousel'
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="single">Banner Único</option>
                                <option value="carousel">Carrossel de Banners</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Altura do Banner
                              </label>
                              <select
                                value={formData.layout_settings?.banner_height || 'medium'}
                                onChange={(e) => updateFormData({
                                  layout_settings: {
                                    ...formData.layout_settings,
                                    banner_height: e.target.value as 'small' | 'medium' | 'large' | 'full'
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="small">Pequeno</option>
                                <option value="medium">Médio</option>
                                <option value="large">Grande</option>
                                <option value="full">Tela Cheia</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Bordas Arredondadas
                                </label>
                                <p className="text-xs text-gray-500">
                                  Aplica bordas arredondadas ao banner
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.layout_settings?.banner_rounded || false}
                                  onChange={(e) => updateFormData({
                                    layout_settings: {
                                      ...formData.layout_settings,
                                      banner_rounded: e.target.checked
                                    }
                                  })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Espaçamento Interno
                                </label>
                                <p className="text-xs text-gray-500">
                                  Adiciona espaçamento interno ao banner
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.layout_settings?.banner_padding || false}
                                  onChange={(e) => updateFormData({
                                    layout_settings: {
                                      ...formData.layout_settings,
                                      banner_padding: e.target.checked
                                    }
                                  })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        )}
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

                {/* Tab de Configurações de Impressão */}
                {activeTab === 'printing' && (
                  <div className="space-y-8">
                    {/* Configurações de Impressão */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Printer className="w-5 h-5 mr-2 text-blue-600" />
                        Configurações de Impressão
                      </h2>
                      <p className="text-sm text-gray-600 mb-6">
                        Configure sua impressora padrão para impressão automática de pedidos.
                      </p>

                      <div className="space-y-6">
                        {/* Impressora Padrão */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Impressora Padrão
                          </label>
                          <div className="flex space-x-3">
                            <select
                              value={formData.print_settings.default_printer}
                              onChange={(e) => updateFormData({
                                print_settings: {
                                  ...formData.print_settings,
                                  default_printer: e.target.value
                                }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Selecione uma impressora</option>
                              {availablePrinters.map((printer) => (
                                <option key={printer} value={printer}>
                                  {printer}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={loadAvailablePrinters}
                              disabled={loadingPrinters}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                              <Printer className="w-4 h-4" />
                              <span>{loadingPrinters ? 'Buscando...' : 'Buscar'}</span>
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Selecione a impressora que será usada automaticamente para imprimir pedidos.
                          </p>
                        </div>

                        {/* Teste de Impressão */}
                        <div className="border-t pt-6">
                          <h3 className="text-md font-medium text-gray-900 mb-4">Teste de Impressão</h3>
                          <div className="flex justify-start">
                            <button
                              onClick={() => {
                                // Criar conteúdo de teste
                                const testContent = `================================
    ${store?.name?.toUpperCase() || 'TESTE DA LOJA'}
================================

TESTE DE IMPRESSÃO
Data: ${new Date().toLocaleDateString('pt-BR')}
Hora: ${new Date().toLocaleTimeString('pt-BR')}

--- CONFIGURAÇÕES ---
Impressora: ${formData.print_settings.default_printer || 'Não selecionada'}

================================
   TESTE REALIZADO COM SUCESSO!
================================`;

                                // Usar a mesma lógica de impressão
                                const printFrame = document.createElement('iframe');
                                printFrame.style.position = 'absolute';
                                printFrame.style.top = '-1000px';
                                printFrame.style.left = '-1000px';
                                printFrame.style.visibility = 'hidden';
                                document.body.appendChild(printFrame);

                                const htmlContent = `
                                  <!DOCTYPE html>
                                  <html>
                                    <head>
                                      <title>Teste de Impressão</title>
                                      <style>
                                        @page { margin: 5mm; size: 80mm auto; }
                                        body { font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.1; margin: 0; padding: 0; }
                                        .print-content { white-space: pre-line; }
                                      </style>
                                    </head>
                                    <body>
                                      <div class="print-content">${testContent}</div>
                                      <script>
                                        window.onload = function() {
                                          setTimeout(() => window.print(), 500);
                                        };
                                      </script>
                                    </body>
                                  </html>
                                `;

                                if (printFrame.contentDocument) {
                                  printFrame.contentDocument.open();
                                  printFrame.contentDocument.write(htmlContent);
                                  printFrame.contentDocument.close();
                                }

                                toast.success('Teste de impressão enviado!');
                              }}
                              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Fazer Teste</span>
                            </button>
                          </div>
                        </div>
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