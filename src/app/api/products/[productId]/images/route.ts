import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import type { ProductImage } from '../../../../../types/product-image';

// GET - Buscar todas as imagens de um produto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    // Buscar imagens do produto
    const { data: images, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar imagens:', error);
      return NextResponse.json({
        error: 'Erro ao buscar imagens',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      images: images || []
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Adicionar nova imagem ao produto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body = await request.json();

    const { image_url, alt_text, is_primary = false } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Buscar o próximo sort_order
    const { data: lastImage } = await supabase
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = lastImage ? lastImage.sort_order + 1 : 0;

    // Se é para ser primária, desmarcar outras como primárias
    if (is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }

    // Inserir nova imagem
    const { data: newImage, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url,
        alt_text,
        is_primary,
        sort_order: nextSortOrder
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir imagem:', insertError);
      return NextResponse.json(
        { error: 'Erro ao adicionar imagem' },
        { status: 500 }
      );
    }

    // Se é a primeira imagem, atualizar a coluna 'image' do produto para compatibilidade
    const { data: imageCount } = await supabase
      .from('product_images')
      .select('id', { count: 'exact' })
      .eq('product_id', productId);

    if (imageCount?.length === 1 || is_primary) {
      await supabase
        .from('products')
        .update({ image: image_url })
        .eq('id', productId);
    }

    return NextResponse.json({ 
      success: true, 
      image: newImage 
    });

  } catch (error) {
    console.error('Erro na API de imagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar múltiplas imagens (reorder, update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body = await request.json();

    const { images } = body;

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Formato inválido: esperado array de imagens' },
        { status: 400 }
      );
    }

    // Atualizar cada imagem
    for (const image of images) {
      const { id, alt_text, is_primary, sort_order } = image;

      if (!id) continue;

      await supabase
        .from('product_images')
        .update({
          alt_text,
          is_primary,
          sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('product_id', productId); // Segurança extra
    }

    // Atualizar a imagem principal do produto
    const primaryImage = images.find(img => img.is_primary);
    if (primaryImage) {
      await supabase
        .from('products')
        .update({ image: primaryImage.image_url })
        .eq('id', productId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro na API de imagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover imagem específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'ID da imagem é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a imagem antes de deletar
    const { data: imageToDelete, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single();

    if (fetchError || !imageToDelete) {
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      );
    }

    // Deletar a imagem
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Erro ao deletar imagem:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao remover imagem' },
        { status: 500 }
      );
    }

    // Se era a imagem primária, definir a primeira restante como primária
    if (imageToDelete.is_primary) {
      const { data: remainingImages } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (remainingImages && remainingImages.length > 0) {
        const newPrimary = remainingImages[0];
        
        await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', newPrimary.id);

        // Atualizar a coluna image do produto
        await supabase
          .from('products')
          .update({ image: newPrimary.image_url })
          .eq('id', productId);
      } else {
        // Se não há mais imagens, limpar a coluna image do produto
        await supabase
          .from('products')
          .update({ image: '' })
          .eq('id', productId);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro na API de imagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
