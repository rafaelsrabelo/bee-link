import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    console.log('🛍️ Buscando produtos públicos para:', slug);

    // 1. Buscar a loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // 2. Buscar produtos disponíveis da loja
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('available', true)
      .order('name');

    if (productsError) {
      console.error('Erro ao buscar produtos:', productsError);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500 }
      );
    }

    // Converter preços para number e garantir que não sejam zero
    const formattedProducts = (products || []).map(product => ({
      ...product,
      price: Number(product.price) || 9.99 // Preço padrão se vier 0
    }));

    console.log('✅ Produtos encontrados:', formattedProducts.length);

    return NextResponse.json({
      products: formattedProducts
    });

  } catch (error) {
    console.error('Erro na API de produtos públicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}