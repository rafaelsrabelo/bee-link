'use client';

import React from 'react';
import { Store } from '@/contexts/StoreContext';
import { LayoutType } from '@/types/layout';
import Image from 'next/image';

interface StorePreviewProps {
  store: Store;
  layoutType: LayoutType;
  className?: string;
  isLivePreview?: boolean;
}

export default function StorePreview({ store, layoutType, className = "", isLivePreview = false }: StorePreviewProps) {
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
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Imagem</span>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-900 mb-1">Round bag</p>
                    <p className="text-sm text-gray-600">R$ 99,99</p>
                    <button 
                      className="w-full mt-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                    >
                      +
                    </button>
                  </div>
                </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Imagem</span>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-900 mb-1">Bolsa média</p>
                    <p className="text-sm text-gray-600">R$ 69,99</p>
                    <button 
                      className="w-full mt-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Produtos sem organização por categoria */
          <div className="grid grid-cols-2 gap-3">
            {/* Produto 1 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Imagem</span>
              </div>
              <div className="p-2">
                <p className="text-sm font-medium text-gray-900 mb-1">Round bag</p>
                <p className="text-sm text-gray-600">R$ 99,99</p>
                <div className="flex items-center space-x-1 mt-2">
                                      <button 
                      className="w-6 h-6 rounded text-xs text-white"
                      style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                    >
                      -
                    </button>
                  <span className="text-xs">4</span>
                  <button 
                    className="w-6 h-6 rounded text-xs text-white"
                    style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Produto 2 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Imagem</span>
              </div>
              <div className="p-2">
                <p className="text-sm font-medium text-gray-900 mb-1">Bolsa média</p>
                <p className="text-sm text-gray-600">R$ 69,99</p>
                <button 
                  className="w-full mt-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: store.colors?.primary || '#8B5CF6' }}
                >
                  +
                </button>
              </div>
            </div>
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