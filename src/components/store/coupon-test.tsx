'use client';

import { useState } from 'react';
import PriceWithDiscount from '../ui/price-with-discount';
import CouponCard from './coupon-card';

export default function CouponTest() {
  const [orderValue, setOrderValue] = useState(100);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
  } | null>(null);

  const handleCouponApplied = (couponData: {
    is_valid: boolean;
    promotion_id?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    max_discount?: number;
    calculated_discount?: number;
    message: string;
    couponCode?: string;
  }) => {
    if (couponData.is_valid) {
      setAppliedCoupon({
        code: couponData.couponCode || '',
        discountType: couponData.discount_type || 'percentage',
        discountValue: couponData.discount_value || 0,
        discountAmount: couponData.calculated_discount || 0
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Teste de Cupom de Desconto</h2>
      
      {/* Simulador de Pedido */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Simulador de Pedido</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Valor do Pedido:</label>
          <input
            type="number"
            value={orderValue}
            onChange={(e) => setOrderValue(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md w-24"
            min="0"
            step="0.01"
          />
          <span className="text-sm text-gray-600">R$</span>
        </div>
      </div>

      {/* Componente de Cupom */}
      <div className="mb-6">
        <CouponCard
          storeSlug="teste-rabelo"
          orderValue={orderValue}
          onCouponApplied={handleCouponApplied}
        />
      </div>

      {/* Resumo do Pedido */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>R$ {orderValue.toFixed(2)}</span>
          </div>
          
          {appliedCoupon && (
            <>
              <div className="flex justify-between text-green-600">
                <span>Desconto ({appliedCoupon.code}):</span>
                <span>- R$ {appliedCoupon.discountAmount.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <PriceWithDiscount
                    originalPrice={orderValue}
                    discountAmount={appliedCoupon.discountAmount}
                    discountType={appliedCoupon.discountType}
                    discountValue={appliedCoupon.discountValue}
                    size="lg"
                  />
                </div>
              </div>
            </>
          )}
          
          {!appliedCoupon && (
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>R$ {orderValue.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Como testar:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Vá para a aba &quot;Produtos&quot; → &quot;Promoções&quot; no admin</li>
          <li>2. Crie uma promoção com cupom (ex: &quot;DESCONTO10&quot;)</li>
          <li>3. Configure o desconto (10% ou valor fixo)</li>
          <li>4. Volte aqui e teste o cupom</li>
          <li>5. Digite o código do cupom e veja o desconto aplicado</li>
        </ol>
      </div>
    </div>
  );
}
