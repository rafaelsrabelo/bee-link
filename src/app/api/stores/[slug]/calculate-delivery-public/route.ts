import { calculateDistance, geocodeAddress } from '@/lib/distance';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    console.log('🔍 Calculando entrega para:', { slug, body });
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Buscar a loja (sem autenticação)
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      console.error('❌ Loja não encontrada:', storeError);
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

    // Buscar configurações de entrega PRIMEIRO
    const { data: deliverySettings, error: deliveryError } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (deliveryError || !deliverySettings) {
      console.error('❌ Configurações de entrega não encontradas:', deliveryError);
      return NextResponse.json({ error: 'Configurações de entrega não encontradas' }, { status: 404 });
    }

    // IMPORTANTE: Verificar frete grátis ANTES de calcular distância
    const valueForFreeDelivery = subtotal || order_total;
    
    if (deliverySettings.free_delivery_threshold > 0 && valueForFreeDelivery >= deliverySettings.free_delivery_threshold) {
      console.log('✅ Frete grátis - valor atingido:', { valueForFreeDelivery, threshold: deliverySettings.free_delivery_threshold });
      return NextResponse.json({
        delivery_fee: 0,
        delivery_possible: true,
        reason: 'Frete grátis - valor mínimo atingido',
        distance_km: 0,
        settings: {
          delivery_enabled: deliverySettings.delivery_enabled,
          delivery_radius_km: deliverySettings.delivery_radius_km,
          price_per_km: deliverySettings.price_per_km,
          minimum_delivery_fee: deliverySettings.minimum_delivery_fee,
          free_delivery_threshold: deliverySettings.free_delivery_threshold
        }
      });
    }

    // Se não é frete grátis, então calcular distância
    console.log('📍 Calculando distância...');

    // Tentar usar coordenadas salvas da loja primeiro
    let storeCoords = null;
    
    if (store.latitude && store.longitude) {
      storeCoords = {
        lat: store.latitude,
        lng: store.longitude
      };
      console.log('✅ Usando coordenadas salvas da loja:', storeCoords);
    } else {
      // Se não tem coordenadas salvas, calcular a partir do endereço
      const storeAddress = `${store.address.street}, ${store.address.number || ''}, ${store.address.neighborhood || ''}, ${store.address.city}, ${store.address.state}, ${store.address.zip_code || ''}`;
      
      console.log('🔍 Geocodificando endereço da loja:', storeAddress);
      storeCoords = await geocodeAddress(storeAddress);
      
      if (!storeCoords) {
        console.error('❌ Erro ao geocodificar endereço da loja');
        return NextResponse.json({ 
          error: 'Não foi possível calcular as coordenadas da loja. Verifique se o endereço está correto.' 
        }, { status: 400 });
      }
    }

    // Geocodificar endereço do cliente
    console.log('🔍 Geocodificando endereço do cliente:', customer_address);
    const customerCoords = await geocodeAddress(customer_address);
    
    if (!customerCoords) {
      console.error('❌ Erro ao geocodificar endereço do cliente');
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

    console.log('📏 Distância calculada:', calculatedDistance, 'km');

    // Calcular taxa de entrega
    let deliveryFee = 0;
    let deliveryPossible = true;
    let reason = '';

    if (!deliverySettings.delivery_enabled) {
      deliveryPossible = false;
      reason = 'Entrega não está habilitada para esta loja';
    } else if (calculatedDistance > deliverySettings.delivery_radius_km) {
      deliveryPossible = false;
      reason = `Distância (${calculatedDistance}km) está fora do raio de entrega (${deliverySettings.delivery_radius_km}km)`;
    } else {
      // Calcular taxa baseada na distância
      deliveryFee = calculatedDistance * deliverySettings.price_per_km;
      
      // Aplicar taxa mínima se necessário
      if (deliveryFee < deliverySettings.minimum_delivery_fee) {
        deliveryFee = deliverySettings.minimum_delivery_fee;
      }
    }

    console.log('💰 Taxa de entrega calculada:', { deliveryFee, deliveryPossible, reason });

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
        free_delivery_threshold: deliverySettings.free_delivery_threshold
      }
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
