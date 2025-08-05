import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const { event_type, store_slug, product_id, product_name, product_price } = body;

    // Registrar o evento no banco de dados
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type,
        store_slug,
        product_id,
        product_name,
        product_price,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao registrar evento:', error);
      return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API de tracking:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 