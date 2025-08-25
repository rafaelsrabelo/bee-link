'use client';

import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { trackAddToCart } from '../../lib/analytics';
import { fixCorruptedPrice, formatPriceFromCents } from '../../lib/price-utils';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  category_id?: number;
  category_data?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
  };
  description?: string;
  readyToShip?: boolean;
  available?: boolean;
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  getCartItemQuantity: (productName: string) => number;
  storeColors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
}

export default function ProductModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  getCartItemQuantity,
  storeColors 
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  const currentQuantity = getCartItemQuantity(product.name);

  const handleAddToCart = () => {
    // Track add to cart event
    trackAddToCart({
      product_id: product.id,
      product_name: product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category_data?.name || product.category,
      is_direct_link: false,
      referrer: document.referrer
    });

    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Detalhes do Produto</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Product Image */}
          <div className="relative aspect-square">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.readyToShip && (
              <div className="absolute top-4 left-4">
                <div 
                  className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-sm border"
                  style={{ 
                    color: storeColors.primary,
                    borderColor: storeColors.primary 
                  }}
                >
                  ✓ Pronta entrega
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-2xl font-bold" style={{ color: storeColors.primary }}>
                {formatPriceFromCents(fixCorruptedPrice(product.price))}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Category */}
            {product.category_data?.name && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Categoria</h4>
                <span 
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: `${storeColors.primary}20`,
                    color: storeColors.primary 
                  }}
                >
                  {product.category_data.name}
                </span>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Quantidade</h4>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-50"
                  style={{ 
                    borderColor: storeColors.primary,
                    color: storeColors.primary 
                  }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <span className="text-xl font-semibold text-gray-900 min-w-[3rem] text-center">
                  {quantity}
                </span>
                
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={{ 
                    borderColor: storeColors.primary,
                    color: storeColors.primary 
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Cart Quantity */}
            {currentQuantity > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">
                  Você já tem <strong>{currentQuantity}</strong> {currentQuantity === 1 ? 'unidade' : 'unidades'} no carrinho
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full py-3 px-4 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 transition-colors"
            style={{ backgroundColor: storeColors.primary }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Adicionar ao Carrinho</span>
          </button>
        </div>
      </div>
    </div>
  );
}
