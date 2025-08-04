import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (error || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, logo, colors, social_networks } = body;

    // Validações
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome da loja é obrigatório' }, { status: 400 });
    }

    if (!social_networks?.whatsapp?.trim()) {
      return NextResponse.json({ error: 'WhatsApp é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário é dono da loja
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('user_id')
      .eq('slug', params.slug)
      .single();

    if (checkError || !existingStore) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    if (existingStore.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Atualizar a loja
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({
        name: name.trim(),
        description: description?.trim() || '',
        logo: logo || '',
        colors: colors || {
          primary: '#8B5CF6',
          secondary: '#7C3AED',
          accent: '#A855F7'
        },
        social_networks: social_networks || {},
        updated_at: new Date().toISOString()
      })
      .eq('slug', params.slug)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar loja:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar loja' }, { status: 500 });
    }

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 