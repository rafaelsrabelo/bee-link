import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET() {
  try {
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('product_images')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        error: 'Tabela product_images não existe',
        details: tableError.message
      });
    }

    // Buscar todas as imagens
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (imagesError) {
      return NextResponse.json({
        error: 'Erro ao buscar imagens',
        details: imagesError.message
      });
    }

    // Buscar produtos para verificar se há imagens associadas
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image')
      .limit(5);

    return NextResponse.json({
      tableExists: true,
      totalImages: images?.length || 0,
      images: images || [],
      sampleProducts: products || [],
      productsError: productsError?.message
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
