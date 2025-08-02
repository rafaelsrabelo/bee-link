"use client";

import { ExternalLink, Instagram, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { StoreData } from './data';

interface StorePageClientProps {
  store: StoreData;
}

export default function StorePageClient({ store }: StorePageClientProps) {
  const [showCatalog, setShowCatalog] = useState(false);

  const handleWhatsAppClick = (product: { name: string; price: string }) => {
    const message = `Olá! Gostaria de saber mais sobre a ${product.name} por ${product.price} da ${store.store_name}`;
    const whatsappUrl = `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (showCatalog) {
    return (
      <div className="min-h-screen bg-[#856342] relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4">
          <button
            type="button"
            className="text-white hover:bg-white/10 p-2 rounded-full"
            onClick={() => setShowCatalog(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="text-white font-medium">Catálogo</div>
            <div className="text-white/70 text-sm">{store.store_name}</div>
          </div>
          <div className="w-10" />
        </div>

        {/* Catalog Header */}
        <div className="px-4 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-4 flex items-center justify-between">
            <span className="text-[#856342] font-medium text-lg">CATÁLOGO</span>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#6B4F35] to-[#A67C52] flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-4 pb-20">
          <div className="grid grid-cols-2 gap-3">
                        {store.products.map((product, index) => (
              <div
                key={`product-${product.name}-${index}`}
                className="relative rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm cursor-pointer"
                onClick={() => handleWhatsAppClick(product)}
                onKeyDown={(e) => e.key === 'Enter' && handleWhatsAppClick(product)}
                role="button"
                tabIndex={0}
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
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-white/90 font-bold text-lg">
                    {product.price}
                  </p>
                </div>

                {/* WhatsApp Button */}
                <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
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
          <a
            href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=Olá! Gostaria de saber mais sobre os produtos da ${store.store_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white/90 hover:bg-white text-[#856342] font-medium py-6 rounded-full text-lg backdrop-blur-sm flex items-center justify-center"
          >
            <div className="w-8 h-8 bg-[#856342] rounded-full mr-3 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
            COMPRE AQUI
          </a>

          <button
            type="button"
            onClick={() => setShowCatalog(true)}
            className="w-full bg-white/90 hover:bg-white text-[#856342] font-medium py-6 rounded-full text-lg backdrop-blur-sm flex items-center justify-between"
          >
            <span className="flex-1">CATÁLOGO</span>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#6B4F35] to-[#A67C52] flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
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