import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

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

    // Buscar dados diretamente da tabela analytics_events
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('store_slug', slug)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (analyticsError) {
      console.error('Erro ao buscar analytics:', analyticsError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Calcular métricas manualmente
    const totalViews = analyticsData?.filter(e => e.event_type === 'page_view').length || 0;
    const totalClicks = analyticsData?.filter(e => e.event_type === 'product_click').length || 0;
    const totalCartClicks = analyticsData?.filter(e => e.event_type === 'cart_add').length || 0;
    const uniqueVisitors = new Set(analyticsData?.map(e => e.ip_address).filter(Boolean)).size;
    const directLinks = analyticsData?.filter(e => e.is_direct_link === true).length || 0;

    // Calcular produtos mais clicados
    const productClicks = analyticsData
      ?.filter(e => e.event_type === 'product_click' && e.product_id)
      .reduce((acc, e) => {
        const key = e.product_id;
        if (!acc[key]) {
          acc[key] = { product_id: e.product_id, product_name: e.product_name, clicks: 0 };
        }
        acc[key].clicks++;
        return acc;
      }, {} as Record<string, any>);

    const topProducts = Object.values(productClicks || {})
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 10)
      .map((product: any, index: number) => ({
        ...product,
        rank: index + 1
      }));

    // Calcular produtos mais adicionados ao carrinho
    const cartEvents = analyticsData?.filter(e => e.event_type === 'cart_add' && e.product_id) || [];
    console.log('🔍 Cart events found:', cartEvents.length);
    
    const cartProducts = cartEvents.reduce((acc, e) => {
      const key = e.product_id;
      if (!acc[key]) {
        acc[key] = { product_id: e.product_id, product_name: e.product_name, clicks: 0 };
      }
      acc[key].clicks++;
      return acc;
    }, {} as Record<string, any>);

    const topCartProducts = Object.values(cartProducts || {})
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 10)
      .map((product: any, index: number) => ({
        ...product,
        rank: index + 1
      }));
      
    console.log('🛒 Top cart products:', topCartProducts);

    // Calcular estatísticas diárias
    const dailyStats = analyticsData
      ?.reduce((acc, e) => {
        const date = new Date(e.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, views: 0, unique_sessions: new Set() };
        }
        if (e.event_type === 'page_view') {
          acc[date].views++;
        }
        if (e.ip_address) {
          acc[date].unique_sessions.add(e.ip_address);
        }
        return acc;
      }, {} as Record<string, any>);

    const dailyStatsArray = Object.values(dailyStats || {}).map((day: any) => ({
      date: day.date,
      views: day.views,
      unique_sessions: day.unique_sessions.size
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);

    // Formatar dados para resposta
    const analyticsDataFormatted = {
      total_views: totalViews,
      total_clicks: totalClicks,
      total_cart_clicks: totalCartClicks,
      unique_visitors: uniqueVisitors,
      avg_views_per_session: uniqueVisitors > 0 ? Number((totalViews / uniqueVisitors).toFixed(1)) : 0,
      direct_links: directLinks,
      top_products: topProducts,
      top_cart_products: topCartProducts,
      daily_stats: dailyStatsArray
    };

    return NextResponse.json(analyticsDataFormatted);
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 