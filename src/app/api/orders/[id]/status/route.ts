import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = params;
    const { status } = await request.json();

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o pedido para obter o store_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Buscar informações da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('slug, user_id')
      .eq('id', order.store_id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário tem acesso à loja
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Atualizar o status do pedido
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
    }

    // Notificar WebSocket sobre mudança de status
    try {
              const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
        const wsResponse = await fetch(`${wsUrl.replace('ws://', 'http://').replace('wss://', 'https://')}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeSlug: store.slug,
          eventType: 'order_updated',
          data: {
            orderId: id,
            newStatus: status,
            customerName: updatedOrder.customer_name,
            total: updatedOrder.total
          }
        }),
      });
      
      if (wsResponse.ok) {
        console.log('📡 WebSocket notificado sobre mudança de status');
      }
    } catch (error) {
      console.log('⚠️ Erro ao notificar WebSocket:', error);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 