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

    const { products } = await request.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Verificar se todos os produtos pertencem à loja
    const productIds = products.map((p: { id: string }) => p.id);
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', store.id)
      .in('id', productIds);

    if (checkError) {
      return NextResponse.json({ error: 'Erro ao verificar produtos' }, { status: 500 });
    }

    if (existingProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'Alguns produtos não pertencem à loja' }, { status: 403 });
    }

    // Atualizar a ordem dos produtos usando UPDATE individual para contornar RLS
    console.log('Tentando atualizar produtos:', products);

    for (const product of products) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ display_order: product.display_order })
        .eq('id', product.id)
        .eq('store_id', store.id); // Garantir que o produto pertence à loja

      if (updateError) {
        console.error(`Erro ao atualizar produto ${product.id}:`, updateError);
        return NextResponse.json({ 
          error: 'Erro ao salvar ordem', 
          details: updateError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ordem dos produtos atualizada com sucesso' 
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
