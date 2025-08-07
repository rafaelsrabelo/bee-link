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

  const message = `🛒 *NOVO PEDIDO RECEBIDO!*

📋 *Pedido #${order.id.slice(0, 8)}*
👤 *Cliente:* ${order.customer_name}
📱 *Telefone:* ${order.customer_phone}
${order.customer_address ? `📍 *Endereço:* ${order.customer_address}\n` : ''}

🛍️ *Itens:*
${items}

💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')}
${order.notes ? `📝 *Observações:* ${order.notes}\n` : ''}

⏰ *Horário:* ${new Date().toLocaleString('pt-BR')}

Para aceitar o pedido, acesse o painel administrativo.`;

  return message;
}

// Função para enviar mensagem para WhatsApp
async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    // Aqui você pode integrar com a API do WhatsApp Business
    // Por enquanto, vamos apenas simular o envio
    console.log('Enviando mensagem para WhatsApp:', phone);
    console.log('Mensagem:', message);
    
    // Exemplo de integração com WhatsApp Business API:
    // const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: phone,
    //     type: 'text',
    //     text: { body: message }
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
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
      payment_method
    } = body;

    console.log('Criando pedido para loja:', storeSlug);
    console.log('Dados do pedido:', { customer_name, customer_phone, items, total });

    // 1. Buscar a loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, social_networks')
      .eq('slug', storeSlug)
      .single();

    console.log('Resultado da busca da loja:', { store, storeError });

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada', slug: storeSlug, storeError: storeError?.message },
        { status: 404 }
      );
    }

    // 2. Criar ou buscar o cliente
    let customerId: string;
    
    // Primeiro, tentar buscar cliente existente pelo telefone
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', customer_phone)
      .eq('store_id', store.id)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('Cliente encontrado:', customerId);
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
        console.error('Erro ao criar cliente:', customerError);
        return NextResponse.json(
          { error: 'Erro ao criar cliente', details: customerError.message },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
      console.log('Novo cliente criado:', customerId);
    }

    // 3. Criar o pedido no banco
    console.log(`📦 Criando pedido: source=${source}, isManualOrder=${isManualOrder}, status=${isManualOrder ? 'delivered' : 'pending'}`);
    
    // Objeto básico sempre funciona
    const orderInsert: any = {
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

    // Adicionar novos campos opcionais (só se existirem no schema)
    try {
      if (delivery_type) orderInsert.delivery_type = delivery_type;
      if (payment_method) orderInsert.payment_method = payment_method;
      if (delivery_cep) orderInsert.delivery_cep = delivery_cep;
      if (delivery_city) orderInsert.delivery_city = delivery_city;
      if (delivery_state) orderInsert.delivery_state = delivery_state;
      // Manter compatibility com delivery_address
      orderInsert.delivery_address = customer_address;
    } catch (error) {
      console.log('Algumas colunas novas podem não existir ainda no banco:', error);
    }

    // Se uma data foi fornecida, usar ela; senão usar a data atual
    if (order_date) {
      orderInsert.created_at = new Date(`${order_date}T00:00:00.000Z`).toISOString();
    }

    console.log('Dados que serão inseridos:', JSON.stringify(orderInsert, null, 2));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderInsert])
      .select()
      .single();

    if (orderError) {
      console.error('Erro detalhado ao criar pedido:', orderError);
      console.error('Dados tentando inserir:', orderInsert);
      
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