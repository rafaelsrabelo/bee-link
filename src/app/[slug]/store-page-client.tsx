"use client";

import { ArrowLeft, Instagram, MessageCircle, Minus, Package, Phone, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CartControlsCompactLoading from '../components/cart-controls-compact-loading';
import CartHeader from '../components/cart-header';
import { useCartStore } from '../stores/cartStore';
import { trackPageView, trackProductClick, trackAddToCart, trackEvent } from '../../lib/simple-analytics';

interface StoreData {
  store_name: string;
  description: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  social_networks: {
    instagram: string;
    whatsapp: string;
    tiktok?: string;
    spotify?: string;
    youtube?: string;
  };
}

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

interface StorePageClientProps {
  store: StoreData;
}

export default function StorePageClient({ store }: StorePageClientProps) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [error] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const { cart, addToCart, removeFromCart, getCartItemQuantity, setStoreSlug, isLoading } = useCartStore();

  // Configurar o store slug quando o componente montar
  useEffect(() => {
    setStoreSlug(store.slug);
  }, [store.slug, setStoreSlug]);

  // Tracking de visualização da página
  useEffect(() => {
    trackPageView(store.slug);
  }, [store.slug]);


  // Verificar se deve mostrar o catálogo baseado na URL
  useEffect(() => {
    if (searchParams.get('showCatalog') === 'true') {
      setShowCatalog(true);
    }
  }, [searchParams]);

  // Carregar produtos da API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/stores/${store.slug}/products`);
        if (response.ok) {
          const productsData = await response.json();
          setProducts(productsData || []);
        }
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Verificar se o carrinho pertence à loja atual
  useEffect(() => {
    const cartStoreSlug = localStorage.getItem('cart-store-slug');
    if (cartStoreSlug && cartStoreSlug !== store.slug) {
      // Se o carrinho pertence a outra loja, limpar
      const { clearCart } = useCartStore.getState();
      clearCart();
    }
  }, [store.slug]);

  // Tratamento de erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: store.colors.primary }}>
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Erro</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
            type="button"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  if (showCatalog) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: store.colors.primary }}>
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ backgroundColor: `${store.colors.primary}95` }}>
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
          <CartHeader 
            storeSlug={store.slug}
          />
        </div>

        {/* Catalog Header */}
        <div className="px-4 mb-6 pt-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-4 flex items-center justify-between">
            <span className="font-medium text-lg" style={{ color: store.colors.primary }}>CATÁLOGO</span>
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${store.colors.secondary}, ${store.colors.accent})` }}>
              <span className="text-white font-bold text-lg">{store.store_name.charAt(0)}</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-4 pb-20 pt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-white">Carregando produtos...</div>
            </div>
          ) : products.filter((p: Product) => p.available !== false).length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mx-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-white/70" />
                </div>
                <h3 className="text-white text-lg font-medium mb-2">Catálogo Vazio</h3>
                <p className="text-white/70 text-sm mb-4">
                  Nenhum produto disponível no momento.
                </p>
                <div className="text-white/50 text-xs">
                  Em breve teremos novidades para você! ✨
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.filter((p: Product) => p.available !== false).map((product: Product, index: number) => {
                const quantity = getCartItemQuantity(product.name);

                return (
                  <div
                    key={`product-${product.name}-${index}`}
                    className="relative rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm"
                  >
                    {/* Product Image - Clickable Link */}
                    <a 
                      href={`/${store.slug}/${product.id}`} 
                      className="block"
                      onClick={() => {
                        // Tracking de clique na imagem do produto
                        trackProductClick(store.slug, product);
                      }}
                    >
                      <div className="aspect-square relative cursor-pointer group">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all" />
                        
                        {/* Pronta Entrega Tag */}
                        {product.readyToShip && (
                          <div className="absolute top-2 left-2 z-10">
                            <div 
                              className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium shadow-sm border"
                              style={{ 
                                color: store.colors.primary,
                                borderColor: store.colors.secondary 
                              }}
                            >
                              ✓ Pronta entrega
                            </div>
                          </div>
                        )}
                        
                        {/* Hover overlay with "Ver detalhes" text */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium" style={{ color: store.colors.primary }}>
                            Ver detalhes
                          </div>
                        </div>
                      </div>
                    </a>
                    
                    {/* Product Info */}
                    <div className="p-3 pb-4">
                      <a 
                        href={`/${store.slug}/${product.id}`} 
                        className="block"
                        onClick={() => {
                          // Tracking de clique em produto
                          trackProductClick(store.slug, product);
                        }}
                      >
                        <h3 className="text-white font-medium text-sm mb-1 truncate hover:text-white/80 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-white/90 font-bold text-lg mb-3">
                          {product.price}
                        </p>
                      </a>

                      {/* Cart Controls */}
                      {isLoading ? (
                        <CartControlsCompactLoading />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
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
                            <span className="text-white font-medium text-sm min-w-[20px] text-center">
                              {quantity}
                            </span>
                          )}
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                              
                              // Tracking de adição ao carrinho
                              trackAddToCart(store.slug, product);
                              
                              // Tracking de clique no carrinho
                              trackEvent({
                                event_type: 'add_to_cart',
                                store_slug: store.slug,
                                product_id: product.id,
                                product_name: product.name,
                                product_price: parseFloat(product.price.replace('R$', '').replace(',', '.').trim())
                              });
                            }}
                            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white/30 transition-all border border-white/30"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: `linear-gradient(135deg, ${store.colors.primary} 0%, ${store.colors.primary} 30%, ${store.colors.secondary} 60%, ${store.colors.accent} 100%)`
    }}>
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Desktop only decorative elements */}
        <div className="hidden md:block absolute top-20 left-4 w-24 h-24 bg-white/20 rounded-full" />
        <div className="hidden md:block absolute top-32 right-8 w-16 h-16 bg-white/15 rounded-full" />
        <div className="hidden md:block absolute top-48 left-12 w-32 h-32 bg-white/10 rounded-full" />
        <div className="hidden md:block absolute bottom-40 left-8 w-28 h-28 bg-white/15 rounded-full" />
        <div className="hidden md:block absolute bottom-60 right-12 w-36 h-36 bg-white/10 rounded-full" />

        {/* Mobile friendly decorative elements */}
        <div className="md:hidden absolute top-16 right-6 w-16 h-16 bg-white/15 rounded-full" />
        <div className="md:hidden absolute bottom-20 left-6 w-20 h-20 bg-white/10 rounded-full" />

        {/* Marble texture elements - desktop only */}
        <div className="hidden md:block absolute top-40 right-0 w-40 h-40 bg-white/30 rounded-full transform translate-x-20" />
        <div className="hidden md:block absolute bottom-20 left-0 w-48 h-48 bg-white/25 rounded-full transform -translate-x-24" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-4 pb-8 relative z-10">
       
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center px-6 relative z-10">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-48 h-48 rounded-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: store.colors.secondary }}>
            <Image
              src={store.logo}
              alt={`${store.store_name} Logo`}
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
          {store.social_networks?.instagram && (
            <a
              href={`https://instagram.com/${store.social_networks.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <Instagram className="w-6 h-6" />
            </a>
          )}
          {store.social_networks?.whatsapp && (
            <a
              href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          )}
          {store.social_networks?.tiktok && (
            <a
              href={`https://tiktok.com/@${store.social_networks.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          )}
          {store.social_networks?.spotify && (
            <a
              href={store.social_networks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
          )}
          {store.social_networks?.youtube && (
            <a
              href={`https://youtube.com/${store.social_networks.youtube}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4 mb-8">
          <button 
            type="button"
            onClick={() => {
              if (cart.length > 0) {
                // Navegar para a página do carrinho
                window.location.href = `/${store.slug}/cart`;
              } else if (store.social_networks?.whatsapp) {
                // Mensagem padrão para WhatsApp
                const message = `Olá! Gostaria de saber mais sobre os produtos da ${store.store_name}`;
                const whatsappUrl = `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              } else {
                // Se não tem WhatsApp, mostrar catálogo
                setShowCatalog(true);
              }
            }}
            disabled={isLoading}
            className={`w-full font-medium py-4 rounded-full text-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
              cart.length > 0 && !isLoading
                ? 'bg-white/90 hover:bg-white shadow-lg hover:shadow-xl' 
                : 'bg-white/90 hover:bg-white shadow-lg hover:shadow-xl'
            }`}
            style={{ color: store.colors.primary }}
          >
            <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" style={{ 
              backgroundColor: store.colors.primary
            }}>
              <Phone className="w-4 h-4 text-white" />
            </div>
            {isLoading ? 'Carregando...' : cart.length > 0 ? 'Ver Carrinho' : 'Fale com a gente'}
          </button>

          <button
            type="button"
            onClick={() => setShowCatalog(true)}
            className="w-full bg-white/90 hover:bg-white font-medium py-4 rounded-full text-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
            style={{ color: store.colors.primary }}
          >
            <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" style={{ 
              backgroundColor: store.colors.primary
            }}>
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            COMPRE AQUI
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