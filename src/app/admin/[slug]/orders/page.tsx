'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Bell } from 'lucide-react';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import LottieLoader from '../../../../components/ui/lottie-loader';
import AdminHeader from '../../../../components/ui/admin-header';
import OrdersDashboard from '../../../../components/ui/orders-dashboard';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';

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

export default function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
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
    if (!slug) return;
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
    } catch (error) {
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <div className="flex items-center justify-center min-h-screen">
            <LottieLoader 
              animationData={loadingAnimation}
              size="lg"
              text="Carregando..."
            />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!store) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loja não encontrada
              </h3>
              <p className="text-gray-600">
                A loja que você está procurando não existe.
              </p>
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
          currentPage="orders"
          title="Gerenciar Pedidos"
          icon={ShoppingBag}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OrdersDashboard 
            storeSlug={store.slug}
            storeId={store.id}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
} 