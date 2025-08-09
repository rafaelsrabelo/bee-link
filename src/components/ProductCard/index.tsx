import Image from 'next/image';
import { Star, ShoppingCart, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image: string;
    rating?: number;
    stock?: number;
    tags?: string[];
  };
  settings: {
    show_description: boolean;
    show_price: boolean;
    show_rating: boolean;
    show_stock: boolean;
    show_badges: boolean;
    show_quick_add: boolean;
  };
  onQuickAdd?: (productId: string) => void;
}

export function ProductCard({ product, settings, onQuickAdd }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-background-secondary p-4 shadow-sm transition-all hover:shadow-md">
      {/* Imagem do produto */}
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Tags */}
        {settings.show_badges && product.tags && product.tags.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-background-secondary/80 px-2 py-1 text-xs font-medium text-content-headline backdrop-blur-sm"
              >
                <Tag className="mr-1 inline-block h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Informações do produto */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-content-headline">{product.name}</h3>
        
        {settings.show_description && product.description && (
          <p className="text-sm text-content-body line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          {settings.show_price && (
            <span className="text-lg font-bold text-accent-purple">
              {formatPrice(product.price)}
            </span>
          )}

          {settings.show_quick_add && onQuickAdd && (
            <button
              type="button"
              onClick={() => onQuickAdd(product.id)}
              className="rounded-full bg-accent-purple p-2 text-white shadow-sm transition-colors hover:bg-accent-purple/90"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          )}
        </div>

        {settings.show_rating && product.rating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent-pink text-accent-pink" />
            <span className="text-sm font-medium text-content-body">
              {product.rating.toFixed(1)}
            </span>
          </div>
        )}

        {settings.show_stock && product.stock !== undefined && (
          <div className="text-sm text-content-body">
            {product.stock > 0 ? (
              <span className="text-accent-green">
                {product.stock} {product.stock === 1 ? 'unidade' : 'unidades'} em estoque
              </span>
            ) : (
              <span className="text-red-500">Fora de estoque</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
