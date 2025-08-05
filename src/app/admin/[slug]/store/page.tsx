'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Save, Upload, Instagram, MessageCircle, Music, Youtube, Settings, Store, Palette } from 'lucide-react';
import Image from 'next/image';
import MobileImageUpload from '../../../../components/ui/mobile-image-upload';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import LottieLoader from '../../../../components/ui/lottie-loader';
import AdminHeader from '../../../../components/ui/admin-header';
import CategorySelector from '../../../../components/ui/category-selector';
import LayoutSelector from '../../../../components/ui/layout-selector';
import StorePreview from '../../../../components/ui/store-preview';
import Tabs from '../../../../components/ui/tabs';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';

interface Store {
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
}

export default function StoreSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
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
    social_networks: {
      instagram: '',
      whatsapp: '',
      tiktok: '',
      spotify: '',
      youtube: ''
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
    { id: 'basic', label: 'Informações Básicas', icon: <Store className="w-4 h-4" /> },
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
          accent: '#A855F7'
        },
        social_networks: {
          instagram: storeData.social_networks?.instagram || '',
          whatsapp: storeData.social_networks?.whatsapp || '',
          tiktok: storeData.social_networks?.tiktok || '',
          spotify: storeData.social_networks?.spotify || '',
          youtube: storeData.social_networks?.youtube || ''
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
    colors: formData.colors
  } : null;

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
                            <input
                              type="text"
                              value={formData.social_networks.whatsapp}
                              onChange={(e) => updateFormData({
                                social_networks: { ...formData.social_networks, whatsapp: e.target.value }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Número do WhatsApp para contato com clientes
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