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
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (productsError) {
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }

    // Processar produtos para garantir compatibilidade
    const processedProducts = (products || []).map((product: { 
      id: string | number; 
      name: string; 
      description?: string; 
      price: number; 
      image?: string; 
      category?: { name?: string; description?: string; color?: string } | string; 
      category_id?: string;
      store_id: string;
      available?: boolean;
      created_at: string;
      display_order?: number;
      [key: string]: unknown;
    }) => ({
      ...product,
      display_order: product.display_order || 0,
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
      
      if (Number.isNaN(processedPrice)) {
        return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
      }
    }

    // Gerar um ID simples baseado no timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const simpleId = `${timestamp}${randomSuffix}`;

    // Remover campos undefined para evitar problemas no Supabase
    const cleanProductData = Object.fromEntries(
      Object.entries(productData).filter(([_, value]) => value !== undefined)
    );

    // Criar um único produto, não deletar os existentes!
    const newProduct = {
      ...cleanProductData,
      id: simpleId,
      price: processedPrice,
      store_id: store.id
    };

    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single();

    if (insertError) {
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
      
      if (Number.isNaN(processedPrice)) {
        return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
      }
    }

    // Remover campos undefined para evitar problemas no Supabase
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const updatedProduct = {
      ...cleanUpdateData,
      price: processedPrice,
      store_id: store.id
    };

    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updatedProduct)
      .eq('id', id)
      .eq('store_id', store.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Erro ao atualizar produto', 
        details: updateError.message 
      }, { status: 500 });
    }

    // Salvar imagens múltiplas se fornecidas
    if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
      try {
        // Primeiro, deletar imagens existentes do produto
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', id);

        // Depois, inserir as novas imagens
        const imagesToInsert = updateData.images.map((img: {image_url?: string; url?: string; alt_text?: string; is_primary?: boolean; sort_order?: number}, index: number) => ({
          product_id: id,
          image_url: img.image_url || img.url || '',
          alt_text: img.alt_text || `${product.name} - Imagem ${index + 1}`,
          is_primary: img.is_primary || index === 0,
          sort_order: img.sort_order || index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);

        if (imagesError) {
          console.error('Erro ao salvar imagens:', imagesError);
          // Não falhar a atualização do produto se as imagens falharem
        }
      } catch (imageError) {
        console.error('Erro ao processar imagens:', imageError);
        // Não falhar a atualização do produto se as imagens falharem
      }
    }

    return NextResponse.json(product);
  } catch (error) {
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

    const { data: deletedData, error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', store.id)
      .select();

    if (deleteError) {
      console.error('❌ Erro ao deletar produto:', deleteError);
      return NextResponse.json({ 
        error: 'Erro ao deletar produto', 
        details: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedData });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 