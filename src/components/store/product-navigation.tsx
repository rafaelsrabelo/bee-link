'use client';

import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  description?: string;
  readyToShip?: boolean;
  available?: boolean;
}

interface ProductNavigationProps {
  storeSlug: string;
  productId: string;
  children: React.ReactNode;
  className?: string;
  onProductClick?: (product: Product) => void;
  product?: Product;
}

export default function ProductNavigation({ 
  storeSlug, 
  productId, 
  children, 
  className = '',
  onProductClick,
  product
}: ProductNavigationProps) {
  const router = useRouter();

  const handleClick = () => {
    // No mobile, navegar para página separada
    if (window.innerWidth < 768) {
      router.push(`/${storeSlug}/${productId}`);
      return;
    }
    
    // No web, chamar o onProductClick se disponível
    if (onProductClick && product) {
      onProductClick(product);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {children}
    </div>
  );
}
