"use client";

import { 
  ArrowLeft, 
  Bell, 
  ClipboardList, 
  Menu, 
  Package, 
  Plus, 
  ShoppingCart, 
  X 
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import CategoryFilter from '../../components/store/category-filter';
import FloatingCart from '../../components/store/floating-cart';
import ProductModal from '../../components/store/product-modal';
import { trackProductClick } from '../../lib/analytics';
import { useCartStore } from '../stores/cartStore';

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
  description: string;
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
    getCartItemCount
  } = useCartStore();

  // Verificar se deve mostrar o catálogo baseado na URL
  useEffect(() => {
    if (searchParams.get('showCatalog') === 'true') {
      setShowCatalog(true);
    }
  }, [searchParams]);

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

  const handleAddToCart = (product: Product, quantity = 1) => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        name: product.name,
        price: product.price,
        image: product.image
      });
    }
    
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
  };

  const handleProductClick = (product: Product) => {
    // No mobile, navegar para página separada
    if (window.innerWidth < 768) {
      window.location.href = `/${store.slug}/${product.id}`;
      return;
    }
    
    // No web, abrir modal
    setSelectedProduct(product);
    setIsModalOpen(true);
    trackProductClick({
      product_id: product.id,
      product_name: product.name,
      product_price: Number.parseFloat(product.price.replace('R$ ', '').replace(',', '.')),
      category: product.category_data?.name || product.category
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
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
        <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10" style={{ backgroundColor: `${store.colors.header}95` }}>
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

        {/* Catalog Header - Layout Condicional */}
        <div className="mb-6 pt-20">
          {store.layout_type === 'banner' && (
            <div className="max-w-4xl mx-auto px-4">
              <div className="w-full h-32 overflow-hidden mb-4 rounded-lg">
                {store.banner_image ? (
                  <Image
                    src={store.banner_image}
                    alt="Banner da loja"
                    width={400}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-white font-medium rounded-lg"
                    style={{ backgroundColor: store.colors.primary }}
                  >
                    Banner da Loja
                  </div>
                )}
              </div>
            </div>
          )}
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
            <div className="space-y-6">
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
                    <div key={`category-${category}`} id={`category-${category}`} data-category={category} className="space-y-3">
                      {/* Título da categoria */}
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: store.colors.primary }} />
                        <h3 className="font-semibold text-lg" style={{ color: store.colors.text }}>{category}</h3>
                      </div>

                      {/* Grid de produtos da categoria */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {categoryProducts.map((product: Product, index: number) => {
                          const quantity = getCartItemQuantity(product.name);

                          return (
                            <div
                              key={`product-${product.name}-${index}`}
                              className="relative rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              {/* Product Image - Clickable for Modal */}
                              <div 
                                className="block cursor-pointer"
                                onClick={() => handleProductClick(product)}
                              >
                                <div className="aspect-square relative group">
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
                                          borderColor: store.colors.primary 
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
                              </div>
                              
                              {/* Product Info */}
                              <div className="p-3 md:p-4 pb-4">
                                <div 
                                  className="block cursor-pointer"
                                  onClick={() => handleProductClick(product)}
                                >
                                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                                  <p className="text-lg font-bold" style={{ color: store.colors.primary }}>
                                    {product.price}
                                  </p>
                                </div>
                                
                                {/* Add to Cart Button */}
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(product)}
                                  className="mt-3 w-full py-2 px-3 rounded-lg font-medium text-white flex items-center justify-center space-x-2 transition-colors"
                                  style={{ backgroundColor: store.colors.primary }}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Adicionar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            /* Produtos em grid simples */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {products.filter((p: Product) => p.available !== false).map((product: Product, index: number) => {
                const quantity = getCartItemQuantity(product.name);

                return (
                  <div
                    key={`product-${product.name}-${index}`}
                    className="relative rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Product Image - Clickable for Modal */}
                    <div 
                      className="block cursor-pointer"
                      onClick={() => handleProductClick(product)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleProductClick(product);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="aspect-square relative group">
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
                                borderColor: store.colors.primary 
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
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3 md:p-4 pb-4">
                      <div 
                        className="block cursor-pointer"
                        onClick={() => handleProductClick(product)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleProductClick(product);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                        <p className="text-lg font-bold" style={{ color: store.colors.primary }}>
                          {product.price}
                        </p>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="mt-3 w-full py-2 px-3 rounded-lg font-medium text-white flex items-center justify-center space-x-2 transition-colors"
                        style={{ backgroundColor: store.colors.primary }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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
          <div className="w-48 h-48 rounded-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: store.colors.primary }}>
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
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-label="TikTok">
                <title>TikTok</title>
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          )}
          {store.social_networks?.whatsapp && (
            <a
              href={`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-label="WhatsApp">
                <title>WhatsApp</title>
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
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
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-label="Spotify">
                <title>Spotify</title>
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
                // Navegar para a página do carrinho
                router.push(`/${store.slug}/cart`);
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
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
              </svg>
            </div>
            {loading ? 'Carregando...' : cart.length > 0 ? 'Ver Carrinho' : 'Fale com a gente'}
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