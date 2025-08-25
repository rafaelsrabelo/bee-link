import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import type { CreateOrderRequest, Order, OrderItem } from '../../../../types/order';
import { calculateDistance, geocodeAddress } from '@/lib/distance';

interface StoreData {
  id: string;
  name: string;
  social_networks?: {
    whatsapp?: string;
  };
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Função para formatar mensagem do WhatsApp
function formatWhatsAppMessage(order: OrderWithItems, store: StoreData) {
  const items = order.items.map((item: OrderItem) => 
    `• ${item.quantity}x ${item.name} - R$ ${item.price.toFixed(2).replace('.', ',')}`
  ).join('\n');

  // Extrair informações das notes (temporário até migração)
  const notes = order.notes || '';
  const deliveryFeeMatch = notes.match(/Taxa entrega: R\$ ([\d,\.]+)/);
  const couponMatch = notes.match(/Cupom: (\w+) \(-R\$ ([\d,\.]+)\)/);
  const subtotalMatch = notes.match(/Subtotal: R\$ ([\d,\.]+)/);
  
  const discountInfo = couponMatch 
    ? `\n🎫 *Desconto (${couponMatch[1]}):* - R$ ${couponMatch[2]}`
    : '';
  
  const deliveryFeeInfo = deliveryFeeMatch
    ? `\n🚚 *Taxa de Entrega:* + R$ ${deliveryFeeMatch[1]}`
    : '';

  const subtotalInfo = subtotalMatch && subtotalMatch[1] !== order.total.toFixed(2)
    ? `\n💰 *Subtotal: R$ ${subtotalMatch[1]}*`
    : '';

  const message = `🛒 *NOVO PEDIDO RECEBIDO!*

📋 *Pedido #${order.id.slice(0, 8)}*
👤 *Cliente:* ${order.customer_name}
📱 *Telefone:* ${order.customer_phone}
${order.customer_address ? `📍 *Endereço:* ${order.customer_address}\n` : ''}

🛍️ *Itens:*
${items}

${subtotalInfo}${discountInfo}${deliveryFeeInfo}

💵 *Total Final:* R$ ${order.total.toFixed(2).replace('.', ',')}
${order.notes ? `📝 *Observações:* ${order.notes}\n` : ''}

⏰ *Horário:* ${new Date().toLocaleString('pt-BR')}

Para aceitar o pedido, acesse o painel administrativo.`;

  return message;
}

// Função para enviar mensagem para WhatsApp
async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Iniciando criação de pedido...');
    const body: CreateOrderRequest = await request.json();
    console.log('📝 Dados recebidos:', JSON.stringify(body, null, 2));
    const { 
      storeSlug, 
      customer_name, 
      customer_phone, 
      customer_address, 
      items, 
      total, 
      source, 
      isManualOrder, 
      notes, 
      order_date,
      delivery_type,
      delivery_cep,
      delivery_city,
      delivery_state,
      payment_method,
      delivery_fee,
      delivery_distance_km,
      coupon_code,
      coupon_discount,
      subtotal
    } = body;

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, social_networks, latitude, longitude, address')
      .eq('slug', storeSlug)
      .single();

    if (storeError || !store) {
      console.error('❌ Loja não encontrada:', { storeSlug, storeError });
      return NextResponse.json(
        { error: 'Loja não encontrada', slug: storeSlug, storeError: storeError?.message },
        { status: 404 }
      );
    }

