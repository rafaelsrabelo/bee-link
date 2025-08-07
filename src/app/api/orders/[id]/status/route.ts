import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import type { Order, UpdateOrderStatusRequest } from '../../../../../types/order';

interface OrderWithStore extends Order {
  store: {
    name: string;
    social_networks?: {
      whatsapp?: string;
    };
  };
}

interface StoreInfo {
  name: string;
  social_networks?: {
    whatsapp?: string;
  };
}

// Função para formatar mensagem de status para WhatsApp
function formatStatusMessage(order: OrderWithStore, newStatus: string, store: StoreInfo) {
  const statusMessages = {
    'pending': `⏳ *PEDIDO RECEBIDO!*\n\nOlá ${order.customer_name}! 😊\n\nRecebemos seu pedido e em breve entraremos em contato!\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n⏰ Aguarde nossa confirmação.\n\nObrigado pela preferência! 🙏`,
    
    'accepted': `✅ *PEDIDO ACEITO!*\n\nOlá ${order.customer_name}! 😊\n\nSeu pedido foi aceito e está sendo preparado com carinho!\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n⏰ Em breve entraremos em contato para confirmar a entrega.\n\nObrigado pela preferência! 🙏`,
    
    'preparing': `👨‍🍳 *PEDIDO EM PREPARAÇÃO!*\n\nOlá ${order.customer_name}! 😋\n\nSeu pedido está sendo preparado com todo carinho!\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n⏳ Aguarde mais um pouquinho que em breve estará pronto!\n\nObrigado pela paciência! ⭐`,
    
    'delivering': `🚚 *PEDIDO SAINDO PARA ENTREGA!*\n\nOlá ${order.customer_name}! 🎉\n\nSeu pedido está a caminho! 🛵💨\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n🏠 Em breve estará na sua casa!\n\nObrigado por escolher ${store.name}! ❤️`,
    
    'delivered': `🎉 *PEDIDO ENTREGUE!*\n\nOlá ${order.customer_name}! 😍\n\nSeu pedido foi entregue com sucesso!\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n⭐ Esperamos que tenha gostado!\n\nObrigado pela preferência e volte sempre! 🙏✨`,
    
    'cancelled': `❌ *PEDIDO CANCELADO*\n\nOlá ${order.customer_name},\n\nInfelizmente precisamos cancelar seu pedido.\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n\n😔 Pedimos desculpas pelo inconveniente.\n\nEm caso de dúvidas, entre em contato conosco.\n\nObrigado pela compreensão.`,
    
    'completed_whatsapp': `✅ *PEDIDO CONCLUÍDO PELO WHATSAPP!*\n\nOlá ${order.customer_name}! 🎉\n\nSeu pedido foi finalizado com sucesso via WhatsApp!\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n⭐ Obrigado pela preferência!\n\nVolte sempre! 🙏✨`,
    
    'not_completed_whatsapp': `⚠️ *PEDIDO NÃO FINALIZADO*\n\nOlá ${order.customer_name},\n\nSeu pedido não foi finalizado via WhatsApp.\n\n📋 *Pedido #${order.id.slice(0, 8)}*\n\n📞 Entre em contato conosco para mais informações.\n\nObrigado pela compreensão.`
  };

  return statusMessages[newStatus as keyof typeof statusMessages] || '';
}

// Função para enviar mensagem WhatsApp automaticamente
async function sendWhatsAppNotification(phone: string, message: string) {
  try {
    // OPÇÃO 1: Usando WhatsApp Business API (requer configuração)
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
      const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message }
        })
      });

      if (response.ok) {
        return { success: true, method: 'meta-api' };
      }
    }

    // OPÇÃO 2: Usando webhook (Zapier, Make, etc.)
    if (process.env.WHATSAPP_WEBHOOK_URL) {
      const response = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          message: message,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        return { success: true, method: 'webhook' };
      }
    }

    return { success: true, method: 'logged' };

  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    return { success: false, error: error };
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateOrderStatusRequest = await request.json();
    const { status, notes } = body;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        store:stores(
          name,
          social_networks
        )
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        notes: notes || order.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar pedido:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar pedido', details: updateError.message },
        { status: 500 }
      );
    }

    // 3. Enviar notificação automática para WhatsApp
    if (status !== 'pending' && order.customer_phone) {
      const statusMessage = formatStatusMessage(order, status, order.store);
      
      if (statusMessage) {
        await sendWhatsAppNotification(order.customer_phone, statusMessage);
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro na atualização do status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 