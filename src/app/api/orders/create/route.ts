import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import type { CreateOrderRequest, Order, OrderItem } from '../../../../types/order';

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
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/orders/create - Iniciando criação de pedido');
    
    const body: CreateOrderRequest = await request.json();
    console.log('📦 Dados recebidos:', JSON.stringify(body, null, 2));
    
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

    // 1. Buscar a loja pelo slug
    console.log('🔍 Buscando loja com slug:', storeSlug);
    
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, social_networks')
      .eq('slug', storeSlug)
      .single();

    console.log('🏪 Resultado da busca da loja:', { store, storeError });

    if (storeError || !store) {
      console.error('❌ Loja não encontrada:', { storeSlug, storeError });
      return NextResponse.json(
        { error: 'Loja não encontrada', slug: storeSlug, storeError: storeError?.message },
        { status: 404 }
      );
    }

    // 2. Criar ou buscar o cliente
    console.log('👤 Processando cliente:', { customer_name, customer_phone });
    
    let customerId: string;
    
    // Primeiro, tentar buscar cliente existente pelo telefone
    const { data: existingCustomer, error: existingCustomerError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', customer_phone)
      .eq('store_id', store.id)
      .single();

    console.log('🔍 Busca de cliente existente:', { existingCustomer, existingCustomerError });

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('✅ Cliente existente encontrado:', customerId);
    } else {
      console.log('🆕 Criando novo cliente...');
      
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

      console.log('👤 Resultado da criação do cliente:', { newCustomer, customerError });

      if (customerError) {
        console.error('❌ Erro ao criar cliente:', customerError);
        return NextResponse.json(
          { error: 'Erro ao criar cliente', details: customerError.message },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
      console.log('✅ Novo cliente criado:', customerId);
    }

    // Objeto básico sempre funciona
    const orderInsert: Record<string, unknown> = {
      store_id: store.id,
      customer_id: customerId,
      customer_name,
      customer_phone,
      customer_address,
      items,
      total,
      source,
      notes,
      status: isManualOrder ? 'delivered' : 'pending'
    };

    // Adicionar campos básicos que sabemos que existem
    orderInsert.delivery_address = customer_address;
    
    // Incluir informações novas nas notes temporariamente até migração do banco
    let notesWithExtras = notes || '';
    if (delivery_type) notesWithExtras += `\nTipo entrega: ${delivery_type}`;
    if (payment_method) notesWithExtras += `\nPagamento: ${payment_method}`;
    if (delivery_fee && delivery_fee > 0) notesWithExtras += `\nTaxa entrega: R$ ${delivery_fee.toFixed(2)}`;
    if (coupon_code) notesWithExtras += `\nCupom: ${coupon_code} (-R$ ${coupon_discount?.toFixed(2) || '0'})`;
    if (subtotal) notesWithExtras += `\nSubtotal: R$ ${subtotal.toFixed(2)}`;
    notesWithExtras += `\nTotal Final: R$ ${total.toFixed(2)}`;
    
    orderInsert.notes = notesWithExtras;

    // Se uma data foi fornecida, usar ela; senão usar a data atual
    if (order_date) {
      orderInsert.created_at = new Date(`${order_date}T00:00:00.000Z`).toISOString();
    }

    console.log('📦 Dados do pedido para inserção:', JSON.stringify(orderInsert, null, 2));
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderInsert])
      .select()
      .single();

    console.log('🛒 Resultado da criação do pedido:', { order, orderError });

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

    // 4. Retornar sucesso
    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Pedido criado com sucesso'
    });

  } catch (error) {
    console.error('Erro na criação do pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 