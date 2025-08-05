'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Store, Upload, Loader2, ArrowLeft, Sparkles, MessageCircle, Instagram, Music, Youtube } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import CategorySelector from '../../components/ui/category-selector';

interface StoreForm {
  store_name: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  description: string;
  category_id?: number;
  social_networks: {
    instagram: string;
    whatsapp: string;
    tiktok: string;
    spotify: string;
    youtube: string;
  };
}

const defaultColors = {
  primary: '#8B5CF6', // Purple
  secondary: '#7C3AED', // Violet
  accent: '#A855F7' // Purple-500
};

// Cores pré-definidas
const predefinedColors = [
  {
    name: 'Roxo Elegante',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#A855F7'
  },
  {
    name: 'Azul Profissional',
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    accent: '#60A5FA'
  },
  {
    name: 'Verde Natureza',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399'
  },
  {
    name: 'Rosa Moderno',
    primary: '#EC4899',
    secondary: '#BE185D',
    accent: '#F472B6'
  },
  {
    name: 'Laranja Energia',
    primary: '#F97316',
    secondary: '#EA580C',
    accent: '#FB923C'
  },
  {
    name: 'Vermelho Clássico',
    primary: '#EF4444',
    secondary: '#DC2626',
    accent: '#F87171'
  }
];

