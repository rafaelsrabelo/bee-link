"use client";

import { 
  ClipboardList, 
  Package, 
  ShoppingCart,
  Music,
  MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import CategoryFilter from '../../components/store/category-filter';
import ConfigurableBanner from '../../components/store/configurable-banner';
import EnhancedProductCard from '../../components/store/enhanced-product-card';
import FloatingCart from '../../components/store/floating-cart';
import HorizontalProductCard from '../../components/store/horizontal-product-card';
import ProductModal from '../../components/store/product-modal';

import { trackAddToCart, trackPageView, trackProductClick } from '../../lib/analytics';
import { useCartStore } from '../stores/cartStore';

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
  layout_type?: 'default' | 'banner';
  banner_image?: string;
  show_products_by_category?: boolean;
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
  layout_settings?: {
    // Componentes de banner
    show_banner: boolean;
    banner_type: 'single' | 'carousel';
    banner_images: string[];
    banner_height: 'small' | 'medium' | 'large' | 'full';
    banner_rounded: boolean;
    banner_padding: boolean;
    
    // Configurações de exibição
    show_store_description: boolean;
    show_social_links: boolean;
    show_contact_info: boolean;
    
    // Layout de produtos
    products_per_row: 2 | 3 | 4;
    card_layout: 'grid' | 'horizontal';
    show_product_badges: boolean;
    show_product_description: boolean;
    show_product_price: boolean;
    show_product_rating: boolean;
    show_product_stock: boolean;
    show_quick_add: boolean;
    
    // Configurações de carrinho
    show_floating_cart: boolean;
    cart_position: 'bottom-right' | 'bottom-left';
    
    // Configurações de categoria
    category_display: 'tabs' | 'filters' | 'none';
    show_category_icons: boolean;
  };
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  category_id?: number;
  category_data?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
  };
  description?: string;
  readyToShip?: boolean;
  available?: boolean;
}

interface StorePageClientProps {
  store: StoreData;
}

const generateWhatsAppMessage = (items: Array<{name: string; price: string; quantity: number}>, totalValue: number, store: StoreData) => {
  const itemsText = items.map(item => `${item.quantity}x ${item.name} - ${item.price}`).join('\n');
  return `Olá! Gostaria de fazer um pedido:\n\n${itemsText}\n\nTotal: R$ ${totalValue.toFixed(2).replace('.', ',')}`;
};

