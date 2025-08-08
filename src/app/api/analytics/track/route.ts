import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Analytics API: Received request');
    
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    console.log('📋 Analytics API: Request body:', body);
    
    const { 
      event_type, 
      store_slug, 
      product_id, 
      product_name, 
      product_price,
      referrer
    } = body;

    console.log('🔍 Analytics API: Extracted data:', {
      event_type,
      store_slug,
      product_id,
      product_name,
      product_price,
      referrer
    });

    // Registrar o evento no banco de dados - apenas campos que existem na tabela
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
      console.error('❌ Analytics API: Database error:', error);
      return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 });
    }

    console.log('✅ Analytics API: Event registered successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Analytics API: Internal error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 