'use client';

import React, { useState, useEffect } from 'react';
import { StoreCategory } from '@/types/category';
import { Check, ChevronDown } from 'lucide-react';

interface CategorySelectorProps {
  value?: number;
  onChange: (categoryId: number) => void;
  placeholder?: string;
  className?: string;
}

export default function CategorySelector({ 
  value, 
  onChange, 
  placeholder = "Selecione uma categoria",
  className = "" 
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const selectedCategory = categories.find(cat => cat.id === value);

  const handleSelect = (categoryId: number) => {
    onChange(categoryId);
    setIsOpen(false);
  };

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
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedCategory.color }}
            >
              <span className="text-xs text-white">📦</span>
            </div>
            <span className="text-sm font-medium">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelect(category.id)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
                >
                  <span className="text-xs text-white">📦</span>
                </div>
                <div>
                  <span className="text-sm font-medium">{category.name}</span>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
              </div>
              {value === category.id && (
                <Check className="w-4 h-4 text-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 