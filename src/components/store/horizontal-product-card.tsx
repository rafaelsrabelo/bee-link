import { Plus, Star } from 'lucide-react';
import Image from 'next/image';
import { formatPrice } from '../../lib/utils';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  category_id?: number;
  description?: string;
  readyToShip?: boolean;
  available?: boolean;
  category_data?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
  };
}

interface LayoutSettings {
  show_product_badges?: boolean;
  show_product_description?: boolean;
  show_product_price?: boolean;
  show_product_rating?: boolean;
  show_product_stock?: boolean;
  show_quick_add?: boolean;
}

interface HorizontalProductCardProps {
  product: Product;
  storeColors: {
    primary: string;
    text: string;
    background: string;
  };
  layoutSettings?: LayoutSettings;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function HorizontalProductCard({
  product,
  storeColors,
  layoutSettings,
  onProductClick,
  onAddToCart
}: HorizontalProductCardProps) {
  const settings = {
    show_product_badges: layoutSettings?.show_product_badges !== false,
    show_product_description: layoutSettings?.show_product_description !== false,
    show_product_price: layoutSettings?.show_product_price !== false,
    show_product_rating: layoutSettings?.show_product_rating === true,
    show_product_stock: layoutSettings?.show_product_stock !== false,
    show_quick_add: layoutSettings?.show_quick_add !== false,
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group border border-gray-100 overflow-hidden">
      <div className="flex">
        {/* Imagem do Produto - Esquerda */}
        <div 
          className="relative w-24 h-24 flex-shrink-0 cursor-pointer"
          onClick={() => onProductClick(product)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onProductClick(product);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <Image 
            src={product.image} 
            alt={product.name} 
            fill 
            className="object-cover"
          />
          
          {/* Overlay sutil no hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200" />
          
          {/* Badge */}
          {settings.show_product_badges && product.readyToShip && (
            <div className="absolute top-1 left-1 z-10">
              <div 
                className="bg-white px-1.5 py-0.5 rounded text-xs font-medium shadow-sm border"
                style={{ 
                  color: storeColors.primary,
                  borderColor: storeColors.primary + '30'
                }}
              >
                ✓
              </div>
            </div>
          )}
        </div>

        {/* Informações do Produto - Direita */}
        <div className="flex-1 p-3 flex flex-col justify-center">
          <div 
            className="cursor-pointer flex-1"
            onClick={() => onProductClick(product)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onProductClick(product);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {/* Nome do produto */}
            <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 mb-1">
              {product.name}
            </h4>
            
            {/* Descrição */}
            {settings.show_product_description && product.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {product.description}
              </p>
            )}
            
            {/* Avaliação */}
            {settings.show_product_rating && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-600">4.8</span>
                <span className="text-xs text-gray-400">(12)</span>
              </div>
            )}
            
            {/* Preço e Botão */}
            <div className="flex items-center justify-between">
              {settings.show_product_price && (
                <div className="flex flex-col">
                  <p className="text-base font-bold" style={{ color: storeColors.primary }}>
                    {formatPrice(product.price)}
                  </p>
                  {settings.show_product_stock && (
                    <span className="text-xs text-green-600 font-medium">
                      Em estoque
                    </span>
                  )}
                </div>
              )}
              
              {/* Botão de adicionar */}
              {settings.show_quick_add && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="rounded-lg p-2 text-white transition-all duration-200 hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: storeColors.primary }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
