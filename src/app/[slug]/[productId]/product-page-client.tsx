"use client";

import { ArrowLeft, Instagram, MessageCircle, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import FloatingCart from '../../../components/store/floating-cart';
import ProductImageGallery from '../../../components/ui/product-image-gallery';

import { toast } from 'react-hot-toast';
import { trackAddToCart, trackPageView, trackProductClick } from '../../../lib/analytics';
import CartControls from '../../components/cart-controls';

import { useCartStore } from '../../stores/cartStore';

// Função para extrair parâmetros UTM da URL
const getUTMParams = () => {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    product_id: urlParams.get('product_id') || '',
    is_direct_link: urlParams.has('product_id')
  };
};

interface StoreData {
  store_name: string;
  description: string;
  slug: string;
  logo: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  social_networks: {
    instagram: string;
    whatsapp: string;
    tiktok?: string;
    spotify?: string;
    youtube?: string;
  };
}

interface ProductImage {
  id: string;
  url: string;
  color_name?: string;
  color_hex?: string;
  is_primary?: boolean;
}

interface Color {
  name: string;
  hex_code: string;
}

interface Size {
  name: string;
  value: string;
}

interface ProductPageClientProps {
  store: StoreData;
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    category: string;
    description: string;
    readyToShip?: boolean;
    colors?: Color[];
    sizes?: Size[];
    has_variants?: boolean;
    images?: ProductImage[];
    colors_enabled?: boolean;
    sizes_enabled?: boolean;
  };
}

