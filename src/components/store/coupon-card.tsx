'use client';

import { Tag } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CouponCardProps {
  storeSlug: string;
  orderValue?: number;
  appliedCoupon?: {
    couponCode: string;
    calculated_discount: number;
  } | null;
  onCouponApplied?: (couponData: {
    is_valid: boolean;
    promotion_id?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    max_discount?: number;
    calculated_discount?: number;
    message: string;
    couponCode?: string;
  }) => void;
  onRemoveCoupon?: () => void;
}

export default function CouponCard({ 
  storeSlug, 
  orderValue = 0, 
  appliedCoupon,
  onCouponApplied,
  onRemoveCoupon 
}: CouponCardProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    // Verificar se já há um cupom aplicado
    if (appliedCoupon) {
      toast.error('Remova o cupom atual antes de aplicar outro');
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch(`/api/stores/${storeSlug}/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCode.trim(),
          order_value: orderValue,
        }),
      });

      const result = await response.json();

      if (result.is_valid) {
        const couponData = {
          ...result,
          couponCode: couponCode.trim(),
        };
        onCouponApplied?.(couponData);
        toast.success(`Cupom ${couponCode.trim()} aplicado com sucesso!`);
        setCouponCode(''); // Limpar input após sucesso
      } else {
        toast.error(result.message || 'Cupom inválido');
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      toast.error('Erro ao validar cupom');
    } finally {
      setIsValidating(false);
    }
  };



    return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <Tag className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Cupom de Desconto</h3>
      </div>

      <div className="space-y-3">
        {appliedCoupon ? (
          /* Cupom Aplicado */
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">
                Cupom Aplicado
              </span>
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remover
              </button>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-green-700 mb-1">
                {appliedCoupon.couponCode}
              </div>
              <div className="text-sm text-green-600">
                Desconto: R$ {appliedCoupon.calculated_discount.toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          /* Input do Cupom */
          <div className="space-y-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite seu cupom"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg"
              onKeyPress={(e) => e.key === 'Enter' && handleValidateCoupon()}
            />
            <button
              type="button"
              onClick={handleValidateCoupon}
              disabled={isValidating || !couponCode.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isValidating ? 'Validando...' : 'Aplicar Cupom'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
