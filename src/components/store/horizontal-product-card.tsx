import { Plus, Star } from 'lucide-react';
import Image from 'next/image';
import { fixCorruptedPrice, formatPriceFromCents } from '../../lib/price-utils';
import ProductNavigation from './product-navigation';

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
  storeSlug: string;
}

export default function HorizontalProductCard({
  product,
  storeColors,
  layoutSettings,
  onProductClick,
  onAddToCart,
  storeSlug
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group border border-gray-100 overflow-hidden relative">
      {/* Badge de Pronta Entrega - posicionado no canto superior direito do card */}
      {settings.show_product_badges && product.readyToShip && (
        <div className="absolute top-2 right-2 z-10">
          <div 
            className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium shadow-sm border"
            style={{ 
              color: storeColors.primary,
              borderColor: `${storeColors.primary}20`
            }}
          >
            Pronta entrega
          </div>
        </div>
      )}
      
      <div className="flex">
        {/* Imagem do Produto - Esquerda - Maior e mais impactante */}
        <ProductNavigation 
          storeSlug={storeSlug}
          productId={product.id}
          className="relative w-32 flex-shrink-0 overflow-hidden"
          onProductClick={onProductClick}
          product={product}
        >
          <Image 
            src={product.image} 
            alt={product.name} 
            fill 
            className="object-cover rounded-l-xl h-full"
            style={{ objectPosition: 'center' }}
          />
          
          {/* Overlay sutil no hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 rounded-l-xl" />
        </ProductNavigation>

        {/* Informações do Produto - Direita */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <ProductNavigation 
            storeSlug={storeSlug}
            productId={product.id}
            className="cursor-pointer flex-1"
            onProductClick={onProductClick}
            product={product}
          >
            {/* Nome do produto */}
            <h4 className="font-bold text-gray-900 text-base leading-tight line-clamp-1 mb-1">
              {product.name}
            </h4>
            
            {/* Descrição */}
            {settings.show_product_description && product.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
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
            
            {/* Espaço para desconto (futuro) */}
            {/* <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400 line-through">R$ 6,00</span>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">-17%</span>
            </div> */}
            
            {/* Preço e Botão */}
            <div className="flex items-center justify-between">
              {settings.show_product_price && (
                <div className="flex flex-col">
                  <p className="text-base font-bold" style={{ color: storeColors.primary }}>
                    {formatPriceFromCents(fixCorruptedPrice(product.price))}
                  </p>
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
                  className="rounded-full p-2.5 text-white transition-all duration-200 hover:scale-105 hover:shadow-md shadow-sm"
                  style={{ backgroundColor: storeColors.primary }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </ProductNavigation>
        </div>
      </div>
    </div>
  );
}
