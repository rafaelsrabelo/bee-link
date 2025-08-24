import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Buscar a loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // 2. Buscar produtos disponíveis da loja
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('available', true)
      .order('display_order', { ascending: true })
      .order('name');

    if (productsError) {
      console.error('Erro ao buscar produtos:', productsError);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500 }
      );
    }

    // 3. Buscar imagens dos produtos se a tabela existir
    let productsWithImages = products || [];
    try {
      const { data: productImages, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', products?.map(p => p.id) || []);

      if (!imagesError && productImages) {
        // Agrupar imagens por produto
        const imagesByProduct = productImages.reduce((acc, img) => {
          if (!acc[img.product_id]) {
            acc[img.product_id] = [];
          }
          acc[img.product_id].push(img);
          return acc;
        }, {} as Record<string, Array<{id: number; image_url: string; alt_text?: string; is_primary: boolean; sort_order: number}>>);

        // Adicionar imagens aos produtos
        productsWithImages = (products || []).map(product => ({
          ...product,
          product_images: imagesByProduct[product.id] || []
        }));
      }
    } catch (imageError) {
      console.log('Tabela product_images não encontrada ou erro ao buscar imagens:', imageError);
      // Continuar sem imagens se a tabela não existir
      productsWithImages = products || [];
    }

    // 4. Fallback: usar a imagem principal se não há imagens múltiplas
    productsWithImages = productsWithImages.map(product => {
      if (!product.product_images || product.product_images.length === 0) {
        // Criar uma imagem virtual baseada na imagem principal do produto
        return {
          ...product,
          product_images: product.image ? [{
            id: 0,
            image_url: product.image,
            alt_text: `${product.name} - Imagem principal`,
            is_primary: true,
            sort_order: 0
          }] : []
        };
      }
      return product;
    });

    // Formatar produtos mantendo os preços originais
    const formattedProducts = productsWithImages.map(product => ({
      ...product,
      price: product.price, // Manter o preço original do banco
      display_order: product.display_order || 0 // Garantir que display_order existe
    }));

    return NextResponse.json({
      products: formattedProducts
    });

  } catch (error) {
    console.error('Erro na API de produtos públicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}