import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const { coupon_code, order_value } = await request.json();

    if (!coupon_code || !order_value) {
      return NextResponse.json({ 
        error: 'Código do cupom e valor do pedido são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Debug: Log dos parâmetros
    console.log('🔍 Debug - Parâmetros da validação:', {
      coupon_code: coupon_code.toUpperCase(),
      store_id: store.id,
      order_value: order_value
    });

    // Validar cupom usando a função SQL
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_coupon', {
        p_coupon_code: coupon_code.toUpperCase(),
        p_store_id: store.id,
        p_order_value: order_value
      });

    // Debug: Log do resultado
    console.log('🔍 Debug - Resultado da validação:', {
      validation,
      validationError
    });

    if (validationError) {
      console.error('Erro ao validar cupom:', validationError);
      return NextResponse.json({ error: 'Erro ao validar cupom' }, { status: 500 });
    }

    if (!validation || validation.length === 0) {
      console.log('🔍 Debug - Cupom não encontrado ou resultado vazio');
      return NextResponse.json({ 
        is_valid: false, 
        message: 'Cupom não encontrado' 
      });
    }

    const result = validation[0];

    if (result.is_valid) {
      // Calcular desconto
      const { data: discount, error: discountError } = await supabase
        .rpc('calculate_discount', {
          p_promotion_id: result.promotion_id,
          p_order_value: order_value
        });

      if (discountError) {
        console.error('Erro ao calcular desconto:', discountError);
        return NextResponse.json({ error: 'Erro ao calcular desconto' }, { status: 500 });
      }

      // Buscar informações atualizadas do cupom (incluindo contador de uso)
      const { data: couponInfo, error: couponError } = await supabase
        .from('coupons')
        .select('used_count, usage_limit')
        .eq('code', coupon_code.toUpperCase())
        .single();

      return NextResponse.json({
        is_valid: true,
        promotion_id: result.promotion_id,
        discount_type: result.discount_type,
        discount_value: result.discount_value,
        max_discount: result.max_discount,
        calculated_discount: discount,
        used_count: couponInfo?.used_count || 0,
        usage_limit: couponInfo?.usage_limit,
        message: result.message
      });
    } else {
      return NextResponse.json({
        is_valid: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Erro na API de validação de cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
