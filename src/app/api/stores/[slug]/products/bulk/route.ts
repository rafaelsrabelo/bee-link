import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Esta API é para operações em lote (bulk) - substituir TODOS os produtos
export async function POST(
  request: NextRequest,
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
    
    // Primeiro, buscar a loja pelo slug
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

    const products = await request.json();

    // ESTA API DELETA TODOS OS PRODUTOS E RECRIA (bulk operation)
    // Deletar produtos existentes da loja
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('store_id', store.id);

    if (deleteError) {
      console.error('Erro ao deletar produtos:', deleteError);
      return NextResponse.json({ error: 'Erro ao atualizar produtos' }, { status: 500 });
    }

    // Se há produtos para inserir
    if (products && products.length > 0) {
      // Adicionar store_id a todos os produtos
      const productsWithStoreId = products.map((product: { [key: string]: unknown }) => ({
        ...product,
        store_id: store.id
      }));

      const { error: insertError } = await supabase
        .from('products')
        .insert(productsWithStoreId);

      if (insertError) {
        console.error('Erro ao inserir produtos:', insertError);
        return NextResponse.json({ error: 'Erro ao salvar produtos' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
