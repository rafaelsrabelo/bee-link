'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Package } from 'lucide-react';

interface ProductCategory {
  id: number;
  name: string;
  name_pt: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

interface ProductCategorySelectorProps {
  value?: number;
  onChange: (categoryId: number) => void;
  placeholder?: string;
  className?: string;
  colors?: {
    primary: string;
    text: string;
    header: string;
    background: string;
  };
}

export default function ProductCategorySelector({ 
  value, 
  onChange, 
  placeholder = "Selecionar categoria",
  className = "",
  colors
}: ProductCategorySelectorProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/product-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const selectedCategory = categories.find(cat => cat.id === value);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:border-transparent"
        style={{ 
          '--tw-ring-color': colors?.primary || '#8B5CF6',
          '--tw-ring-opacity': '0.5',
          '--tw-ring-offset-shadow': '0 0 #0000',
          '--tw-ring-shadow': '0 0 0 3px var(--tw-ring-color)',
          boxShadow: 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)'
        } as React.CSSProperties}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedCategory ? (
              <>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                ></div>
                <span className="text-sm text-gray-900">{selectedCategory.name_pt}</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {categories.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Nenhuma categoria disponível
            </div>
          ) : (
            <div className="py-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange(category.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm text-gray-900">{category.name_pt}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 