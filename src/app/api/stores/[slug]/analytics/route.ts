import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar a loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é dono da loja
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Obter parâmetros de filtro
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    // Obter analytics usando função do banco
    const { data: analytics, error } = await supabase.rpc('get_store_analytics', {
      p_store_slug: slug,
      p_days: days
    });

    if (error) {
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Formatar dados para resposta
    const analyticsData = {
      total_views: analytics?.[0]?.total_views || 0,
      total_clicks: analytics?.[0]?.total_clicks || 0,
      total_cart_clicks: analytics?.[0]?.total_cart_clicks || 0,
      total_header_cart_clicks: analytics?.[0]?.total_header_cart_clicks || 0,
      unique_visitors: analytics?.[0]?.unique_visitors || 0,
      avg_views_per_session: Number(analytics?.[0]?.avg_views_per_session) || 0,
      top_products: analytics?.[0]?.top_products || [],
      top_cart_products: analytics?.[0]?.top_cart_products || [],
      daily_stats: analytics?.[0]?.daily_stats || []
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 