    // VALIDAÇÃO DO RAIO DE ENTREGA
    if (delivery_type === 'delivery' && delivery_distance_km && delivery_distance_km > 0) {
      // Buscar configurações de entrega da loja
      const { data: deliverySettings, error: deliveryError } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (deliveryError || !deliverySettings) {
        console.error('❌ Configurações de entrega não encontradas:', deliveryError);
        return NextResponse.json(
          { error: 'Configurações de entrega não encontradas' },
          { status: 400 }
        );
      }

      // Verificar se entrega está habilitada
      if (!deliverySettings.delivery_enabled) {
        return NextResponse.json(
          { error: 'Entrega não está habilitada para esta loja' },
          { status: 400 }
        );
      }

      // Verificar se a distância está dentro do raio permitido
      if (delivery_distance_km > deliverySettings.delivery_radius_km) {
        console.error('❌ Pedido fora do raio de entrega:', { 
          distance: delivery_distance_km, 
          maxRadius: deliverySettings.delivery_radius_km 
        });
        return NextResponse.json(
          { 
            error: `Pedido fora do raio de entrega. Distância: ${delivery_distance_km}km, Raio máximo: ${deliverySettings.delivery_radius_km}km` 
          },
          { status: 400 }
        );
      }

      // Se não foi fornecida distância mas temos endereço, calcular
      if (!delivery_distance_km && customer_address) {
        let storeCoords = null;
        
        // Usar coordenadas salvas da loja se disponíveis
        if (store.latitude && store.longitude) {
          storeCoords = { lat: store.latitude, lng: store.longitude };
        } else if (store.address) {
          // Calcular coordenadas da loja a partir do endereço
          const storeAddress = `${store.address.street}, ${store.address.number || ''}, ${store.address.neighborhood || ''}, ${store.address.city}, ${store.address.state}, ${store.address.zip_code || ''}`;
          storeCoords = await geocodeAddress(storeAddress);
        }

        if (storeCoords) {
          // Calcular coordenadas do cliente
          const customerCoords = await geocodeAddress(customer_address);
          
          if (customerCoords) {
            const calculatedDistance = calculateDistance(
              storeCoords.lat,
              storeCoords.lng,
              customerCoords.lat,
              customerCoords.lng
            );

            // Verificar se a distância calculada está dentro do raio
            if (calculatedDistance > deliverySettings.delivery_radius_km) {
              console.error('❌ Pedido fora do raio de entrega (calculado):', { 
                distance: calculatedDistance, 
                maxRadius: deliverySettings.delivery_radius_km 
              });
              return NextResponse.json(
                { 
                  error: `Pedido fora do raio de entrega. Distância: ${calculatedDistance.toFixed(1)}km, Raio máximo: ${deliverySettings.delivery_radius_km}km` 
                },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    let customerId: string;
    
    // Primeiro, tentar buscar cliente existente pelo telefone
    const { data: existingCustomer, error: existingCustomerError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', customer_phone)
      .eq('store_id', store.id)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Criar novo cliente
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          store_id: store.id,
          name: customer_name,
          phone: customer_phone,
          address: customer_address
        }])
        .select('id')
        .single();

      if (customerError) {
        return NextResponse.json(
          { error: 'Erro ao criar cliente', details: customerError.message },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
    }

    // Converter items para garantir que price seja number
    const processedItems = items.map(item => ({
      ...item,
      price: typeof item.price === 'string' ? Number.parseFloat(item.price) : item.price
    }));

    // Objeto básico sempre funciona
    const orderInsert: Record<string, unknown> = {
      store_id: store.id,
      customer_id: customerId,
      customer_name,
      customer_phone,
      customer_address,
      items: processedItems,
      total: typeof total === 'string' ? Number.parseFloat(total) : total,
      source,
      notes,
      status: isManualOrder ? 'delivered' : 'pending'
    };

    // Adicionar campos básicos que sabemos que existem
    orderInsert.delivery_address = customer_address;
    
    // Incluir informações novas nas notes temporariamente até migração do banco
    let notesWithExtras = notes || '';
    if (delivery_type) notesWithExtras += `\nTipo de entrega: ${delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}`;
    if (payment_method) {
      const paymentMethodNames: {[key: string]: string} = {
        'money': 'Dinheiro',
        'pix': 'PIX',
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito'
      };
      notesWithExtras += `\nForma de pagamento: ${paymentMethodNames[payment_method] || payment_method}`;
    }
    if (delivery_fee && delivery_fee > 0) notesWithExtras += `\nTaxa de entrega: R$ ${delivery_fee.toFixed(2)}`;
    if (coupon_code) notesWithExtras += `\nCupom: ${coupon_code} (-R$ ${coupon_discount?.toFixed(2) || '0'})`;
    if (subtotal) notesWithExtras += `\nSubtotal: R$ ${subtotal.toFixed(2)}`;
    notesWithExtras += `\nTotal Final: R$ ${total.toFixed(2)}`;
    
    orderInsert.notes = notesWithExtras;

    // Se uma data foi fornecida, usar ela; senão usar a data atual
    if (order_date) {
      orderInsert.created_at = new Date(`${order_date}T00:00:00.000Z`).toISOString();
    }

    console.log('📝 Tentando inserir pedido:', JSON.stringify(orderInsert, null, 2));
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderInsert])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Erro ao criar pedido:', orderError);
      
      // Se o erro for de coluna não existe, dar uma mensagem mais clara
      if (orderError.message?.includes('column') && orderError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Erro de configuração do banco', 
            details: 'Execute o script SQL para adicionar as novas colunas',
            sqlError: orderError.message 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar pedido', details: orderError.message },
        { status: 500 }
      );
    }

    // 3. Enviar mensagem para WhatsApp
    const whatsappMessage = formatWhatsAppMessage(order, store);
    await sendWhatsAppMessage(store.social_networks?.whatsapp, whatsappMessage);

    // 4. Notificar WebSocket sobre novo pedido
    try {
              const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
        const wsResponse = await fetch(`${wsUrl.replace('ws://', 'http://').replace('wss://', 'https://')}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeSlug,
          eventType: 'order_created',
          data: {
            orderId: order.id,
            customerName: order.customer_name,
            total: order.total,
            status: order.status
          }
        }),
      });
      
      if (wsResponse.ok) {
        console.log('📡 WebSocket notificado sobre novo pedido');
      } else {
        console.log('⚠️ WebSocket não disponível, continuando...');
      }
    } catch (error) {
      console.log('⚠️ Erro ao notificar WebSocket:', error);
    }

    // 5. Retornar sucesso
    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Pedido criado com sucesso'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 