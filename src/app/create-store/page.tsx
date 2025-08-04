'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Store, Upload, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

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
}

const defaultColors = {
  primary: '#8B5CF6', // Purple
  secondary: '#7C3AED', // Violet
  accent: '#A855F7' // Purple-500
};

export default function CreateStorePage() {
  const [form, setForm] = useState<StoreForm>({
    store_name: '',
    slug: '',
    logo: '',
    colors: defaultColors,
    description: ''
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
    
    if (!form.store_name || !form.slug) {
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
        toast.success('Loja criada com sucesso!');
        router.push(`/admin/${store.slug}`);
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
        <main className="relative z-10 max-w-2xl mx-auto px-4 py-8">
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

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo da Loja
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cores da Loja
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Primária</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form.colors.primary}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={form.colors.primary}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value }
                        }))}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Secundária</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form.colors.secondary}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, secondary: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={form.colors.secondary}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, secondary: e.target.value }
                        }))}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Destaque</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form.colors.accent}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, accent: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={form.colors.accent}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, accent: e.target.value }
                        }))}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>
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