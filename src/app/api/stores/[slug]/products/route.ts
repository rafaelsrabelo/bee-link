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

    const productData = await request.json();

    // Processar o preço de string para número
    let processedPrice = productData.price;
    if (typeof productData.price === 'string') {
      // Remove "R$ " e converte vírgula para ponto, depois converte para número
      const numericString = productData.price.replace(/[R$\s]/g, '').replace('.', '').replace(',', '.');
      processedPrice = Number.parseFloat(numericString);
      
      if (isNaN(processedPrice)) {
        return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
      }
    }

    // Criar um único produto, não deletar os existentes!
    const newProduct = {
      ...productData,
      price: processedPrice,
      store_id: store.id
    };

    // Remover o campo id se estiver presente - deixar o Supabase gerar
    delete newProduct.id;

    console.log('Dados do produto a ser inserido:', newProduct);

    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single();

    if (insertError) {
      console.error('Erro detalhado ao inserir produto:', {
        error: insertError,
        productData: newProduct,
        originalData: productData
      });
      
      // Retornar erro mais específico baseado no tipo de erro
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Produto com este nome já existe na loja' }, { status: 409 });
      } else if (insertError.code === '23503') {
        return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: 'Erro ao criar produto', 
          details: insertError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
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

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    // Processar o preço se for string
    let processedPrice = updateData.price;
    if (typeof updateData.price === 'string') {
      const numericString = updateData.price.replace(/[R$\s]/g, '').replace('.', '').replace(',', '.');
      processedPrice = Number.parseFloat(numericString);
      
      if (isNaN(processedPrice)) {
        return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
      }
    }

    const updatedProduct = {
      ...updateData,
      price: processedPrice,
      store_id: store.id
    };

    console.log('Atualizando produto:', id, updatedProduct);

    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updatedProduct)
      .eq('id', id)
      .eq('store_id', store.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar produto:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar produto', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    console.log('Deletando produto:', productId);

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', store.id);

    if (deleteError) {
      console.error('Erro ao deletar produto:', deleteError);
      return NextResponse.json({ 
        error: 'Erro ao deletar produto', 
        details: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 