export default function CreateStorePage() {
  const [form, setForm] = useState<StoreForm>({
    store_name: '',
    slug: '',
    logo: '',
    colors: defaultColors,
    description: '',
    category_id: undefined,
    social_networks: {
      instagram: '',
      whatsapp: '',
      tiktok: '',
      spotify: '',
      youtube: '',
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkExistingStore();
    }
  }, [user]);

  const checkExistingStore = async () => {
    try {
      const response = await fetch('/api/user/stores');
      const stores = await response.json();
      
      // Buscar a store do usuário logado (deveria ser apenas uma por usuário)
      const userStore = stores.find((store: { user_id: string }) => store.user_id === user?.id);
      
      if (userStore) {
        router.push(`/admin/${userStore.slug}/products`);
      }
    } catch {
      // Usuário não tem loja, pode continuar
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleStoreNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      store_name: name,
      slug: generateSlug(name)
    }));
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
        setForm(prev => ({ ...prev, logo: data.url }));
        toast.success('Logo enviada com sucesso!');
      } else {
        throw new Error('Erro ao enviar imagem');
      }
    } catch {
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.store_name || !form.slug || !form.social_networks.whatsapp) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          user_id: user?.id
        }),
      });

      if (response.ok) {
        const store = await response.json();
        
        // Limpar formulário primeiro
        setForm({
          store_name: '',
          slug: '',
          logo: '',
          colors: defaultColors,
          description: '',
          category_id: undefined,
          social_networks: {
            instagram: '',
            whatsapp: '',
            tiktok: '',
            spotify: '',
            youtube: '',
          }
        });
        
        // Mostrar toast de sucesso
        toast.success('Loja criada com sucesso!');
        
        // Aguardar um pouco mais para garantir que a limpeza seja visível
        setTimeout(() => {
          router.push(`/admin/${store.slug}`);
        }, 1500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar loja');
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    Bee Link
                  </h1>
                  <p className="text-sm text-gray-600">Sua loja em um link</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Criar sua loja
            </h1>
            <p className="text-xl text-gray-600">
              Configure sua loja online em poucos passos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda - Formulário */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informações Básicas */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
                  <div className="space-y-6">
                    {/* Nome da Loja */}
                    <div>
                      <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Loja *
                      </label>
                      <input
                        id="store_name"
                        type="text"
                        value={form.store_name}
                        onChange={(e) => handleStoreNameChange(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="Ex: Minha Loja"
                      />
                    </div>

                    {/* Slug da Loja */}
                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                        URL da Loja *
                      </label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">beelink.com/</span>
                        <input
                          id="slug"
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                          required
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="minha-loja"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Esta será a URL da sua loja. Use apenas letras, números e hífens.
                      </p>
                    </div>

                    {/* Descrição */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição da Loja
                      </label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="Conte um pouco sobre sua loja..."
                      />
                    </div>

                    {/* Categoria */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria da Loja
                      </label>
                      <CategorySelector
                        value={form.category_id}
                        onChange={(categoryId) => setForm(prev => ({ ...prev, category_id: categoryId }))}
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
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-300 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {form.logo ? (
                        <div className="space-y-2">
                          <img 
                            src={form.logo} 
                            alt="Logo" 
                            className="w-20 h-20 mx-auto rounded-lg object-cover"
                          />
                          <p className="text-sm text-gray-600">Clique para alterar</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 mx-auto text-gray-400" />
                          <p className="text-sm text-gray-600">
                            {uploadingLogo ? 'Enviando...' : 'Clique para enviar logo'}
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Cores */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Cores da Loja</h2>
                  
                  {/* Cores Pré-definidas */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Escolha um tema pré-definido
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {predefinedColors.map((theme, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            colors: {
                              primary: theme.primary,
                              secondary: theme.secondary,
                              accent: theme.accent
                            }
                          }))}
                          className="p-3 border-2 rounded-lg hover:border-purple-500 transition-colors text-left"
                          style={{
                            borderColor: form.colors.primary === theme.primary ? '#8B5CF6' : '#E5E7EB'
                          }}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accent }}></div>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cores Personalizadas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Ou personalize suas cores
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Cor Primária</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={form.colors.primary}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              colors: { ...prev.colors, primary: e.target.value }
                            }))}
                            className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
                          />
                          <input
                            type="text"
                            value={form.colors.primary}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              colors: { ...prev.colors, primary: e.target.value }
                            }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Cor Secundária</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={form.colors.secondary}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              colors: { ...prev.colors, secondary: e.target.value }
                            }))}
                            className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
                          />
                          <input
                            type="text"
                            value={form.colors.secondary}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              colors: { ...prev.colors, secondary: e.target.value }
                            }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Cor de Destaque</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={form.colors.accent}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              colors: { ...prev.colors, accent: e.target.value }
                            }))}
                            className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
                          />
                          <input
                            type="text"
                            value={form.colors.accent}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              colors: { ...prev.colors, accent: e.target.value }
                            }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Redes Sociais */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociais</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp *
                      </label>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        <input
                          type="text"
                          value={form.social_networks.whatsapp}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            social_networks: { ...prev.social_networks, whatsapp: e.target.value }
                          }))}
                          required
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                          value={form.social_networks.instagram}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            social_networks: { ...prev.social_networks, instagram: e.target.value }
                          }))}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                          value={form.social_networks.tiktok}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            social_networks: { ...prev.social_networks, tiktok: e.target.value }
                          }))}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                          value={form.social_networks.spotify}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            social_networks: { ...prev.social_networks, spotify: e.target.value }
                          }))}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                          value={form.social_networks.youtube}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            social_networks: { ...prev.social_networks, youtube: e.target.value }
                          }))}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Link do seu canal YouTube"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLoading ? 'Criando loja...' : 'Criar Loja'}
                </button>
              </form>
            </div>

            {/* Coluna Direita - Preview da Vitrine */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Preview da sua Vitrine</h2>
              
              {/* Preview da página da loja */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header da vitrine */}
                <div 
                  className="h-40 flex flex-col items-center justify-center text-white font-bold text-xl relative"
                  style={{ 
                    background: `linear-gradient(135deg, ${form.colors.primary}, ${form.colors.secondary})`
                  }}
                >
                  {/* Logo */}
                  {form.logo && (
                    <div className="mb-3">
                      <img
                        src={form.logo}
                        alt="Logo"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Nome da loja */}
                  <div className="text-center">
                    <h1 className="text-xl font-bold">{form.store_name || 'Nome da Loja'}</h1>
                    {form.description && (
                      <p className="text-sm opacity-90 mt-1">{form.description}</p>
                    )}
                  </div>
                </div>

                {/* Conteúdo da vitrine */}
                <div className="p-6 bg-gray-50">
                  {/* Botões de ação */}
                  <div className="flex flex-col gap-3 mb-6">
                    <button 
                      className="w-full bg-white/90 hover:bg-white font-medium py-3 rounded-full text-sm backdrop-blur-sm flex items-center justify-center transition-all duration-300 shadow-lg"
                      style={{ color: form.colors.primary }}
                    >
                      <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center" style={{ 
                        backgroundColor: form.colors.primary
                      }}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 11V7a5 5 0 0110 0v4h2a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h2zm2-2h6V7a3 3 0 00-6 0v2z"/>
                        </svg>
                      </div>
                      Fale com a gente
                    </button>
                    
                    <button 
                      className="w-full bg-white/90 hover:bg-white font-medium py-3 rounded-full text-sm backdrop-blur-sm flex items-center justify-center transition-all duration-300 shadow-lg"
                      style={{ color: form.colors.primary }}
                    >
                      <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center" style={{ 
                        backgroundColor: form.colors.primary
                      }}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                        </svg>
                      </div>
                      a
                    </button>
                  </div>

                  {/* Redes sociais */}
                  <div className="flex justify-center space-x-3">
                    {form.social_networks.instagram && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: form.colors.primary }}>
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {form.social_networks.whatsapp && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: form.colors.secondary }}>
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {form.social_networks.tiktok && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: form.colors.accent }}>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                      </div>
                    )}
                    {form.social_networks.spotify && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: form.colors.primary }}>
                        <Music className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {form.social_networks.youtube && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: form.colors.secondary }}>
                        <Youtube className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Informações das cores */}
                  <div className="mt-6 p-4 bg-white rounded-lg border">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Cores da sua loja:</h3>
                    <div className="flex space-x-2 mb-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: form.colors.primary }}
                      >
                        P
                      </div>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: form.colors.secondary }}
                      >
                        S
                      </div>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: form.colors.accent }}
                      >
                        D
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Primária: {form.colors.primary}</p>
                      <p>Secundária: {form.colors.secondary}</p>
                      <p>Destaque: {form.colors.accent}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-20 left-4 w-24 h-24 bg-purple-100/50 rounded-full" />
        <div className="absolute top-32 right-8 w-16 h-16 bg-violet-100/50 rounded-full" />
        <div className="absolute bottom-40 left-8 w-28 h-28 bg-purple-100/30 rounded-full" />
        <div className="absolute bottom-60 right-12 w-36 h-36 bg-violet-100/30 rounded-full" />
        </div>
      </div>
    </ProtectedRoute>
  );
} 