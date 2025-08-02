"use client";

import { ArrowLeft, ExternalLink, Instagram, MessageCircle, Minus, Phone, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { StoreData } from './data';

interface StorePageClientProps {
  store: StoreData;
}

interface CartItem {
  name: string;
  price: string;
  image: string;
  quantity: number;
}

export default function StorePageClient({ store }: StorePageClientProps) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: { name: string; price: string; image: string }) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.name === product.name);
      if (existingItem) {
        return prevCart.map(item =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productName: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.name === productName);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.name === productName
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(item => item.name !== productName);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = Number.parseFloat(item.price.replace('R$ ', '').replace(',', '.'));
      return total + (price * item.quantity);
    }, 0);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    const itemsList = cart.map(item => 
      `• ${item.name} - ${item.price} x${item.quantity}`
    ).join('\n');

    const total = getCartTotal().toFixed(2).replace('.', ',');
    
    const message = `Olá! Gostaria de fazer um pedido da ${store.store_name}:\n\n${itemsList}\n\n*Total: R$ ${total}*`;
    const whatsappUrl = `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleWhatsAppClick = (product: { name: string; price: string }) => {
    const message = `Olá! Gostaria de saber mais sobre a ${product.name} por ${product.price} da ${store.store_name}`;
    const whatsappUrl = `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (showCatalog) {
    return (
      <div className="min-h-screen bg-[#856342] relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4 fixed top-0 left-0 right-0 z-50 bg-[#856342]/95 backdrop-blur-sm border-b border-white/10">
          <button
            type="button"
            className="text-white hover:bg-white/10 p-2 rounded-full"
            onClick={() => setShowCatalog(false)}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="text-white font-medium">Catálogo</div>
            <div className="text-white/70 text-sm">{store.store_name}</div>
          </div>
          <div className="relative flex items-center gap-3">
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
              onClick={handleWhatsAppCheckout}
              disabled={cart.length === 0}
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white/50">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Catalog Header */}
        <div className="px-4 mb-6 pt-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-4 flex items-center justify-between">
            <span className="text-[#856342] font-medium text-lg">CATÁLOGO</span>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#6B4F35] to-[#A67C52] flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-4 pb-20 pt-10">
          <div className="grid grid-cols-2 gap-3">
            {store.products.map((product, index) => {
              const cartItem = cart.find(item => item.name === product.name);
              const quantity = cartItem?.quantity || 0;

              return (
                <div
                  key={`product-${product.name}-${index}`}
                  className="relative rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3 pb-4">
                    <h3 className="text-white font-medium text-sm mb-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-white/90 font-bold text-lg mb-3">
                      {product.price}
                    </p>

                    {/* Cart Controls */}
                    <div className="flex items-center justify-center gap-4">
                      {quantity > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(product.name);
                          }}
                          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white/30 transition-all border border-white/30"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                      )}
                      
                      {quantity > 0 && (
                        <span className="bg-white/95 backdrop-blur-sm text-[#856342] text-sm font-medium px-3 py-1 rounded-full min-w-[28px] text-center shadow-sm">
                          {quantity}
                        </span>
                      )}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white/30 transition-all border border-white/30"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#856342] relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/lessari/background.png"
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#856342]/80" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-4 w-24 h-24 bg-white/20 rounded-full" />
        <div className="absolute top-32 right-8 w-16 h-16 bg-white/15 rounded-full" />
        <div className="absolute top-48 left-12 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute top-64 right-4 w-20 h-20 bg-white/20 rounded-full" />
        <div className="absolute bottom-40 left-8 w-28 h-28 bg-white/15 rounded-full" />
        <div className="absolute bottom-60 right-12 w-36 h-36 bg-white/10 rounded-full" />

        {/* Marble texture elements */}
        <div className="absolute top-40 right-0 w-40 h-40 bg-white/30 rounded-full transform translate-x-20" />
        <div className="absolute bottom-20 left-0 w-48 h-48 bg-white/25 rounded-full transform -translate-x-24" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-4 pb-8 relative z-10">
       
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center px-6 relative z-10">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-48 h-48 bg-[#6B4F35] rounded-full flex items-center justify-center relative overflow-hidden">
            <Image
              src="/lessari/logo.jpeg"
              alt="Lessari Logo"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Brand Name and Tagline */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-light mb-2">{store.store_name}</h1>
          <p className="text-white/80 text-sm tracking-wide">{store.description}</p>
        </div>

        {/* Social Icons */}
        <div className="flex gap-6 mb-12">
          <a
            href={`https://instagram.com/${store.social_networks.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:bg-white/10 w-12 h-12 rounded-full flex items-center justify-center"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:bg-white/10 w-12 h-12 rounded-full flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4 mb-8">
          <button 
            type="button"
            onClick={cart.length > 0 ? handleWhatsAppCheckout : () => {
              const message = `Olá! Gostaria de saber mais sobre os produtos da ${store.store_name}`;
              const whatsappUrl = `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className={`w-full font-medium py-4 rounded-full text-lg backdrop-blur-sm flex items-center justify-center transition-all ${
              cart.length > 0 
                ? 'bg-white/90 hover:bg-white text-[#856342] shadow-lg hover:shadow-xl' 
                : 'bg-white/90 hover:bg-white text-[#856342] shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="w-8 h-8 bg-[#856342] rounded-full mr-3 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            {cart.length > 0 ? `Finalizar Pedido (${cart.reduce((total, item) => total + item.quantity, 0)} itens)` : 'Fale com a gente'}
          </button>

          <button
            type="button"
            onClick={() => setShowCatalog(true)}
            className="w-full bg-white/90 hover:bg-white text-[#856342] font-medium py-4 rounded-full text-lg backdrop-blur-sm flex items-center justify-between"
          >
            <span className="flex-1">COMPRE AQUI</span>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#6B4F35] to-[#A67C52] flex items-center justify-center relative">
              <ShoppingCart className="w-4 h-4 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white/50">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Bio Site Promotion */}
        <div className="text-center mb-8">
          <p className="text-white/60 text-xs">
            Criado com <span className="text-white/80">Bee Link</span>
          </p>
        </div>
      </div>

      
    </div>
  );
} 