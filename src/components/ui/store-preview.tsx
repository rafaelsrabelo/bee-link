'use client';

import type { Store } from '@/contexts/StoreContext';
import type { LayoutType } from '@/types/layout';
import Image from 'next/image';
import React from 'react';

interface StorePreviewProps {
  store: Store;
  layoutType: LayoutType;
  className?: string;
  isLivePreview?: boolean;
}

export default function StorePreview({ store, layoutType, className = "", isLivePreview = false }: StorePreviewProps) {
  // Função para renderizar cards baseado no layout
  const renderProductCard = (productName: string, price: string, isHorizontal = false) => {
    if (isHorizontal) {
      // Card Horizontal - sem borda, mais limpo
      return (
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="flex space-x-3 p-3">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 text-xs">IMG</span>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">{productName}</p>
                <p className="text-sm font-semibold" style={{ color: store.colors?.primary || '#8B5CF6' }}>{price}</p>
              </div>
              <div className="flex justify-end">
                <button 
                  className="w-8 h-8 rounded-full text-sm text-white font-bold flex items-center justify-center"
                  style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Card Vertical (padrão)
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Imagem</span>
        </div>
        <div className="p-2">
          <p className="text-sm font-medium text-gray-900 mb-1">{productName}</p>
          <p className="text-sm text-gray-600">{price}</p>
          <button 
            className="w-full mt-2 py-1 rounded text-xs text-white"
            style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const cardLayout = store.layout_settings?.card_layout || 'grid';
  const isHorizontalLayout = cardLayout === 'horizontal';

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header do Preview */}
      <div className="bg-gray-50 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            {isLivePreview && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">LIVE</span>
              </div>
            )}
            <div className="text-xs text-gray-500">
              Preview - {layoutType === 'default' ? 'Layout Padrão' : 'Layout Banner'}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do Preview */}
      <div className="p-4">
        {/* Header da Loja */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {store.logo && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={store.logo}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold" style={{ color: store.colors?.text || '#1A202C' }}>{store.name}</h1>
              <p className="text-sm text-gray-500">bee-link.vercel.app/{store.slug}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
            >
              R$ 569,93
            </div>
                          <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                >
                  <span className="text-sm">🛒</span>
                </div>
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                >
                  <span className="text-xs">7</span>
                </div>
              </div>
          </div>
        </div>

        {/* Layout Específico */}
        {layoutType === 'default' ? (
          /* Layout Default - Título "Catálogo" */
          <div className="mb-4">
            <div 
              className="rounded-lg px-4 py-3 flex items-center justify-between text-white"
              style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
            >
              <span className="font-medium">CATÁLOGO</span>
                              <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                >
                {store.name?.charAt(0) || 'L'}
              </div>
            </div>
          </div>
        ) : (
          /* Layout Banner - Imagem do Banner */
          <div className="mb-4">
            {store.banner_image ? (
              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={store.banner_image}
                  alt="Banner"
                  width={400}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div 
                className="w-full h-24 rounded-lg flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
              >
                Banner da Loja
              </div>
            )}
          </div>
        )}

        {/* Produtos de Exemplo */}
        {store.show_products_by_category ? (
          /* Produtos organizados por categoria */
          <div className="space-y-4">
            {/* Categoria 1 */}
            <div>
              <h3 
                className="text-sm font-semibold mb-2"
                style={{ color: store.colors?.text || '#1A202C' }}
              >
                Categoria 1
              </h3>
              <div className={isHorizontalLayout ? 'space-y-2' : 'grid grid-cols-2 gap-3'}>
                {renderProductCard('Produto 1', 'R$ 99,99', isHorizontalLayout)}
              </div>
            </div>

            {/* Categoria 2 */}
            <div>
              <h3 
                className="text-sm font-semibold mb-2"
                style={{ color: store.colors?.text || '#1A202C' }}
              >
                Categoria 2
              </h3>
              <div className={isHorizontalLayout ? 'space-y-2' : 'grid grid-cols-2 gap-3'}>
                {renderProductCard('Produto 2', 'R$ 69,99', isHorizontalLayout)}
              </div>
            </div>
          </div>
        ) : (
          /* Produtos sem organização por categoria */
          <div className={isHorizontalLayout ? 'space-y-2' : 'grid grid-cols-2 gap-3'}>
            {renderProductCard('Produto 1', 'R$ 99,99', isHorizontalLayout)}
            {renderProductCard('Produto 2', 'R$ 69,99', isHorizontalLayout)}
          </div>
        )}

        {/* Footer do Preview */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Preview da loja {store.name}
          </div>
        </div>
      </div>
    </div>
  );
} 