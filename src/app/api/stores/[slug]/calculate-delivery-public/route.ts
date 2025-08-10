import { calculateDistance, geocodeAddress } from '@/lib/distance';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Buscar a loja (sem autenticação)
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Validar dados de entrada
    const { customer_address, order_total, subtotal } = body;

    if (typeof order_total !== 'number' || order_total < 0) {
      return NextResponse.json({ error: 'Valor do pedido deve ser um número positivo' }, { status: 400 });
    }

    // Se não foi fornecido endereço do cliente, retornar erro
    if (!customer_address) {
      return NextResponse.json({ error: 'Endereço do cliente é obrigatório' }, { status: 400 });
    }

    // Verificar se a loja tem endereço configurado
    if (!store.address) {
      return NextResponse.json({ 
        error: 'Loja não possui endereço configurado. Configure o endereço da loja primeiro.' 
      }, { status: 400 });
    }

    // Montar endereço da loja
    const storeAddress = `${store.address.street}, ${store.address.number || ''}, ${store.address.neighborhood || ''}, ${store.address.city}, ${store.address.state}, ${store.address.zip_code || ''}`;

    // Geocodificar endereço da loja
    const storeCoords = await geocodeAddress(storeAddress);
    
    if (!storeCoords) {
      return NextResponse.json({ 
        error: 'Não foi possível calcular as coordenadas da loja. Verifique se o endereço está correto.' 
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
    const calculatedDistance = calculateDistance(
      storeCoords.lat,
      storeCoords.lng,
      customerCoords.lat,
      customerCoords.lng
    );

    // Buscar configurações de entrega
    const { data: deliverySettings, error: deliveryError } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (deliveryError || !deliverySettings) {
      return NextResponse.json({ error: 'Configurações de entrega não encontradas' }, { status: 404 });
    }

    // Calcular taxa de entrega
    let deliveryFee = 0;
    
    if (deliverySettings.delivery_enabled && calculatedDistance <= deliverySettings.delivery_radius_km) {
      // IMPORTANTE: Frete grátis deve ser baseado no subtotal original (antes do desconto)
      // Usar subtotal se fornecido, senão usar order_total como fallback
      const valueForFreeDelivery = subtotal || order_total;
      
      // Se pedido atinge o valor mínimo para entrega gratuita (só se o threshold > 0)
      if (deliverySettings.free_delivery_threshold > 0 && valueForFreeDelivery >= deliverySettings.free_delivery_threshold) {
        deliveryFee = 0;
      } else {
        // Calcular taxa baseada na distância
        deliveryFee = calculatedDistance * deliverySettings.price_per_km;
        
        // Aplicar taxa mínima se necessário
        if (deliveryFee < deliverySettings.minimum_delivery_fee) {
          deliveryFee = deliverySettings.minimum_delivery_fee;
        }
      }
    }

    // Verificar se a entrega é possível
    let deliveryPossible = true;
    let reason = '';

    if (!deliverySettings.delivery_enabled) {
      deliveryPossible = false;
      reason = 'Entrega não está habilitada para esta loja';
    } else if (calculatedDistance > deliverySettings.delivery_radius_km) {
      deliveryPossible = false;
      reason = `Distância (${calculatedDistance}km) está fora do raio de entrega (${deliverySettings.delivery_radius_km}km)`;
    }

    return NextResponse.json({
      delivery_fee: deliveryFee,
      delivery_possible: deliveryPossible,
      reason: reason,
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
