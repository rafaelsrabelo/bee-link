'use client';

import { Bell } from 'lucide-react';
import { use } from 'react';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AdminHeader from '../../../../components/ui/admin-header';
import LottieLoader from '../../../../components/ui/lottie-loader';
import OrdersDashboard from '../../../../components/ui/orders-dashboard';
import { useAuth } from '../../../../contexts/AuthContext';
import { useStoreCache } from '../../../../hooks/useStoreCache';



export default function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const { slug } = use(params);
  
  // Usar cache para a loja
  const { store, loading: storeLoading, error: storeError } = useStoreCache(slug, user?.id);



  if (storeLoading || !user) {
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

  if (!store || storeError) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-24">
          <OrdersDashboard 
            storeSlug={store.slug}
            storeId={store.id}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
} 