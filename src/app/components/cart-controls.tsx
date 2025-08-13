"use client";

import { Minus, Plus } from "lucide-react";
import { trackAddToCart, trackProductClick } from "../../lib/analytics";
import { useCartStore } from "../stores/cartStore";
import CartControlsLoading from "./cart-controls-loading";

interface CartControlsProps {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    description?: string;
    category?: string;
  };
  storeColors: {
    primary: string;
  };
  selectedSize?: string | null;
  selectedColor?: string | null;
  onAddToCart?: () => void;
}

export default function CartControls({ product, storeColors, selectedSize, selectedColor, onAddToCart }: CartControlsProps) {
  const { addToCart, removeFromCart, getCartItemQuantity, isLoading } = useCartStore();
  const quantity = getCartItemQuantity(product.name, selectedColor, selectedSize);

  // Mostra loading enquanto carrega os dados
  if (isLoading) {
    return <CartControlsLoading />;
  }

  const handleAddToCart = () => {
    // Se foi passada uma função personalizada, usar ela
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    // Adicionar produto com cor e tamanho selecionados
    const productWithVariants = {
      ...product,
      selectedColor,
      selectedSize
    };
    addToCart(productWithVariants);
    
    // Track add to cart event
    trackAddToCart({
      product_id: product.id,
      product_name: selectedSize ? `${product.name} - Tamanho ${selectedSize}` : product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category || '',
      is_direct_link: false,
      referrer: document.referrer
    });
  };

  const handleRemoveFromCart = () => {
    removeFromCart(product.name, selectedColor, selectedSize);
    
    // Track remove from cart event
    trackProductClick({
      product_id: product.id,
      product_name: product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category || '',
      is_direct_link: false,
      referrer: document.referrer
    });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl">
      <div className="flex items-center justify-center gap-6">
        {quantity > 0 && (
          <button
            type="button"
            onClick={handleRemoveFromCart}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white/30 transition-all border border-white/30"
            style={{ color: storeColors.primary }}
          >
            <Minus className="w-6 h-6" />
          </button>
        )}
        
        {quantity > 0 && (
          <span className="bg-white/95 backdrop-blur-sm text-lg font-medium px-6 py-2 rounded-full min-w-[60px] text-center shadow-sm" style={{ color: storeColors.primary }}>
            {quantity}
          </span>
        )}
        
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white/30 transition-all border border-white/30"
          style={{ color: storeColors.primary }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
} 