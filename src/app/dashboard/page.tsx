'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Plus, Store, LogOut, Settings, User, Package, Users, Eye } from 'lucide-react';
import Link from 'next/link';

interface Store {
  id: string;
  store_name: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  created_at: string;
}

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchStores();
      fetchTotalProducts();
    }
  }, [user, loading, router]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar lojas');
        return;
      }

      setStores(data || []);
    } catch (error) {
      toast.error('Erro ao carregar lojas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalProducts = async () => {
    try {
      
      // Buscar todas as lojas do usuário
      const { data: userStores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user?.id);

      if (storesError) {
        return;
      }


      if (!userStores || userStores.length === 0) {
        setTotalProducts(0);
        return;
      }

      // Buscar produtos de todas as lojas do usuário
      const storeIds = userStores.map(store => store.id);
      
      // Buscar produtos usando a query correta
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .in('store_id', storeIds);

      if (productsError) {
        return;
      }

      setTotalProducts(products?.length || 0);
    } catch {
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta!
          </h2>
          <p className="text-gray-600">
            Gerencie suas lojas e produtos aqui.
          </p>
        </div>

        {/* Stores Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Suas Lojas</h3>
            <button
              onClick={() => router.push('/dashboard/create-store')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Loja</span>
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma loja encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Crie sua primeira loja para começar a vender online.
              </p>
              <button
                onClick={() => router.push('/dashboard/create-store')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeira Loja
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div key={store.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: store.colors.secondary }}
                      >
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{store.store_name}</h4>
                        <p className="text-sm text-gray-500">/{store.slug}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/${store.slug}`}
                        target="_blank"
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-center hover:bg-gray-200 transition-colors"
                      >
                        Ver Loja
                      </Link>
                      <Link
                        href={`/${store.slug}/admin`}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm text-center hover:bg-blue-700 transition-colors"
                      >
                        Gerenciar
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produtos</p>
                <p className="text-2xl font-semibold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visitantes</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 