"use client";

import { Minus, Plus } from "lucide-react";
import { useCartStore } from "../stores/cartStore";
import CartControlsLoading from "./cart-controls-loading";

interface CartControlsProps {
  product: {
    name: string;
    price: string;
    image: string;
    description?: string;
  };
  storeColors: {
    primary: string;
  };
}

export default function CartControls({ product, storeColors }: CartControlsProps) {
  const { addToCart, removeFromCart, getCartItemQuantity, isLoading } = useCartStore();
  const quantity = getCartItemQuantity(product.name);

  // Mostra loading enquanto carrega os dados
  if (isLoading) {
    return <CartControlsLoading />;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl">
      <div className="flex items-center justify-center gap-6">
        {quantity > 0 && (
          <button
            type="button"
            onClick={() => removeFromCart(product.name)}
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
          onClick={() => addToCart(product)}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white/30 transition-all border border-white/30"
          style={{ color: storeColors.primary }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
} 