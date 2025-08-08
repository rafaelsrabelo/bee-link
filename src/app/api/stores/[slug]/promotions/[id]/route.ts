import type { UpdatePromotionData } from '@/types/promotions';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const body: UpdatePromotionData = await request.json();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é dono da loja
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Verificar se a promoção existe e pertence à loja
    const { data: existingPromotion, error: checkError } = await supabase
      .from('promotions')
      .select('id')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (checkError || !existingPromotion) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 });
    }

    // Atualizar promoção
    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .update({
        name: body.name,
        description: body.description,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_order_value: body.min_order_value,
        max_discount: body.max_discount,
        usage_limit: body.usage_limit,
        is_active: body.is_active,
        start_date: body.start_date,
        end_date: body.end_date,
        days_of_week: body.days_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
      })
      .eq('id', id)
      .select()
      .single();

    if (promotionError) {
      console.error('Erro ao atualizar promoção:', promotionError);
      return NextResponse.json({ error: 'Erro ao atualizar promoção' }, { status: 500 });
    }

    // Remover produtos e categorias existentes
    await supabase.from('promotion_products').delete().eq('promotion_id', id);
    await supabase.from('promotion_categories').delete().eq('promotion_id', id);
    await supabase.from('coupons').delete().eq('promotion_id', id);

    // Adicionar novos produtos se fornecidos
    if (body.product_ids && body.product_ids.length > 0) {
      const productsData = body.product_ids.map(product_id => ({
        promotion_id: id,
        product_id,
      }));

      const { error: productsError } = await supabase
        .from('promotion_products')
        .insert(productsData);

      if (productsError) {
        console.error('Erro ao adicionar produtos:', productsError);
      }
    }

    // Adicionar novas categorias se fornecidas
    if (body.category_ids && body.category_ids.length > 0) {
      const categoriesData = body.category_ids.map(category_id => ({
        promotion_id: id,
        category_id,
      }));

      const { error: categoriesError } = await supabase
        .from('promotion_categories')
        .insert(categoriesData);

      if (categoriesError) {
        console.error('Erro ao adicionar categorias:', categoriesError);
      }
    }

    // Criar novos cupons se fornecidos
    if (body.coupon_codes && body.coupon_codes.length > 0) {
      const couponsData = body.coupon_codes.map(code => ({
        promotion_id: id,
        code: code.toUpperCase(),
        is_active: true,
      }));

      const { error: couponsError } = await supabase
        .from('coupons')
        .insert(couponsData);

      if (couponsError) {
        console.error('Erro ao criar cupons:', couponsError);
      }
    }

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('Erro na API de promoções:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é dono da loja
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Verificar se a promoção existe e pertence à loja
    const { data: existingPromotion, error: checkError } = await supabase
      .from('promotions')
      .select('id')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (checkError || !existingPromotion) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 });
    }

    // Deletar promoção (cascata irá deletar produtos, categorias e cupons)
    const { error: deleteError } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar promoção:', deleteError);
      return NextResponse.json({ error: 'Erro ao deletar promoção' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Promoção deletada com sucesso' });
  } catch (error) {
    console.error('Erro na API de promoções:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
