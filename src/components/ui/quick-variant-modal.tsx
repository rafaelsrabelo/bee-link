'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Color {
  id: string;
  name: string;
  hex_code: string;
}

interface Size {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  colors_enabled?: boolean;
  sizes_enabled?: boolean;
  colors?: Color[];
  sizes?: Size[];
}

interface QuickVariantModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColor?: string | null, selectedSize?: string | null) => void;
  storeColors: {
    primary: string;
    background: string;
    text: string;
    header: string;
  };
}

export default function QuickVariantModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  storeColors
}: QuickVariantModalProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Reset state when product changes
  useEffect(() => {
    if (product && isOpen) {
      // Auto-select first options
      if (product.colors_enabled && product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0].name);
      } else {
        setSelectedColor(null);
      }
      
      if (product.sizes_enabled && product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0].name);
      } else {
        setSelectedSize(null);
      }
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const availableColors = product.colors || [];
  const availableSizes = product.sizes || [];

  const handleAddToCart = () => {
    // Validate required selections
    if (product.colors_enabled && availableColors.length > 0 && !selectedColor) {
      toast.error('Por favor, selecione uma cor.');
      return;
    }
    
    if (product.sizes_enabled && availableSizes.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho.');
      return;
    }

    onAddToCart(product, selectedColor, selectedSize);
    onClose();
  };

  const hasVariants = (product.colors_enabled && availableColors.length > 0) || 
                     (product.sizes_enabled && availableSizes.length > 0);

  // If no variants, add directly
  if (!hasVariants) {
    onAddToCart(product, null, null);
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Escolha as opções</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-medium text-gray-900">{product.name}</h4>
              <p className="text-lg font-bold" style={{ color: storeColors.primary }}>
                {product.price}
              </p>
            </div>
          </div>
        </div>

        {/* Variant Selection */}
        <div className="p-4 space-y-4">
          {/* Colors */}
          {product.colors_enabled && availableColors.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Escolha a cor:</h4>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`
                      flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 bg-white
                      ${selectedColor === color.name
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <span className="text-xs text-gray-700 text-center">
                      {color.name}
                    </span>
                    {selectedColor === color.name && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes_enabled && availableSizes.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Escolha o tamanho:</h4>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.name)}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium bg-white min-w-[50px]
                      ${selectedSize === size.name
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    {size.name}
                    {selectedSize === size.name && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: storeColors.primary }}
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
