import { calculateDistance, geocodeAddress } from '@/lib/distance';
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
    const { distance_km, order_total, customer_address } = body;

    // Se não foi fornecida distância, calcular baseado no endereço do cliente
    let calculatedDistance = distance_km;
    
    if (typeof calculatedDistance !== 'number' && customer_address) {
      // Verificar se a loja tem coordenadas
      if (!store.latitude || !store.longitude) {
        return NextResponse.json({ 
          error: 'Loja não possui coordenadas configuradas. Configure o endereço da loja primeiro.' 
        }, { status: 400 });
      }

      // Geocodificar endereço do cliente
      const customerCoords = await geocodeAddress(customer_address);
      
      if (!customerCoords) {
        return NextResponse.json({ 
          error: 'Não foi possível calcular a distância. Verifique se o endereço está correto.' 
        }, { status: 400 });
      }

      // Calcular distância
      calculatedDistance = calculateDistance(
        store.latitude,
        store.longitude,
        customerCoords.lat,
        customerCoords.lng
      );
    }

    if (typeof calculatedDistance !== 'number' || calculatedDistance < 0) {
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

    // Verificar se entrega está habilitada
    if (!deliverySettings.delivery_enabled) {
      return NextResponse.json({
        delivery_fee: 0,
        delivery_possible: false,
        reason: 'Entrega não está habilitada para esta loja',
        distance_km: calculatedDistance || 0,
        settings: {
          delivery_enabled: deliverySettings.delivery_enabled,
          delivery_radius_km: deliverySettings.delivery_radius_km,
          price_per_km: deliverySettings.price_per_km,
          minimum_delivery_fee: deliverySettings.minimum_delivery_fee,
          free_delivery_threshold: deliverySettings.free_delivery_threshold,
          estimated_delivery_time_from: deliverySettings.estimated_delivery_time_from,
          estimated_delivery_time_to: deliverySettings.estimated_delivery_time_to
        }
      });
    }

    // Verificar se a distância está dentro do raio permitido
    if (calculatedDistance > deliverySettings.delivery_radius_km) {
      return NextResponse.json({
        delivery_fee: 0,
        delivery_possible: false,
        reason: `Distância (${calculatedDistance}km) está fora do raio de entrega (${deliverySettings.delivery_radius_km}km)`,
        distance_km: calculatedDistance,
        settings: {
          delivery_enabled: deliverySettings.delivery_enabled,
          delivery_radius_km: deliverySettings.delivery_radius_km,
          price_per_km: deliverySettings.price_per_km,
          minimum_delivery_fee: deliverySettings.minimum_delivery_fee,
          free_delivery_threshold: deliverySettings.free_delivery_threshold,
          estimated_delivery_time_from: deliverySettings.estimated_delivery_time_from,
          estimated_delivery_time_to: deliverySettings.estimated_delivery_time_to
        }
      });
    }

    // Se chegou até aqui, a distância está dentro do raio
    // Agora verificar se aplica frete grátis
    if (deliverySettings.free_delivery_threshold > 0 && order_total >= deliverySettings.free_delivery_threshold) {
      return NextResponse.json({
        delivery_fee: 0,
        delivery_possible: true,
        reason: 'Frete grátis - valor mínimo atingido',
        distance_km: calculatedDistance,
        settings: {
          delivery_enabled: deliverySettings.delivery_enabled,
          delivery_radius_km: deliverySettings.delivery_radius_km,
          price_per_km: deliverySettings.price_per_km,
          minimum_delivery_fee: deliverySettings.minimum_delivery_fee,
          free_delivery_threshold: deliverySettings.free_delivery_threshold,
          estimated_delivery_time_from: deliverySettings.estimated_delivery_time_from,
          estimated_delivery_time_to: deliverySettings.estimated_delivery_time_to
        }
      });
    }

    // Calcular taxa de entrega normal (dentro do raio, sem frete grátis)
    let deliveryFee = calculatedDistance * deliverySettings.price_per_km;
    
    // Aplicar taxa mínima se necessário
    if (deliveryFee < deliverySettings.minimum_delivery_fee) {
      deliveryFee = deliverySettings.minimum_delivery_fee;
    }

    return NextResponse.json({
      delivery_fee: deliveryFee,
      delivery_possible: true,
      reason: 'Entrega disponível',
      distance_km: calculatedDistance,
      settings: {
        delivery_enabled: deliverySettings.delivery_enabled,
        delivery_radius_km: deliverySettings.delivery_radius_km,
        price_per_km: deliverySettings.price_per_km,
        minimum_delivery_fee: deliverySettings.minimum_delivery_fee,
        free_delivery_threshold: deliverySettings.free_delivery_threshold,
        estimated_delivery_time_from: deliverySettings.estimated_delivery_time_from,
        estimated_delivery_time_to: deliverySettings.estimated_delivery_time_to
      }
    });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
