"use client";

import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore';
import type { StoreData } from '../data';

interface CartPageClientProps {
  store: StoreData;
}

export default function CartPageClient({ store }: CartPageClientProps) {
  const { cart, getCartTotal, getCartItemCount, clearCart, removeFromCart } = useCartStore();

  // Verificar se o carrinho pertence à loja atual
  useEffect(() => {
    const cartStoreSlug = localStorage.getItem('cart-store-slug');
    if (cartStoreSlug && cartStoreSlug !== store.slug) {
      // Se o carrinho pertence a outra loja, limpar
      clearCart();
    }
  }, [store.slug, clearCart]);

  const handleWhatsAppClick = () => {
    if (cart.length === 0) return;

    const itemsList = cart.map(item => 
      `• ${item.name} - ${item.price} x${item.quantity}`
    ).join('\n');

    const total = getCartTotal().toFixed(2).replace('.', ',');
    
    const message = `Olá! Gostaria de fazer um pedido da ${store.store_name}:\n\n${itemsList}\n\n*Total: R$ ${total}*`;
    const whatsappUrl = `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp primeiro
    window.open(whatsappUrl, '_blank');
    
    // Limpar o carrinho e navegar de volta para a loja
    setTimeout(() => {
      clearCart();
      // Navegar de volta para a página principal da loja
      window.location.href = `/${store.slug}`;
    }, 500);
  };

  const handleBackToStore = () => {
    window.location.href = `/${store.slug}?showCatalog=true`;
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: store.colors.primary }}>




        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ backgroundColor: `${store.colors.primary}95` }}>
          <button
            type="button"
            className="text-white hover:bg-white/10 p-2 rounded-full transition-all"
            onClick={handleBackToStore}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="text-white font-medium">Carrinho</div>
            <div className="text-white/70 text-sm">{store.store_name}</div>
          </div>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="pt-20 pb-32 px-4 relative z-10">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: store.colors.secondary }}>
              <ShoppingCart className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-4">
              Carrinho vazio
            </h1>
            <p className="text-white/80 mb-8">
              Adicione produtos ao seu carrinho para continuar
            </p>
            <button
              onClick={() => {
                window.location.href = `/${store.slug}?showCatalog=true`;
              }}
              className="bg-white/90 hover:bg-white font-medium py-4 px-8 rounded-full text-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-xl"
              style={{ color: store.colors.primary }}
              type="button"
            >
              Ver produtos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: store.colors.primary }}>
      



      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ backgroundColor: `${store.colors.primary}95` }}>
        <button
          type="button"
          className="text-white hover:bg-white/10 p-2 rounded-full transition-all"
          onClick={handleBackToStore}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <div className="text-white font-medium">Carrinho</div>
          <div className="text-white/70 text-sm">{getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'itens'}</div>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="pt-20 pb-32 px-4 relative z-10">
        {/* Lista de produtos */}
        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <div
              key={item.name}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1" style={{ color: store.colors.primary }}>
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {item.price}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-lg" style={{ color: store.colors.accent }}>
                    x{item.quantity}
                  </span>
                  
                  <button
                    onClick={() => removeFromCart(item.name)}
                    className="text-red-500 hover:text-red-700 transition-all p-2 rounded-full hover:bg-red-50"
                    type="button"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold" style={{ color: store.colors.primary }}>
              Total
            </span>
            <span className="text-3xl font-bold" style={{ color: store.colors.accent }}>
              R$ {getCartTotal().toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Botão finalizar */}
        <button
          onClick={handleWhatsAppClick}
          className="w-full bg-green-600 text-white py-4 rounded-full font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-lg"
          type="button"
        >
          Finalizar Pedido no WhatsApp
        </button>
      </div>
    </div>
  );
} 