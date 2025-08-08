'use client';

import React from 'react';

interface PriceWithDiscountProps {
  originalPrice: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  className?: string;
  showDiscountLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PriceWithDiscount({
  originalPrice,
  discountAmount,
  discountType,
  discountValue,
  className = '',
  showDiscountLabel = true,
  size = 'md'
}: PriceWithDiscountProps) {
  const finalPrice = originalPrice - discountAmount;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDiscount = () => {
    if (discountType === 'percentage') {
      return `${discountValue}% OFF`;
    }
    return `${formatPrice(discountValue)} OFF`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          original: 'text-sm text-gray-500',
          final: 'text-lg font-semibold text-green-600',
          discount: 'text-xs'
        };
      case 'lg':
        return {
          original: 'text-lg text-gray-500',
          final: 'text-2xl font-bold text-green-600',
          discount: 'text-sm'
        };
      default: // md
        return {
          original: 'text-base text-gray-500',
          final: 'text-xl font-semibold text-green-600',
          discount: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Preço Final */}
      <div className="flex items-center gap-2">
        <span className={sizeClasses.final}>
          {formatPrice(finalPrice)}
        </span>
        
        {/* Badge de Desconto */}
        {showDiscountLabel && (
          <span className={`px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium ${sizeClasses.discount}`}>
            {formatDiscount()}
          </span>
        )}
      </div>

      {/* Preço Original Riscado */}
      <span className={`line-through ${sizeClasses.original}`}>
        {formatPrice(originalPrice)}
      </span>

      {/* Economia */}
      <span className={`text-green-600 font-medium ${sizeClasses.discount}`}>
        Economia de {formatPrice(discountAmount)}
      </span>
    </div>
  );
}
