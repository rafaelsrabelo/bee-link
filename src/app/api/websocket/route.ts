import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getWebSocketManager } from '../../../lib/websocket-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Retornar estatísticas do WebSocket
    const wsManager = getWebSocketManager();
    const stats = wsManager.getStats();

    return NextResponse.json({
      message: 'WebSocket Server está funcionando',
      stats,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro na API WebSocket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, storeId, data } = body;

    const wsManager = getWebSocketManager();

    switch (action) {
      case 'notify_new_order':
        if (storeId && data) {
          wsManager.notifyNewOrder(storeId, data);
          return NextResponse.json({ success: true, message: 'Notificação enviada' });
        }
        break;

      case 'notify_order_update':
        if (storeId && data) {
          wsManager.notifyOrderUpdate(storeId, data);
          return NextResponse.json({ success: true, message: 'Atualização enviada' });
        }
        break;

      case 'notify_order_delete':
        if (storeId && data?.id) {
          wsManager.notifyOrderDelete(storeId, data.id);
          return NextResponse.json({ success: true, message: 'Exclusão notificada' });
        }
        break;

      case 'notify_pending_count':
        if (storeId && typeof data?.count === 'number') {
          wsManager.notifyPendingOrdersCount(storeId, data.count);
          return NextResponse.json({ success: true, message: 'Contagem atualizada' });
        }
        break;

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  } catch (error) {
    console.error('Erro na API WebSocket POST:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
