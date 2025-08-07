import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('store_slug');
    const customerPhone = searchParams.get('customer_phone');

    if (!storeSlug || !customerPhone) {
      return NextResponse.json(
        { error: 'store_slug e customer_phone são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Buscar a loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // 2. Buscar pedidos do cliente na loja
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', store.id)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Erro ao buscar pedidos:', ordersError);
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      );
    }

    return NextResponse.json(orders || []);

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}