import type { CreatePromotionData } from '@/types/promotions';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    // Buscar promoções com detalhes
    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select(`
        *,
        coupons (
          *,
          coupon_usage (
            id,
            order_id
          )
        ),
        promotion_products (*),
        promotion_categories (*)
      `)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    if (promotionsError) {
      return NextResponse.json({ error: 'Erro ao buscar promoções' }, { status: 500 });
    }


    return NextResponse.json({ promotions });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const body: CreatePromotionData = await request.json();

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

    // Criar promoção
    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .insert({
        store_id: store.id,
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
      .select()
      .single();

    if (promotionError) {
      console.error('Erro ao criar promoção:', promotionError);
      return NextResponse.json({ error: 'Erro ao criar promoção' }, { status: 500 });
    }

    // Criar cupons se fornecidos
    if (body.coupon_codes && body.coupon_codes.length > 0) {
      const couponsData = body.coupon_codes
        .filter(code => code && code.trim() !== '') // Filtrar códigos vazios
        .map(code => ({
          promotion_id: promotion.id,
          code: code.toUpperCase().trim(),
          is_active: true,
        }));

      if (couponsData.length > 0) {
        const { error: couponsError } = await supabase
          .from('coupons')
          .insert(couponsData);

        if (couponsError) {
          console.error('Erro ao criar cupons:', couponsError);
          // Não falhar se apenas os cupons derem erro
        }
      }
    }

    // Adicionar produtos se fornecidos
    if (body.product_ids && body.product_ids.length > 0) {
      const productsData = body.product_ids.map(product_id => ({
        promotion_id: promotion.id,
        product_id,
      }));

      const { error: productsError } = await supabase
        .from('promotion_products')
        .insert(productsData);

      if (productsError) {
        console.error('Erro ao adicionar produtos:', productsError);
      }
    }

    // Adicionar categorias se fornecidas
    if (body.category_ids && body.category_ids.length > 0) {
      const categoriesData = body.category_ids.map(category_id => ({
        promotion_id: promotion.id,
        category_id,
      }));

      const { error: categoriesError } = await supabase
        .from('promotion_categories')
        .insert(categoriesData);

      if (categoriesError) {
        console.error('Erro ao adicionar categorias:', categoriesError);
      }
    }

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error('Erro na API de promoções:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
