'use client';

import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import OrderNotificationBadge from './order-notification-badge';

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

interface AdminHeaderProps {
  store?: Store | null;
  currentPage: 'dashboard' | 'products' | 'store' | 'orders' | 'reports' | 'delivery';
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function AdminHeader({ store: propStore, currentPage, title, icon: Icon }: AdminHeaderProps) {
  const { store: contextStore } = useStore();
  const store = propStore || contextStore;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Fechar menus quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
      if (!target.closest('.mobile-menu')) {
        setShowMobileMenu(false);
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
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{title}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-lg" style={{
      backgroundColor: store.colors.primary
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{title}</h1>
              <p className="text-purple-100 text-base">{store.name} - Gerencie sua loja</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navegação Desktop */}
            <div className="flex items-center space-x-2">
              {/* 1. Dashboard */}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
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
              
              {/* 2. Pedidos */}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={() => router.push(`/admin/${store.slug}/orders`)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 relative ${
                  isActive('orders') 
                    ? 'text-white bg-white/20 border-b-2 border-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1">
                  Pedidos

                  <OrderNotificationBadge 
                    storeSlug={store.slug} 
                    storeId={store.id}
                    className="text-white"
                  />
                </div>
              </button>
              
              {/* 3. Minha Loja */}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={() => router.push(`/admin/${store.slug}/store`)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('store') 
                    ? 'text-white bg-white/20 border-b-2 border-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Minha Loja
              </button>
              
              {/* 4. Produtos */}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
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
              
              {/* 5. Relatórios */}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={() => router.push(`/admin/${store.slug}/reports`)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('reports') 
                    ? 'text-white bg-white/20 border-b-2 border-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Relatórios
              </button>

              {/* 6. Entregas */}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={() => router.push(`/admin/${store.slug}/delivery`)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('delivery') 
                    ? 'text-white bg-white/20 border-b-2 border-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Entregas
              </button>

            </div>

            {/* User Menu Desktop */}
            <div className="relative user-menu">
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
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
                  {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
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

        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <p className="text-purple-100 text-xs">{store.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* User Menu Mobile */}
              <div className="relative user-menu">
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 p-2 text-white hover:bg-white/20 transition-colors rounded-lg"
                >
                  <User className="w-4 h-4" />
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900">{store.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button
                      onClick={async () => {
                        await signOut();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Hambúrguer */}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-white hover:bg-white/20 transition-colors rounded-lg mobile-menu"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 mobile-menu">
              <div className="space-y-2">
                {/* 1. Dashboard */}
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => {
                  router.push(`/admin/${store.slug}`);
                  setShowMobileMenu(false);
                }}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                    isActive('dashboard') 
                      ? 'text-white bg-white/20 border-l-4 border-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </button>
                
                {/* 2. Pedidos */}
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => {
                  router.push(`/admin/${store.slug}/orders`);
                  setShowMobileMenu(false);
                }}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                    isActive('orders') 
                      ? 'text-white bg-white/20 border-l-4 border-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    Pedidos
                    <OrderNotificationBadge 
                      storeSlug={store.slug} 
                      storeId={store.id}
                      className="text-white"
                    />
                  </div>
                </button>
                
                {/* 3. Minha Loja */}
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => {
                  router.push(`/admin/${store.slug}/store`);
                  setShowMobileMenu(false);
                }}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                    isActive('store') 
                      ? 'text-white bg-white/20 border-l-4 border-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Minha Loja
                </button>
                
                {/* 4. Produtos */}
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => {
                  router.push(`/admin/${store.slug}/products`);
                  setShowMobileMenu(false);
                }}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                    isActive('products') 
                      ? 'text-white bg-white/20 border-l-4 border-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Produtos
                </button>
                
                {/* 5. Relatórios */}
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => {
                  router.push(`/admin/${store.slug}/reports`);
                  setShowMobileMenu(false);
                }}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                    isActive('reports') 
                      ? 'text-white bg-white/20 border-l-4 border-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Relatórios
                </button>

                {/* 6. Entregas */}
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => {
                  router.push(`/admin/${store.slug}/delivery`);
                  setShowMobileMenu(false);
                }}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                    isActive('delivery') 
                      ? 'text-white bg-white/20 border-l-4 border-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Entregas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 