export default function StorePageClient({ store }: StorePageClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    clearCart, 
    getCartItemQuantity,
    getCartTotal,
    getCartItemCount,
    setStoreSlug
  } = useCartStore();

  // Verificar se deve mostrar o catálogo baseado na URL
  useEffect(() => {
    if (searchParams.get('showCatalog') === 'true') {
      setShowCatalog(true);
    }
  }, [searchParams]);

  // Definir storeSlug e limpar carrinho quando mudar de loja
  useEffect(() => {
    setStoreSlug(store.slug);
  }, [store.slug, setStoreSlug]);

  // Tracking de visita na página da loja
  useEffect(() => {
    // Detectar se é um link direto
    const isDirectLink = !document.referrer || 
                        document.referrer === '' || 
                        document.referrer === window.location.origin ||
                        document.referrer.includes('whatsapp') ||
                        document.referrer.includes('telegram') ||
                        document.referrer.includes('email');
    
    trackPageView({
      page_title: `${store.store_name} - Loja`,
      page_url: window.location.href,
      referrer: document.referrer,
      is_direct_link: isDirectLink
    });
  }, [store.store_name]);

  // Limpar carrinho quando mudar de loja
  useEffect(() => {
    const handleCartCleared = () => {
      clearCart();
    };

    window.addEventListener('cartCleared', handleCartCleared);
    return () => {
      window.removeEventListener('cartCleared', handleCartCleared);
    };
  }, [clearCart]);

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/stores/${store.slug}/products-public`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [store.slug]);

  // Rastrear links diretos de produtos
  useEffect(() => {
    const utmParams = getUTMParams();
    
    if (utmParams.is_direct_link && utmParams.product_id && products.length > 0) {
      // Encontrar o produto pelo ID
      const product = products.find(p => p.id === utmParams.product_id);
      
      if (product) {
        // Rastrear o acesso direto ao produto
        trackProductClick({
          product_id: product.id,
          product_name: product.name,
          product_price: Number.parseFloat(product.price.replace(/[^\d,]/g, '').replace(',', '.')),
          category: product.category_data?.name || product.category,
          is_direct_link: true,
          referrer: document.referrer,
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign
        });

        // Abrir o modal do produto automaticamente
        setSelectedProduct(product);
        setIsModalOpen(true);
      }
    }
  }, [products]);

  const handleAddToCart = (product: Product, quantity = 1) => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        name: product.name,
        price: product.price,
        image: product.image
      });
    }
    
    // Track add to cart event
    trackAddToCart({
      product_id: product.id,
      product_name: product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category_data?.name || product.category,
      is_direct_link: false,
      referrer: document.referrer
    });
  };

  const handleProductClick = (product: Product) => {
    // No mobile, navegar para página separada
    if (window.innerWidth < 768) {
      // Usar router.push para navegação mais suave
      router.push(`/${store.slug}/${product.id}`);
      return;
    }
    
    // No web, abrir modal
    setSelectedProduct(product);
    setIsModalOpen(true);
    
    const utmParams = getUTMParams();
    trackProductClick({
      product_id: product.id,
      product_name: product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category_data?.name || product.category,
      is_direct_link: false,
      referrer: document.referrer,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Função para renderizar o card baseado no layout
  const renderProductCard = (product: Product, index: number) => {
    const cardLayout = store.layout_settings?.card_layout || 'grid';
    
    if (cardLayout === 'horizontal') {
      return (
        <HorizontalProductCard
          key={`product-${product.name}-${index}`}
          product={product}
          storeColors={store.colors}
          layoutSettings={store.layout_settings}
          onProductClick={handleProductClick}
          onAddToCart={handleAddToCart}
          storeSlug={store.slug}
        />
      );
    }
    
    return (
      <EnhancedProductCard
        key={`product-${product.name}-${index}`}
        product={product}
        storeColors={store.colors}
        layoutSettings={store.layout_settings}
        onProductClick={handleProductClick}
        onAddToCart={handleAddToCart}
        getCartItemQuantity={getCartItemQuantity}
        storeSlug={store.slug}
      />
    );
  };

  // Função para definir as classes do grid baseado no layout
  const getGridClasses = () => {
    const cardLayout = store.layout_settings?.card_layout || 'grid';
    
    if (cardLayout === 'horizontal') {
      return 'grid grid-cols-1 gap-2 sm:gap-3 md:gap-4';
    }
    
    // Layout grid normal
    return `grid gap-2 sm:gap-3 md:gap-4 ${
      store.layout_settings?.products_per_row === 2 
        ? 'grid-cols-2' 
        : store.layout_settings?.products_per_row === 4 
        ? 'grid-cols-2 md:grid-cols-4' 
        : 'grid-cols-2 md:grid-cols-3'
    }`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: store.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: store.colors.primary }} />
          <div style={{ color: store.colors.text }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (showCatalog) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: store.colors.background }}>
        {/* Header Centralizado */}
        <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10" style={{ backgroundColor: `${store.colors.header}` }}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              {/* Logo + Store Name */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-white/20 flex items-center justify-center shadow-sm">
                  {store.logo ? (
                    <Image
                      src={store.logo}
                      alt={store.store_name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-800 font-bold text-lg">
                      {store.store_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-white font-semibold text-base">{store.store_name}</h1>
                  <p className="text-white/70 text-sm">Catálogo de Produtos</p>
                </div>
              </div>
              
              {/* Ver Pedidos Button */}
              <button
                type="button"
                className="text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                onClick={() => {
                  window.location.href = `/${store.slug}/pedidos`;
                }}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Ver Pedidos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Banner Configurável - Centralizado */}
        <div className="pt-24 sm:pt-28 md:pt-32 mb-4 max-w-4xl mx-auto px-4">
          {store.layout_settings?.show_banner && store.layout_settings.banner_images?.length > 0 ? (
            <ConfigurableBanner
              images={store.layout_settings.banner_images}
              type={store.layout_settings.banner_type || 'single'}
              height={store.layout_settings.banner_height || 'medium'}
              rounded={store.layout_settings.banner_rounded !== false}
              padding={false}
              colors={store.colors}
            />
          ) : store.layout_type === 'banner' && store.banner_image ? (
            <ConfigurableBanner
              images={[store.banner_image]}
              type="single"
              height="medium"
              rounded={true}
              padding={false}
              colors={store.colors}
            />
          ) : null}
        </div>

        {/* Category Filter - Centralizado */}
        {store.show_products_by_category && (
          <div className="max-w-4xl mx-auto px-4">
            <CategoryFilter 
              products={products}
              storeColors={store.colors}
            />
          </div>
        )}

        {/* Products Grid - Centralizado */}
        <div id="products-section" className="px-4 pb-32 pt-4 max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-8">
              <div style={{ color: store.colors.text }}>Carregando produtos...</div>
            </div>
          ) : products.filter((p: Product) => p.available !== false).length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mx-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-white/70" />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: store.colors.text }}>Catálogo Vazio</h3>
                <p className="text-sm mb-4" style={{ color: store.colors.text }}>
                  Nenhum produto disponível no momento.
                </p>
                <div className="text-xs" style={{ color: store.colors.text }}>
                  Em breve teremos novidades para você! ✨
                </div>
              </div>
            </div>
          ) : store.show_products_by_category ? (
            /* Produtos organizados por categoria */
            <div className="space-y-4">
              {(() => {
                const availableProducts = products.filter((p: Product) => p.available !== false);
                
                const categories = [...new Set(availableProducts.map(p => {
                  if (p.category_data?.name) {
                    return p.category_data.name;
                  }
                  if (p.category) {
                    return p.category;
                  }
                  return 'Geral';
                }))];

                return categories.map(category => {
                  const categoryProducts = availableProducts.filter(p => {
                    const productCategory = p.category_data?.name || p.category || 'Geral';
                    return productCategory === category;
                  });

                  return (
                    <div key={`category-${category}`} id={`category-${category}`} data-category={category} className="space-y-2">
                      {/* Título da categoria */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-lg" style={{ color: store.colors.text }}>{category}</h3>
                      </div>

                      {/* Grid de produtos da categoria */}
                      <div className={getGridClasses()}>
                        {categoryProducts.map((product: Product, index: number) => 
                          renderProductCard(product, index)
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            /* Produtos em grid simples */
            <div className={getGridClasses()}>
              {products.filter((p: Product) => p.available !== false).map((product: Product, index: number) => 
                renderProductCard(product, index)
              )}
            </div>
          )}
        </div>

        {/* Product Modal */}
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
          getCartItemQuantity={getCartItemQuantity}
          storeColors={store.colors}
        />

        {/* Carrinho Flutuante */}
        <FloatingCart
          items={cart.map(item => ({
            id: item.name,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          }))}
          totalItems={getCartItemCount()}
          totalValue={getCartTotal()}
          storeColors={store.colors}
          onOpenCart={() => {
            // Ação para abrir carrinho (pode redirecionar para página de carrinho)
            // Abrir carrinho
          }}
          onCheckout={() => {
            // Mostrar loading e redirecionar para página de checkout
            window.location.href = `/${store.slug}/checkout`;
          }}
          onAddItem={(itemName) => {
            // Encontrar o produto e adicionar ao carrinho
            const product = products.find(p => p.name === itemName);
            if (product) {
              addToCart(product);
            }
          }}
          onRemoveItem={(itemName) => {
            removeFromCart(itemName);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      backgroundColor: store.colors.background
    }}>


      {/* Header */}
      <div className="flex justify-between items-center px-4 pb-8 relative z-10">
       
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center px-6 relative z-10">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-48 h-48 rounded-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: store.colors.primary }}>
            {store.logo && store.logo.trim() !== '' ? (
              <Image
                src={store.logo}
                alt={`${store.store_name} Logo`}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-6xl font-bold text-white opacity-80">
                {store.store_name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Brand Name and Tagline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light mb-2" style={{ color: store.colors.text }}>{store.store_name}</h1>
          <p className="text-sm tracking-wide" style={{ color: store.colors.text }}>{store.description}</p>
        </div>

        {/* Social Icons */}
        <div className="flex gap-6 mb-12">
          {store.social_networks?.instagram && (
            <a
              href={`https://instagram.com/${store.social_networks.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
              style={{ 
                backgroundColor: store.colors.primary,
                color: 'white'
              }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-label="Instagram">
                <title>Instagram</title>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          )}
          {store.social_networks?.whatsapp && (
            <a
              href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
              style={{ 
                backgroundColor: store.colors.primary,
                color: 'white'
              }}
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          )}
          {store.social_networks?.spotify && (
            <a
              href={store.social_networks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
              style={{ 
                backgroundColor: store.colors.primary,
                color: 'white'
              }}
            >
              <Music className="w-6 h-6" />
            </a>
          )}
          {store.social_networks?.youtube && (
            <a
              href={`https://youtube.com/${store.social_networks.youtube}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
              style={{ 
                backgroundColor: store.colors.primary,
                color: 'white'
              }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-label="YouTube">
                <title>YouTube</title>
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
                // Navegar para a página de checkout
                router.push(`/${store.slug}/checkout`);
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
            disabled={loading}
            className={`w-full font-medium py-4 rounded-full text-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
              cart.length > 0 && !loading
                ? 'bg-white/90 hover:bg-white shadow-lg hover:shadow-xl' 
                : 'bg-white/90 hover:bg-white shadow-lg hover:shadow-xl'
            }`}
            style={{ color: store.colors.primary }}
          >
            <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" style={{ 
              backgroundColor: store.colors.primary
            }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-label="Pedido">
                <title>Pedido</title>
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
              </svg>
            </div>
            {loading ? 'Carregando...' : cart.length > 0 ? 'Finalizar Pedido' : 'Fale com a gente'}
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
            Ver Catálogo
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