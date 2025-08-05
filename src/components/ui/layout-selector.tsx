'use client';

import React, { useState, useEffect } from 'react';
import { StoreLayout, LayoutType } from '@/types/layout';
import { Check, Image, Type } from 'lucide-react';

interface LayoutSelectorProps {
  value?: LayoutType;
  onChange: (layoutType: LayoutType) => void;
  showCategory?: boolean;
  onShowCategoryChange?: (show: boolean) => void;
  className?: string;
}

export default function LayoutSelector({ 
  value = 'default', 
  onChange, 
  showCategory = false,
  onShowCategoryChange,
  className = "" 
}: LayoutSelectorProps) {
  const [layouts, setLayouts] = useState<StoreLayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const response = await fetch('/api/layouts');
        if (response.ok) {
          const data = await response.json();
          setLayouts(data);
        }
      } catch (error) {
        console.error('Erro ao buscar layouts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayouts();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Seleção de Layout */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Layout da Loja
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => onChange(layout.slug as LayoutType)}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                value === layout.slug
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Preview do Layout */}
              <div className="mb-3">
                <div className="w-full h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  {layout.slug === 'default' ? (
                    <div className="text-center">
                      <Type className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 font-medium">CATÁLOGO</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 font-medium">BANNER</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do Layout */}
              <div className="text-left">
                <h3 className="font-medium text-gray-900 mb-1">{layout.name}</h3>
                <p className="text-xs text-gray-500">{layout.description}</p>
              </div>

              {/* Indicador de seleção */}
              {value === layout.slug && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Opção de Mostrar por Categoria */}
      {onShowCategoryChange && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Organização dos Produtos
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="show-category"
              checked={showCategory}
              onChange={(e) => onShowCategoryChange(e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="show-category" className="text-sm text-gray-700">
              Mostrar produtos organizados por categoria
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Quando ativado, os produtos serão agrupados por categoria com títulos
          </p>
        </div>
      )}
    </div>
  );
} 