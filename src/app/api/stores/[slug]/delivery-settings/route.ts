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
          estimated_delivery_time_hours: 1
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
      }

      // Converter estimated_delivery_time_hours para campos separados na resposta
      const hours = newSettings.estimated_delivery_time_hours || 1;
      const fromMinutes = Math.floor(hours * 30); // 30% do tempo total
      const toMinutes = Math.floor(hours * 60); // 100% do tempo total
      
      const responseData = {
        ...newSettings,
        estimated_delivery_time_from: `${Math.floor(fromMinutes / 60).toString().padStart(2, '0')}:${(fromMinutes % 60).toString().padStart(2, '0')}`,
        estimated_delivery_time_to: `${Math.floor(toMinutes / 60).toString().padStart(2, '0')}:${(toMinutes % 60).toString().padStart(2, '0')}`
      };

      return NextResponse.json(responseData);
    }

    // Converter estimated_delivery_time_hours para os campos separados se necessário
    const hours = deliverySettings.estimated_delivery_time_hours || 1;
    const fromMinutes = Math.floor(hours * 30); // 30% do tempo total
    const toMinutes = Math.floor(hours * 60); // 100% do tempo total
    
    const responseData = {
      ...deliverySettings,
      estimated_delivery_time_from: `${Math.floor(fromMinutes / 60).toString().padStart(2, '0')}:${(fromMinutes % 60).toString().padStart(2, '0')}`,
      estimated_delivery_time_to: `${Math.floor(toMinutes / 60).toString().padStart(2, '0')}:${(toMinutes % 60).toString().padStart(2, '0')}`
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
    try {
      const fromParts = timeFrom.split(':');
      const toParts = timeTo.split(':');
      
      if (fromParts.length !== 2 || toParts.length !== 2) {
        throw new Error('Formato de tempo inválido');
      }
      
      const fromHours = Number.parseInt(fromParts[0]) + Number.parseInt(fromParts[1]) / 60;
      const toHours = Number.parseInt(toParts[0]) + Number.parseInt(toParts[1]) / 60;
      
      // Usar a média dos dois valores (convertendo para inteiro)
      const estimatedHours = Math.round((fromHours + toHours) / 2);
      
      // Adicionar o campo apenas se a conversão foi bem-sucedida
      updateData.estimated_delivery_time_hours = estimatedHours;
    } catch (error) {
      // Usar valor padrão se houver erro
      updateData.estimated_delivery_time_hours = 1;
    }
    
    // Atualizar configurações
    const { data: updatedSettings, error: updateError } = await supabase
      .from('delivery_settings')
      .upsert(updateData, {
        onConflict: 'store_id'
      })
      .select()
      .single();

    if (updateError) {
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
