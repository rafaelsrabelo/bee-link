import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de consulta
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const onlyToday = searchParams.get('onlyToday') === 'true';

    // 1. Buscar a loja pelo slug primeiro
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // 2. Construir query para pedidos
    let query = supabase
      .from('orders')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filtro de data
    if (onlyToday) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      query = query
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());
    } else if (dateFrom && dateTo) {
      query = query
        .gte('created_at', new Date(dateFrom).toISOString())
        .lte('created_at', new Date(dateTo + 'T23:59:59').toISOString());
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Erro ao buscar pedidos:', ordersError);
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      );
    }

    // 3. Buscar contagem total para paginação (otimizada)
    let countQuery = supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', store.id);

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (onlyToday) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      countQuery = countQuery
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());
    } else if (dateFrom && dateTo) {
      countQuery = countQuery
        .gte('created_at', new Date(dateFrom).toISOString())
        .lte('created_at', new Date(dateTo + 'T23:59:59').toISOString());
    }

    const { count } = await countQuery;

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Erro na API de pedidos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}