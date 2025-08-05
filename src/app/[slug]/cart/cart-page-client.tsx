"use client";

import { ArrowLeft, MessageCircle, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { useCartStore } from '../../stores/cartStore';
import type { StoreData } from '../data';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  description: string;
  readyToShip?: boolean;
  available?: boolean;
}

interface CartPageClientProps {
  store: StoreData;
}

export default function CartPageClient({ store }: CartPageClientProps) {
  const { cart, getCartTotal, getCartItemCount, clearCart, removeFromCart, addToCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);

  // Carregar produtos da API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`/api/stores/${store.slug}/products`);
        if (response.ok) {
          const productsData = await response.json();
          setProducts(productsData || []);
        }
      } catch {
        setProducts([]);
      }
    };
    
    loadProducts();
  }, [store.slug]);

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
    
    // Limpar carrinho antes de abrir WhatsApp
    clearCart();
    
    // Abrir WhatsApp diretamente
                    const whatsappUrl = store.social_networks?.whatsapp 
                  ? `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`
                  : '#';
    
    // Para WebViews do Instagram, usar location.href é mais confiável
    if (typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('instagram')) {
      window.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, '_blank');
    }
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
                      {cart.map((item) => {
              // Encontrar a imagem do produto baseado no nome
              const product = products.find((p: Product) => p.name === item.name);
              const productImage = product?.image || '/logo.png';
            
            return (
              <div
                key={item.name}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Imagem do produto */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                    <Image
                      src={productImage}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                  
                  {/* Informações do produto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate" style={{ color: store.colors.primary }}>
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {item.price}
                    </p>
                    
                    {/* Controles de quantidade */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              removeFromCart(item.name);
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all"
                          style={{ color: store.colors.primary }}
                        >
                          <span className="text-sm font-bold">−</span>
                        </button>
                        <span className="font-semibold text-sm min-w-[20px] text-center" style={{ color: store.colors.primary }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const product = products.find((p: Product) => p.name === item.name);
                            if (product) {
                              addToCart(product);
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all"
                          style={{ color: store.colors.primary }}
                        >
                          <span className="text-sm font-bold">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preço total e botão remover */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold text-lg" style={{ color: store.colors.accent }}>
                        R$ {(Number.parseFloat(item.price.replace(/[^\d,]/g, '').replace(',', '.')) * item.quantity).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.name)}
                      className="text-red-500 hover:text-red-700 transition-all p-2 rounded-full hover:bg-red-50 hover:scale-110"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold" style={{ color: store.colors.primary }}>
              Resumo do Pedido
            </span>
            <span className="text-sm text-gray-500">
              {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'itens'}
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            {cart.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-medium" style={{ color: store.colors.primary }}>
                  R$ {(Number.parseFloat(item.price.replace(/[^\d,]/g, '').replace(',', '.')) * item.quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold" style={{ color: store.colors.primary }}>
                Total
              </span>
              <span className="text-3xl font-bold" style={{ color: store.colors.accent }}>
                R$ {getCartTotal().toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Botão finalizar */}
        <button
          onClick={handleWhatsAppClick}
          className="w-full bg-green-600 text-white py-5 rounded-full font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-3 group"
          type="button"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle className="w-4 h-4" />
          </div>
          Finalizar Pedido no WhatsApp
        </button>
      </div>
    </div>
  );
} 