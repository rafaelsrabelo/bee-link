import { Plus, Star } from 'lucide-react';
import Image from 'next/image';
import { formatPrice } from '../../lib/utils';
import ProductNavigation from './product-navigation';

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
  colors_enabled?: boolean;
  sizes_enabled?: boolean;
  colors?: Array<{
    id: string;
    name: string;
    hex_code: string;
  }>;
  sizes?: Array<{
    id: string;
    name: string;
  }>;
}

interface EnhancedProductCardProps {
  product: Product;
  storeColors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  layoutSettings?: {
    show_product_badges: boolean;
    show_product_description: boolean;
    show_product_price: boolean;
    show_product_rating: boolean;
    show_product_stock: boolean;
    show_quick_add: boolean;
  };
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  getCartItemQuantity?: (productName: string) => number;
  storeSlug: string;
}

export default function EnhancedProductCard({
  product,
  storeColors,
  layoutSettings,
  onProductClick,
  onAddToCart,
  getCartItemQuantity,
  storeSlug
}: EnhancedProductCardProps) {
  const settings = {
    show_product_badges: layoutSettings?.show_product_badges !== false,
    show_product_description: layoutSettings?.show_product_description !== false,
    show_product_price: layoutSettings?.show_product_price !== false,
    show_product_rating: layoutSettings?.show_product_rating === true,
    show_product_stock: layoutSettings?.show_product_stock === true,
    show_quick_add: layoutSettings?.show_quick_add !== false,
  };



  return (
    <div className="relative rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 group border border-gray-100">
      {/* Product Image - Clickable for Modal */}
      <ProductNavigation 
        storeSlug={storeSlug}
        productId={product.id}
        className="block"
        onProductClick={onProductClick}
        product={product}
      >
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200" />
          
          {/* Badges */}
          {settings.show_product_badges && product.readyToShip && (
            <div className="absolute top-2 left-2 z-10">
              <div 
                className="bg-white px-2 py-1 rounded text-xs font-medium shadow-sm border"
                style={{ 
                  color: storeColors.primary,
                  borderColor: `${storeColors.primary}30` // 19% de opacidade
                }}
              >
                ✓ Pronta entrega
              </div>
            </div>
          )}
          
          {/* Hover overlay - mais sutil */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div 
              className="bg-white px-3 py-1.5 rounded text-sm font-medium shadow-md border"
              style={{ 
                color: storeColors.primary,
                borderColor: `${storeColors.primary}40` // 25% de opacidade
              }}
            >
              Ver detalhes
            </div>
          </div>
        </div>
      </ProductNavigation>
      
      {/* Product Info */}
      <div className="p-4 space-y-3">
        <ProductNavigation 
          storeSlug={storeSlug}
          productId={product.id}
          className="cursor-pointer"
          onProductClick={onProductClick}
          product={product}
        >
          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base leading-tight">
            {product.name}
          </h4>
          
          {settings.show_product_description && product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          
          {/* Indicadores de Cores e Tamanhos */}
          <div className="flex items-center gap-3 mb-2">
            {/* Indicador de Cores */}
            {product.colors_enabled && product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Cores:</span>
                <div className="flex gap-1">
                  {product.colors.slice(0, 3).map((color) => (
                    <div
                      key={color.id}
                      className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hex_code }}
                      title={color.name}
                    />
                  ))}
                  {product.colors.length > 3 && (
                    <span className="text-xs text-gray-400 ml-1">+{product.colors.length - 3}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Indicador de Tamanhos */}
            {product.sizes_enabled && product.sizes && product.sizes.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Tamanhos:</span>
                <div className="flex gap-1">
                  {product.sizes.slice(0, 3).map((size) => (
                    <span
                      key={size.id}
                      className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600"
                      title={size.name}
                    >
                      {size.name}
                    </span>
                  ))}
                  {product.sizes.length > 3 && (
                    <span className="text-xs text-gray-400">+{product.sizes.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {settings.show_product_rating && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-600">4.8</span>
              <span className="text-xs text-gray-400">(12 avaliações)</span>
            </div>
          )}
        </ProductNavigation>
        
        <div className="flex items-center justify-between">
          {settings.show_product_price && (
            <div className="flex flex-col">
              <p className="text-lg font-bold" style={{ color: storeColors.primary }}>
                {formatPrice(product.price)}
              </p>
              {settings.show_product_stock && (
                <span className="text-xs text-green-600 font-medium">
                  Em estoque
                </span>
              )}
            </div>
          )}
          
          {settings.show_quick_add && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="rounded-lg p-2.5 text-white transition-all duration-200 hover:opacity-90 shadow-sm"
              style={{ backgroundColor: storeColors.primary }}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
