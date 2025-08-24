import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { slug } = await params;
    
    // Buscar a loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é dono da loja
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { categories } = await request.json();

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Verificar se todas as categorias existem
    const categoryIds = categories.map((c: { id: number }) => c.id);
    const { data: existingCategories, error: checkError } = await supabase
      .from('product_categories')
      .select('id')
      .in('id', categoryIds)
      .eq('is_active', true);

    if (checkError) {
      console.error('Erro ao verificar categorias:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar categorias' }, { status: 500 });
    }

    if (existingCategories.length !== categoryIds.length) {
      return NextResponse.json({ error: 'Algumas categorias não foram encontradas' }, { status: 404 });
    }

    // Atualizar a ordem das categorias usando UPDATE individual para contornar RLS
    console.log('Tentando atualizar categorias:', categories);

    for (const category of categories) {
      const { error: updateError } = await supabase
        .from('product_categories')
        .update({ sort_order: category.sort_order })
        .eq('id', category.id)
        .eq('is_active', true);

      if (updateError) {
        console.error(`Erro ao atualizar categoria ${category.id}:`, updateError);
        return NextResponse.json({ 
          error: 'Erro ao salvar ordem',
          details: updateError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ordem das categorias atualizada com sucesso' 
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
