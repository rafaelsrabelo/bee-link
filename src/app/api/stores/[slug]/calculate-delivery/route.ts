import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
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

    // Validar dados de entrada
    const { distance_km, order_total } = body;

    if (typeof distance_km !== 'number' || distance_km < 0) {
      return NextResponse.json({ error: 'Distância deve ser um número positivo' }, { status: 400 });
    }

    if (typeof order_total !== 'number' || order_total < 0) {
      return NextResponse.json({ error: 'Valor do pedido deve ser um número positivo' }, { status: 400 });
    }

    // Buscar configurações de entrega
    const { data: deliverySettings, error: deliveryError } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (deliveryError) {
      console.error('Erro ao buscar configurações de entrega:', deliveryError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    if (!deliverySettings) {
      return NextResponse.json({ error: 'Configurações de entrega não encontradas' }, { status: 404 });
    }

    // Calcular taxa de entrega usando a função do banco
    const { data: result, error: calcError } = await supabase
      .rpc('calculate_delivery_fee', {
        p_store_id: store.id,
        p_distance_km: distance_km,
        p_order_total: order_total
      });

    if (calcError) {
      console.error('Erro ao calcular taxa de entrega:', calcError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Verificar se a entrega é possível
    let deliveryPossible = true;
    let reason = '';

    if (!deliverySettings.delivery_enabled) {
      deliveryPossible = false;
      reason = 'Entrega não está habilitada para esta loja';
    } else if (distance_km > deliverySettings.delivery_radius_km) {
      deliveryPossible = false;
      reason = `Distância (${distance_km}km) está fora do raio de entrega (${deliverySettings.delivery_radius_km}km)`;
    }

    return NextResponse.json({
      delivery_fee: result || 0,
      delivery_possible: deliveryPossible,
      reason: reason,
      settings: {
        delivery_enabled: deliverySettings.delivery_enabled,
        delivery_radius_km: deliverySettings.delivery_radius_km,
        price_per_km: deliverySettings.price_per_km,
        minimum_delivery_fee: deliverySettings.minimum_delivery_fee,
        free_delivery_threshold: deliverySettings.free_delivery_threshold,
        estimated_delivery_time_hours: deliverySettings.estimated_delivery_time_hours
      }
    });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