export default function ProductPageClient({ store, product }: ProductPageClientProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { cart, setStoreSlug, isLoading, addToCart, removeFromCart } = useCartStore();

  // Debug temporário para verificar dados do produto
  useEffect(() => {
    console.log('🔍 Dados do produto:', {
      id: product.id,
      name: product.name,
      colors: product.colors,
      sizes: product.sizes,
      images: product.images,
      colors_enabled: product.colors_enabled,
      sizes_enabled: product.sizes_enabled,
      has_variants: product.has_variants
    });
  }, [product]);

  // Configurar o store slug quando o componente montar
  useEffect(() => {
    setStoreSlug(store.slug);
  }, [store.slug, setStoreSlug]);

  // Tracking de visita na página do produto
  useEffect(() => {
    const utmParams = getUTMParams();
    
    // Detectar se é um link direto
    const isDirectLink = !document.referrer || 
                        document.referrer === '' || 
                        document.referrer === window.location.origin ||
                        document.referrer.includes('whatsapp') ||
                        document.referrer.includes('telegram') ||
                        document.referrer.includes('email');
    
    // Track page view
    trackPageView({
      page_title: `${product.name} - ${store.store_name}`,
      page_url: window.location.href,
      referrer: document.referrer,
      is_direct_link: isDirectLink
    });

    // Track product visit (similar to click but for direct visits)
    trackProductClick({
      product_id: product.id,
      product_name: product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category,
      is_direct_link: isDirectLink || utmParams.is_direct_link,
      referrer: document.referrer,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign
    });
  }, [product.id, product.name, product.price, product.category, store.store_name]);



  // Preparar imagens do produto (flexível - pode ter imagens sem cores)
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [{ id: '1', url: product.image, is_primary: true }];

  // Preparar cores do produto (se disponíveis)
  const availableColors = product.colors || [];

  // Preparar tamanhos do produto (se disponíveis)
  const availableSizes = product.sizes || [];

  // Auto-selecionar primeira cor e tamanho se disponíveis
  useEffect(() => {
    if (product.colors_enabled && availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0].name);
    }
    if (product.sizes_enabled && availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0].name);
    }
  }, [product.colors_enabled, product.sizes_enabled, availableColors, availableSizes, selectedColor, selectedSize]);

  // Função para adicionar ao carrinho com tracking
  const handleAddToCart = () => {
    // Validar se cor é obrigatória e foi selecionada
    if (product.colors_enabled && availableColors.length > 0 && !selectedColor) {
      toast.error('Por favor, selecione uma cor antes de adicionar ao carrinho.');
      return;
    }
    
    // Validar se tamanho é obrigatório e foi selecionado
    if (product.sizes_enabled && availableSizes.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho antes de adicionar ao carrinho.');
      return;
    }
    
    // Criar produto com variações selecionadas
    const productWithVariants = {
      ...product,
      selectedColor,
      selectedSize
    };
    
    // Adicionar produto ao carrinho
    addToCart(productWithVariants);
    
    // Mostrar toast de sucesso
    let successMessage = `${product.name} adicionado ao carrinho!`;
    if (selectedColor || selectedSize) {
      const attributes = [];
      if (selectedColor) attributes.push(selectedColor);
      if (selectedSize) attributes.push(selectedSize);
      successMessage += ` (${attributes.join(', ')})`;
    }
    toast.success(successMessage);
    
    // Track add to cart event
    trackAddToCart({
      product_id: product.id,
      product_name: product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category,
      is_direct_link: false,
      referrer: document.referrer
    });
  };

  // Função para selecionar cor
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(selectedColor === colorName ? null : colorName);
  };

  // Função para selecionar tamanho
  const handleSizeSelect = (sizeName: string) => {
    setSelectedSize(selectedSize === sizeName ? null : sizeName);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: store.colors.background }}>

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
      <div className="flex justify-between items-center px-4 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ backgroundColor: `${store.colors.header}` }}>
        <Link
          href={`/${store.slug}?showCatalog=true`}
          className="text-white hover:bg-white/10 p-2 rounded-full transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-center flex-1">
          <div className="font-semibold text-base" style={{ color: store.colors.text }}>{store.store_name}</div>
          <div className="text-xs opacity-80" style={{ color: store.colors.text }}>Produto</div>
        </div>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-32 px-4 relative z-10">
        {/* Product Gallery */}
        <div className="mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
            <ProductImageGallery 
              images={productImages}
            />
            
            {/* Pronta Entrega Tag */}
            {product.readyToShip && (
              <div className="absolute top-4 left-4 z-10">
                <div 
                  className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium shadow-sm border"
                  style={{ 
                    color: store.colors.primary,
                    borderColor: store.colors.primary 
                  }}
                >
                  ✓ Pronta entrega
                </div>
              </div>
            )}
          </div>
          
          {/* Informação sobre múltiplas imagens */}
          {productImages.length > 1 && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                📸 {productImages.length} fotos disponíveis - Use as setas para navegar
              </p>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-xl">
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2" style={{ color: store.colors.primary }}>
              {product.name}
            </h1>
            <div className="text-3xl font-bold" style={{ color: store.colors.primary }}>
              {typeof product.price === 'string' && product.price.includes('R$') 
                ? product.price 
                : `R$ ${Number(product.price).toFixed(2).replace('.', ',')}`
              }
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-4">
            <span 
              className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: store.colors.primary }}
            >
              {typeof product.category === 'string' ? (product.category === 'bag' ? 'Bolsa' : 'Produto') : 'Produto'}
            </span>
          </div>

          {/* Cores (se habilitadas) */}
          {product.colors_enabled && availableColors.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-3" style={{ color: store.colors.primary }}>
                Cores Disponíveis
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorSelect(color.name)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 relative bg-white
                      ${selectedColor === color.name
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div 
                      className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {color.name}
                    </span>
                    {selectedColor === color.name && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedColor && (
                <p className="mt-3 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  Cor selecionada: <span className="font-medium text-blue-700">{selectedColor}</span>
                </p>
              )}
            </div>
          )}

          {/* Tamanhos (se habilitados) */}
          {product.sizes_enabled && availableSizes.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-3" style={{ color: store.colors.primary }}>
                Tamanhos Disponíveis
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size.name}
                    type="button"
                    onClick={() => handleSizeSelect(size.name)}
                    className={`
                      px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium relative bg-white min-w-[60px]
                      ${selectedSize === size.name
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    {size.name}
                    {selectedSize === size.name && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedSize && (
                <p className="mt-3 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  Tamanho selecionado: <span className="font-medium text-blue-700">{selectedSize}</span>
                </p>
              )}
            </div>
          )}

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
          <CartControls 
            product={product} 
            storeColors={store.colors}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onAddToCart={handleAddToCart}
          />

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
          {store.social_networks?.instagram && (
            <a
              href={`https://instagram.com/${store.social_networks.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
            >
              <Instagram className="w-6 h-6" />
            </a>
          )}
          {store.social_networks?.whatsapp && (
            <a
              href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          )}
        </div>

        {/* Bio Site Promotion */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-xs">
            Criado com <span className="text-white/80">Bee Link</span>
          </p>
        </div>
      </div>

      {/* Carrinho Flutuante */}
      <FloatingCart
        items={cart.map(item => ({
          id: item.name,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize
        }))}
        totalItems={cart.reduce((total, item) => total + item.quantity, 0)}
        totalValue={cart.reduce((total, item) => {
          const price = Number.parseFloat(item.price.replace('R$', '').replace(',', '.').trim());
          return total + (price * item.quantity);
        }, 0)}
        storeColors={store.colors}
        isCheckingOut={isCheckingOut}
        onOpenCart={() => {
          // Ação para abrir carrinho (pode redirecionar para página de carrinho)
          // Abrir carrinho
        }}
        onCheckout={() => {
          // Mostrar loading e redirecionar para página de checkout
          setIsCheckingOut(true);
          setTimeout(() => {
            window.location.href = `/${store.slug}/checkout`;
          }, 100);
        }}
        onAddItem={(itemName: string, selectedColor?: string | null, selectedSize?: string | null) => {
          // Encontrar o produto e adicionar ao carrinho com cor e tamanho específicos
          if (product.name === itemName) {
            const productWithVariants = {
              ...product,
              selectedColor,
              selectedSize
            };
            addToCart(productWithVariants);
          }
        }}
        onRemoveItem={(itemName: string, selectedColor?: string | null, selectedSize?: string | null) => {
          removeFromCart(itemName, selectedColor, selectedSize);
        }}
      />
    </div>
  );
} 