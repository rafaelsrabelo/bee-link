import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { slug } = await params;
    
    // Primeiro, buscar a loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar produtos da loja com dados da categoria
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name, description, color)
      `)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    if (productsError) {
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }

    // Processar produtos para garantir compatibilidade
    const processedProducts = (products || []).map((product: { 
      id: string; 
      name: string; 
      description?: string; 
      price: number; 
      image?: string; 
      category?: { name?: string; description?: string; color?: string } | string; 
      category_id?: string;
      store_id: string;
      available?: boolean;
      created_at: string;
      [key: string]: unknown;
    }) => ({
      ...product,
      category: typeof product.category === 'object' && product.category?.name 
        ? product.category.name 
        : (typeof product.category === 'string' ? product.category : 'Geral'),
      category_data: typeof product.category === 'object' ? product.category : null
    }));

    return NextResponse.json(processedProducts);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

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

    // Deletar produtos existentes da loja
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('store_id', store.id);

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao salvar produtos' }, { status: 500 });
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
        return NextResponse.json({ error: 'Erro ao salvar produtos' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 