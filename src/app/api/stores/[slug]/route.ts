import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { slug } = await params;
    
    const { data: store, error } = await supabase
      .from('stores')
      .select(`
        *,
        category:store_categories(id, name, slug, description, icon, color)
      `)
      .eq('slug', slug)
      .single();

    if (error || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { slug } = await params;
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, logo, colors, social_networks, category_id } = body;

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
      .eq('slug', slug)
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
        category_id: category_id || null,
        colors: colors || {
          primary: '#8B5CF6',
          secondary: '#7C3AED',
          accent: '#A855F7'
        },
        social_networks: social_networks || {},
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar loja' }, { status: 500 });
    }

    return NextResponse.json(updatedStore);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 