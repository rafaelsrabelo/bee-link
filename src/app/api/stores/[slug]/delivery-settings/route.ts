import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Para GET, não exigir autenticação para permitir acesso do checkout
    const { data: { user } } = await supabase.auth.getUser();

    // Buscar a loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }


    // Buscar configurações de entrega
    const { data: deliverySettings, error: deliveryError } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (deliveryError && deliveryError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar configurações de entrega:', deliveryError);
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
          estimated_delivery_time_from: "00:30",
          estimated_delivery_time_to: "01:00"
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar configurações de entrega:', insertError);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
      }

      // Adicionar campos de tempo separados na resposta
      const responseData = {
        ...newSettings,
        estimated_delivery_time_from: "00:30",
        estimated_delivery_time_to: "01:00"
      };

      return NextResponse.json(responseData);
    }

    // Converter estimated_delivery_time_hours para os campos separados se necessário
    const responseData = {
      ...deliverySettings,
      estimated_delivery_time_from: deliverySettings.estimated_delivery_time_from || "00:30",
      estimated_delivery_time_to: deliverySettings.estimated_delivery_time_to || "01:00"
    };

    return NextResponse.json(responseData);
  } catch (error) {
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
      estimated_delivery_time_from,
      estimated_delivery_time_to,
      estimated_delivery_time_hours // Campo antigo para compatibilidade
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

    // Definir valores padrão para campos de tempo se não fornecidos
    const timeFrom = estimated_delivery_time_from || "00:30";
    const timeTo = estimated_delivery_time_to || "01:00";

    // Preparar dados para atualização (apenas campos que existem na tabela)
    const updateData: {
      store_id: string;
      delivery_enabled: boolean;
      delivery_radius_km: number;
      price_per_km: number;
      minimum_delivery_fee: number;
      free_delivery_threshold: number;
      updated_at: string;
      estimated_delivery_time_hours?: number;
    } = {
      store_id: store.id,
      delivery_enabled,
      delivery_radius_km,
      price_per_km,
      minimum_delivery_fee,
      free_delivery_threshold,
      updated_at: new Date().toISOString()
    };

    // Converter campos de tempo para o formato do banco
    // Converter HH:MM para horas (ex: "00:30" -> 0.5, "01:00" -> 1.0)
    const fromHours = Number.parseInt(timeFrom.split(':')[0]) + 
                     Number.parseInt(timeFrom.split(':')[1]) / 60;
    const toHours = Number.parseInt(timeTo.split(':')[0]) + 
                   Number.parseInt(timeTo.split(':')[1]) / 60;
    
    // Usar a média dos dois valores (convertendo para inteiro)
    updateData.estimated_delivery_time_hours = Math.round((fromHours + toHours) / 2);

    // Atualizar configurações
    const { data: updatedSettings, error: updateError } = await supabase
      .from('delivery_settings')
      .upsert(updateData, {
        onConflict: 'store_id'
      })
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar configurações de entrega:', updateError);
      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 });
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
