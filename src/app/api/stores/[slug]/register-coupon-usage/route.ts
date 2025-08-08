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
    const { coupon_code, order_id } = await request.json();

    if (!coupon_code) {
      return NextResponse.json({ 
        error: 'Código do cupom é obrigatório' 
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
    console.log('🔍 Debug - Registrando uso do cupom:', {
      coupon_code: coupon_code.toUpperCase(),
      store_slug: slug,
      user_ip: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    // Registrar uso do cupom diretamente na tabela
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', coupon_code.toUpperCase())
      .single();

    if (couponError || !coupon) {
      return NextResponse.json({ 
        error: 'Cupom não encontrado' 
      }, { status: 404 });
    }

    // Inserir registro de uso
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: coupon.id,
        order_id: order_id || null,
        user_ip: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      });

    if (usageError) {
      console.error('Erro ao registrar uso:', usageError);
      return NextResponse.json({ error: 'Erro ao registrar uso do cupom' }, { status: 500 });
    }

    // Atualizar contador no cupom
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ used_count: supabase.rpc('increment_used_count', { coupon_id: coupon.id }) })
      .eq('id', coupon.id);

    if (updateError) {
      console.error('Erro ao atualizar contador:', updateError);
      // Não falhar se apenas a atualização do contador der erro
    }

    // Debug: Log do resultado
    console.log('🔍 Debug - Uso do cupom registrado com sucesso');

    return NextResponse.json({ 
      success: true, 
      message: 'Uso do cupom registrado com sucesso' 
    });

  } catch (error) {
    console.error('Erro na API de registro de uso de cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
