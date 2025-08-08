'use client';

import { 
  ArrowLeft, 
  Check,
  ChevronLeft,
  ChevronRight,
  Instagram, 
  Loader2, 
  MapPin,
  MessageCircle, 
  Music, 
  Search,
  Sparkles, 
  Store, 
  Upload, 
  Youtube
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import CategorySelector from '../../components/ui/category-selector';
import { useAuth } from '../../contexts/AuthContext';

interface StoreForm {
  store_name: string;
  slug: string;
  store_type: 'ecommerce' | 'restaurant';
  logo: string;
  colors: {
    text: string;
    header: string;
    primary: string;
    background: string;
  };
  description: string;
  category_id?: number;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  social_networks: {
    instagram: string;
    whatsapp: string;
    tiktok: string;
    spotify: string;
    youtube: string;
  };
}

const defaultColors = {
  text: "#1A202C",
  header: "#3b7af7", 
  primary: "#3b7af7",
  background: "#F0F9FF"
};

// Temas pré-definidos
const predefinedThemes = [
  {
    name: 'Azul Profissional',
    colors: {
      text: "#1A202C",
      header: "#3b7af7",
      primary: "#3b7af7", 
      background: "#F0F9FF"
    }
  },
  {
    name: 'Verde Natureza',
    colors: {
      text: "#1A202C",
      header: "#10B981",
      primary: "#10B981",
      background: "#F0FDF4"
    }
  },
  {
    name: 'Roxo Elegante',
    colors: {
      text: "#1A202C", 
      header: "#8B5CF6",
      primary: "#8B5CF6",
      background: "#FAF5FF"
    }
  },
  {
    name: 'Rosa Moderno',
    colors: {
      text: "#1A202C",
      header: "#EC4899", 
      primary: "#EC4899",
      background: "#FDF2F8"
    }
  },
  {
    name: 'Laranja Energia',
    colors: {
      text: "#1A202C",
      header: "#F97316",
      primary: "#F97316", 
      background: "#FFF7ED"
    }
  },
  {
    name: 'Vermelho Clássico',
    colors: {
      text: "#1A202C",
      header: "#EF4444",
      primary: "#EF4444",
      background: "#FEF2F2"
    }
  }
];

const steps = [
  { id: 1, title: 'Informações Básicas', icon: Store },
  { id: 2, title: 'Identidade Visual', icon: Sparkles },
  { id: 3, title: 'Endereço', icon: MapPin },
  { id: 4, title: 'Redes Sociais', icon: MessageCircle },
  { id: 5, title: 'Revisão', icon: Check }
];

export default function CreateStorePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<StoreForm>({
    store_name: '',
    slug: '',
    store_type: 'ecommerce',
    logo: '',
    colors: defaultColors,
    description: '',
    category_id: undefined,
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: ''
    },
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
  const [searchingCep, setSearchingCep] = useState(false);

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

  const searchCep = async (cep: string) => {
    if (!cep || cep.length < 8) return;
    
    setSearchingCep(true);
    try {
      // Remove caracteres não numéricos
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        toast.error('CEP deve ter 8 dígitos');
        return;
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      // Preencher os campos com os dados do CEP
      setForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          zip_code: cleanCep
        }
      }));

      toast.success('Endereço preenchido automaticamente!');
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setSearchingCep(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return form.store_name && form.slug && form.store_type;
      case 2:
        return true; // Opcional
      case 3:
        return form.address.street && form.address.number && form.address.city && form.address.state;
      case 4:
        return form.social_networks.whatsapp;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
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
        toast.success('Loja criada com sucesso!');
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

  const renderStepContent = () => {
    switch (currentStep) {
             case 1:
         return (
           <div className="space-y-6">
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
                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                 placeholder="Ex: Minha Loja"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                 Tipo de Comércio *
               </label>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button
                   type="button"
                   onClick={() => setForm(prev => ({ ...prev, store_type: 'ecommerce' }))}
                   className={`p-6 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
                     form.store_type === 'ecommerce'
                       ? 'border-blue-500 bg-blue-50 shadow-md'
                       : 'border-gray-200 hover:border-blue-300'
                   }`}
                 >
                   <div className="flex items-center space-x-3 mb-3">
                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                       form.store_type === 'ecommerce' ? 'bg-blue-500' : 'bg-gray-100'
                     }`}>
                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                       </svg>
                     </div>
                     <div>
                       <h3 className="font-semibold text-gray-900">E-commerce</h3>
                       <p className="text-sm text-gray-600">Produtos físicos</p>
                     </div>
                   </div>
                   <p className="text-sm text-gray-600">
                     Ideal para lojas que vendem produtos físicos, roupas, acessórios, eletrônicos, etc.
                   </p>
                 </button>

                 <button
                   type="button"
                   onClick={() => setForm(prev => ({ ...prev, store_type: 'restaurant' }))}
                   className={`p-6 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
                     form.store_type === 'restaurant'
                       ? 'border-blue-500 bg-blue-50 shadow-md'
                       : 'border-gray-200 hover:border-blue-300'
                   }`}
                 >
                   <div className="flex items-center space-x-3 mb-3">
                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                       form.store_type === 'restaurant' ? 'bg-blue-500' : 'bg-gray-100'
                     }`}>
                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zM6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01" />
                       </svg>
                     </div>
                     <div>
                       <h3 className="font-semibold text-gray-900">Restaurante</h3>
                       <p className="text-sm text-gray-600">Comida e bebidas</p>
                     </div>
                   </div>
                   <p className="text-sm text-gray-600">
                     Perfeito para restaurantes, lanchonetes, pizzarias, docerias e delivery de comida.
                   </p>
                 </button>
               </div>
             </div>

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
                   className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                   placeholder="minha-loja"
                 />
               </div>
               <p className="text-sm text-gray-500 mt-1">
                 Esta será a URL da sua loja. Use apenas letras, números e hífens.
               </p>
             </div>

             <div>
               <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                 Descrição da Loja
               </label>
               <textarea
                 id="description"
                 value={form.description}
                 onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                 rows={3}
                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                 placeholder="Conte um pouco sobre sua loja..."
               />
             </div>

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
             </div>
           </div>
         );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo da Loja</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
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

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tema de Cores</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Escolha um tema pré-definido
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {predefinedThemes.map((theme, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        colors: theme.colors
                      }))}
                      className="p-3 border-2 rounded-lg hover:border-blue-500 transition-colors text-left"
                      style={{
                        borderColor: form.colors.primary === theme.colors.primary ? '#3b7af7' : '#E5E7EB'
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.header }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.background }}></div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ou personalize suas cores
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                      />
                      <input
                        type="text"
                        value={form.colors.primary}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Cor do Header</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form.colors.header}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, header: e.target.value }
                        }))}
                        className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                      />
                      <input
                        type="text"
                        value={form.colors.header}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, header: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Cor do Texto</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form.colors.text}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, text: e.target.value }
                        }))}
                        className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                      />
                      <input
                        type="text"
                        value={form.colors.text}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, text: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Cor de Fundo</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form.colors.background}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, background: e.target.value }
                        }))}
                        className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                      />
                      <input
                        type="text"
                        value={form.colors.background}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          colors: { ...prev.colors, background: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                  Rua *
                </label>
                <input
                  id="street"
                  type="text"
                  value={form.address.street}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Rua das Flores"
                />
              </div>

              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                  Número *
                </label>
                <input
                  id="number"
                  type="text"
                  value={form.address.number}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, number: e.target.value }
                  }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="123"
                />
              </div>
            </div>

            <div>
              <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                id="complement"
                type="text"
                value={form.address.complement}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  address: { ...prev.address, complement: e.target.value }
                }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Apto 101, Bloco B"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  value={form.address.neighborhood}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, neighborhood: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Centro"
                />
              </div>

                             <div>
                 <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                   CEP
                 </label>
                 <div className="flex space-x-2">
                   <input
                     id="zip_code"
                     type="text"
                     value={form.address.zip_code}
                     onChange={(e) => setForm(prev => ({
                       ...prev,
                       address: { ...prev.address, zip_code: e.target.value }
                     }))}
                     onBlur={(e) => {
                       if (e.target.value.length >= 8) {
                         searchCep(e.target.value);
                       }
                     }}
                     className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                     placeholder="12345-678"
                     maxLength={9}
                   />
                   <button
                     type="button"
                     onClick={() => searchCep(form.address.zip_code)}
                     disabled={searchingCep || !form.address.zip_code}
                     className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                   >
                     {searchingCep ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                       <Search className="w-5 h-5" />
                     )}
                   </button>
                 </div>
                 <p className="text-sm text-gray-500 mt-1">
                   Digite o CEP e clique na lupa ou pressione Tab para buscar automaticamente
                 </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.address.city}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <input
                  id="state"
                  type="text"
                  value={form.address.state}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="SP"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
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
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="(11) 99999-9999"
                />
              </div>
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
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Link do seu canal YouTube"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da sua loja</h3>
              
                             <div className="space-y-4">
                 <div>
                   <h4 className="font-medium text-gray-900">Informações Básicas</h4>
                   <p className="text-gray-600">Nome: {form.store_name}</p>
                   <p className="text-gray-600">URL: beelink.com/{form.slug}</p>
                   <p className="text-gray-600">Tipo: {form.store_type === 'ecommerce' ? 'E-commerce' : 'Restaurante'}</p>
                   {form.description && <p className="text-gray-600">Descrição: {form.description}</p>}
                 </div>

                <div>
                  <h4 className="font-medium text-gray-900">Endereço</h4>
                  <p className="text-gray-600">
                    {form.address.street}, {form.address.number}
                    {form.address.complement && `, ${form.address.complement}`}
                  </p>
                  <p className="text-gray-600">
                    {form.address.neighborhood && `${form.address.neighborhood}, `}
                    {form.address.city} - {form.address.state}
                    {form.address.zip_code && `, ${form.address.zip_code}`}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Contato</h4>
                  <p className="text-gray-600">WhatsApp: {form.social_networks.whatsapp}</p>
                  {form.social_networks.instagram && <p className="text-gray-600">Instagram: {form.social_networks.instagram}</p>}
                </div>

                {form.logo && (
                  <div>
                    <h4 className="font-medium text-gray-900">Logo</h4>
                    <img src={form.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover mt-2" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Pronto para criar sua loja?</strong> Clique em &quot;Criar Loja&quot; para finalizar o processo.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Bee Link
                  </h1>
                  <p className="text-sm text-gray-600">Sua loja em um link</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Criar sua loja
            </h1>
            <p className="text-xl text-gray-600">
              Configure sua loja online em poucos passos
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-1 mx-4 transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-gray-600">
                {currentStep === 1 && "Informações básicas da sua loja"}
                {currentStep === 2 && "Personalize a aparência da sua loja"}
                {currentStep === 3 && "Informe o endereço da sua loja"}
                {currentStep === 4 && "Conecte suas redes sociais"}
                {currentStep === 5 && "Revise e confirme as informações"}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !validateCurrentStep()}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLoading ? 'Criando loja...' : 'Criar Loja'}
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-4 w-24 h-24 bg-blue-100/50 rounded-full" />
          <div className="absolute top-32 right-8 w-16 h-16 bg-indigo-100/50 rounded-full" />
          <div className="absolute bottom-40 left-8 w-28 h-28 bg-blue-100/30 rounded-full" />
          <div className="absolute bottom-60 right-12 w-36 h-36 bg-indigo-100/30 rounded-full" />
        </div>
      </div>
    </ProtectedRoute>
  );
} 