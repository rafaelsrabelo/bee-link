"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/cartStore";
import CartLoading from "./cart-loading";

interface CartHeaderProps {
  onCheckout: () => void;
  className?: string;
}

export default function CartHeader({ onCheckout, className = "" }: CartHeaderProps) {
  const { cart, getCartTotal, getCartItemCount, isLoading } = useCartStore();

  // Mostra loading enquanto carrega os dados
  if (isLoading) {
    return <CartLoading />;
  }

  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      {cart.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
          <span className="text-white/90 text-xs font-medium">
            R$ {getCartTotal().toFixed(2).replace('.', ',')}
          </span>
        </div>
      )}
      <button
        type="button"
        className="text-white hover:bg-white/10 p-2 rounded-full relative transition-all"
        onClick={onCheckout}
        disabled={cart.length === 0}
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white/50">
            {getCartItemCount()}
          </span>
        )}
      </button>
    </div>
  );
} 