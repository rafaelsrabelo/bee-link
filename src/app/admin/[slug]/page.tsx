'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Package, Settings, Store, BarChart3, Users, ShoppingCart, Plus, LogOut, User } from 'lucide-react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import LottieLoader from '../../../components/ui/lottie-loader';
import AdminHeader from '../../../components/ui/admin-header';
import loadingAnimation from '../../../../public/animations/loading-dots-blue.json';

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  user_id: string;
}

export default function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const router = useRouter();
  const { slug } = use(params);

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user, slug]);

  const loadStore = async () => {
    setLoading(true);
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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !store) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
          <LottieLoader 
            animationData={loadingAnimation}
            text="Carregando..."
          />
        </div>
      </ProtectedRoute>
    );
  }

  const adminCards = [
    {
      title: 'Gerenciar Produtos',
      description: 'Adicione, edite e remova produtos da sua loja',
      icon: Package,
      href: `/admin/${slug}/products`,
      color: store.colors.primary
    },
    {
      title: 'Configurações da Loja',
      description: 'Personalize cores, redes sociais e informações',
      icon: Settings,
      href: `/admin/${slug}/store`,
      color: store.colors.secondary
    },
    {
      title: 'Visualizar Loja',
      description: 'Veja como sua loja aparece para os clientes',
      icon: Store,
      href: `/${slug}`,
      color: store.colors.accent,
      external: true
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <AdminHeader
          store={store}
          currentPage="dashboard"
          title="Painel Administrativo"
          icon={Store}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bem-vindo ao seu painel administrativo!
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Gerencie seus produtos, personalize sua loja e acompanhe o desempenho da sua vitrine online.
            </p>
          </div>

          {/* Admin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {adminCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer group"
                onClick={() => {
                  if (card.external) {
                    window.open(card.href, '_blank');
                  } else {
                    router.push(card.href as any);
                  }
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="p-3 rounded-lg group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: `${card.color}10` }}
                  >
                    <card.icon 
                      className="w-6 h-6" 
                      style={{ color: card.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: card.color }}>
                    {card.external ? 'Abrir em nova aba' : 'Acessar'}
                  </span>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: `${card.color}10` }}
                  >
                    <svg 
                      className="w-4 h-4" 
                      style={{ color: card.color }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Ações Rápidas</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push(`/admin/${slug}/products`)}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Adicionar Produto</h4>
                  <p className="text-sm text-gray-600">Cadastre um novo produto na sua loja</p>
                </div>
              </button>
              
              <button
                onClick={() => router.push(`/admin/${slug}/store`)}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Configurar Loja</h4>
                  <p className="text-sm text-gray-600">Personalize cores e informações</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 