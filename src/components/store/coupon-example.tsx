'use client';

import React, { useState } from 'react';
import PriceWithDiscount from '../ui/price-with-discount';
import CouponCard from './coupon-card';

interface CouponExampleProps {
  storeSlug: string;
}

export default function CouponExample({ storeSlug }: CouponExampleProps) {
  const [orderValue, setOrderValue] = useState(100);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    is_valid: boolean;
    promotion_id?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    max_discount?: number;
    calculated_discount?: number;
    message: string;
    couponCode?: string;
  } | null>(null);

  const handleCouponApplied = (couponData: typeof appliedCoupon) => {
    setAppliedCoupon(couponData);
  };

  const finalPrice = appliedCoupon?.calculated_discount 
    ? orderValue - appliedCoupon.calculated_discount 
    : orderValue;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Exemplo de Cupom</h2>
        
        {/* Simulador de Valor do Pedido */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor do Pedido (Simulação)
          </label>
          <input
            type="number"
            value={orderValue}
            onChange={(e) => setOrderValue(Number.parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
          />
        </div>

        {/* Cupom Card */}
        <CouponCard
          storeSlug={storeSlug}
          orderValue={orderValue}
          onCouponApplied={handleCouponApplied}
        />

        {/* Resumo do Pedido */}
        {orderValue > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo do Pedido</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(orderValue)}
                </span>
              </div>

              {appliedCoupon?.is_valid && appliedCoupon.calculated_discount && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({appliedCoupon.couponCode}):</span>
                    <span className="font-medium">
                      - {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(appliedCoupon.calculated_discount)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(finalPrice)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {!appliedCoupon?.is_valid && orderValue > 0 && (
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(orderValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exemplo de Preço com Desconto */}
        {appliedCoupon?.is_valid && appliedCoupon.calculated_discount && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Preço com Desconto</h3>
            <PriceWithDiscount
              originalPrice={orderValue}
              discountAmount={appliedCoupon.calculated_discount}
              discountType={appliedCoupon.discount_type || 'percentage'}
              discountValue={appliedCoupon.discount_value || 0}
              size="lg"
              className="justify-center"
            />
          </div>
        )}
      </div>
    </div>
  );
}
