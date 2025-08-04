'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

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

interface AdminHeaderProps {
  store?: Store | null;
  currentPage: 'dashboard' | 'products' | 'store';
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function AdminHeader({ store: propStore, currentPage, title, icon: Icon }: AdminHeaderProps) {
  const { store: contextStore } = useStore();
  const store = propStore || contextStore;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Fechar menu do usuário quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (page: string) => currentPage === page;

  // Se a loja ainda não foi carregada, mostrar loading
  if (!store) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="text-purple-100 text-sm sm:text-base">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg" style={{
      background: `linear-gradient(to right, ${store.colors.primary}, ${store.colors.secondary})`
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="text-purple-100 text-sm sm:text-base">{store.name} - Gerencie sua loja</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navegação */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push(`/admin/${store.slug}`)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('dashboard') 
                    ? 'text-white bg-white/20 border-b-2 border-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push(`/admin/${store.slug}/products`)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('products') 
                    ? 'text-white bg-white/20 border-b-2 border-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Produtos
              </button>
              <button
                onClick={() => router.push(`/admin/${store.slug}/store`)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('store') 
                    ? 'text-white bg-white/20 border-b-2 border-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Configurações
              </button>
            </div>

            {/* User Menu */}
            <div className="relative user-menu">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-white hover:bg-white/20 transition-colors rounded-lg"
              >
                <User className="w-5 h-5" />
                <div className="text-right">
                  <p className="text-sm font-medium">{store.name}</p>
                  <p className="text-xs text-white/70">{user?.email}</p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={async () => {
                      await signOut();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 