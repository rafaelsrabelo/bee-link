import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar a loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é dono da loja
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar configurações de entrega
    const { data: deliverySettings, error: deliveryError } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (deliveryError && deliveryError.code !== 'PGRST116') {
      console.error('Erro ao buscar configurações de entrega:', deliveryError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Se não existem configurações, criar com valores padrão
    if (!deliverySettings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('delivery_settings')
        .insert({
          store_id: store.id,
          delivery_enabled: false,
          delivery_radius_km: 5.0,
          price_per_km: 2.50,
          minimum_delivery_fee: 5.00,
          free_delivery_threshold: 50.00,
          estimated_delivery_time_hours: 24
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar configurações de entrega:', insertError);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
      }

      return NextResponse.json(newSettings);
    }

    return NextResponse.json(deliverySettings);
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar a loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é dono da loja
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Validar dados
    const {
      delivery_enabled,
      delivery_radius_km,
      price_per_km,
      minimum_delivery_fee,
      free_delivery_threshold,
      estimated_delivery_time_hours
    } = body;

    if (typeof delivery_enabled !== 'boolean') {
      return NextResponse.json({ error: 'Campo delivery_enabled é obrigatório' }, { status: 400 });
    }

    if (delivery_radius_km < 0) {
      return NextResponse.json({ error: 'Raio de entrega deve ser maior ou igual a 0' }, { status: 400 });
    }

    if (price_per_km < 0) {
      return NextResponse.json({ error: 'Preço por km deve ser maior ou igual a 0' }, { status: 400 });
    }

    if (minimum_delivery_fee < 0) {
      return NextResponse.json({ error: 'Taxa mínima deve ser maior ou igual a 0' }, { status: 400 });
    }

    if (free_delivery_threshold < 0) {
      return NextResponse.json({ error: 'Valor para entrega gratuita deve ser maior ou igual a 0' }, { status: 400 });
    }

    if (estimated_delivery_time_hours < 1) {
      return NextResponse.json({ error: 'Tempo estimado deve ser maior que 0' }, { status: 400 });
    }

    // Atualizar configurações
    const { data: updatedSettings, error: updateError } = await supabase
      .from('delivery_settings')
      .upsert({
        store_id: store.id,
        delivery_enabled,
        delivery_radius_km,
        price_per_km,
        minimum_delivery_fee,
        free_delivery_threshold,
        estimated_delivery_time_hours,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar configurações de entrega:', updateError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
