"use client";

import { ArrowLeft, ExternalLink, Instagram, MessageCircle, Minus, Phone, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CartControls from '../../components/cart-controls';
import CartHeader from '../../components/cart-header';
import { useCartStore } from '../../stores/cartStore';
import type { StoreData } from '../data';

interface ProductPageClientProps {
  store: StoreData;
  product: {
    name: string;
    price: string;
    image: string;
    category: string;
    description: string;
  };
}

export default function ProductPageClient({ store, product }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const { cart, addToCart, removeFromCart, getCartTotal, getCartItemCount, getCartItemQuantity, setStoreSlug, isLoading } = useCartStore();

  // Configurar o store slug quando o componente montar
  useEffect(() => {
    setStoreSlug(store.slug);
  }, [store.slug, setStoreSlug]);
  
  // Array de imagens do produto (por enquanto só uma, mas pode ser expandido)
  const productImages = [product.image];



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

  const quantity = getCartItemQuantity(product.name);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: store.colors.primary }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={store.logo.replace('/logo.png', '/background.png').replace('/logo.jpeg', '/background.png')}
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: `${store.colors.primary}80` }} />
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
      <div className="flex justify-between items-center px-4 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ backgroundColor: `${store.colors.primary}95` }}>
        <Link
          href={`/${store.slug}?showCatalog=true`}
          className="text-white hover:bg-white/10 p-2 rounded-full transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-center">
          <div className="text-white font-medium text-sm truncate max-w-48">{product.name}</div>
          <div className="text-white/70 text-xs">{store.store_name}</div>
        </div>
        <CartHeader 
          storeSlug={store.slug} 
          onCheckout={handleWhatsAppCheckout}
        />
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-32 px-4 relative z-10">
        {/* Product Gallery */}
        <div className="mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
            <div className="aspect-square relative">
              <Image
                src={productImages[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
            
            {/* Image Thumbnails (se houver mais de uma imagem) */}
            {productImages.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={`${product.name}-image-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-white shadow-lg' 
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-xl">
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2" style={{ color: store.colors.primary }}>
              {product.name}
            </h1>
            <div className="text-3xl font-bold" style={{ color: store.colors.accent }}>
              {product.price}
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-4">
            <span 
              className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: store.colors.secondary }}
            >
              {product.category === 'bag' ? 'Bolsa' : 'Produto'}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: store.colors.primary }}>
              Descrição
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Store Info */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={store.logo}
                  alt={`${store.store_name} Logo`}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-semibold" style={{ color: store.colors.primary }}>
                  {store.store_name}
                </div>
                <div className="text-sm text-gray-600">
                  {store.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Cart Controls */}
          <CartControls product={product} storeColors={store.colors} />

          <button
            type="button"
            onClick={handleWhatsAppCheckout}
            disabled={cart.length === 0 || isLoading}
            className={`w-full font-medium py-4 rounded-full text-lg backdrop-blur-sm flex items-center justify-center transition-all shadow-lg hover:shadow-xl ${
              cart.length > 0 && !isLoading
                ? 'bg-white/90 hover:bg-white' 
                : 'bg-white/50 cursor-not-allowed'
            }`}
            style={{ color: store.colors.primary }}
          >
            <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" style={{ backgroundColor: store.colors.primary }}>
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            {isLoading ? 'Carregando...' : cart.length > 0 ? `Finalizar Pedido (${getCartItemCount()} itens)` : 'Adicione itens ao carrinho'}
          </button>

          <Link
            href={`/${store.slug}?showCatalog=true`}
            className="w-full bg-white/20 hover:bg-white/30 font-medium py-4 rounded-full text-lg backdrop-blur-sm flex items-center justify-center transition-all border border-white/30 text-white"
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Ver todos os produtos
          </Link>
        </div>

        {/* Social Links */}
        <div className="mt-8 flex justify-center gap-6">
          <a
            href={`https://instagram.com/${store.social_networks.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:bg-white/10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:bg-white/10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
          >
            <MessageCircle className="w-6 h-6" />
          </a>
        </div>

        {/* Bio Site Promotion */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-xs">
            Criado com <span className="text-white/80">Bee Link</span>
          </p>
        </div>
      </div>
    </div>
  );
} 