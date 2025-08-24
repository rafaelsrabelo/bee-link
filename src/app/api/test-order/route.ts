import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o campo display_order existe na tabela products
    const { data: productsSample, error: productsError } = await supabase
      .from('products')
      .select('id, name, display_order')
      .limit(5);

    // Verificar se o campo sort_order existe na tabela product_categories
    const { data: categoriesSample, error: categoriesError } = await supabase
      .from('product_categories')
      .select('id, name, sort_order')
      .limit(5);

    return NextResponse.json({
      products: {
        sample: productsSample,
        error: productsError?.message,
        hasDisplayOrder: productsSample && productsSample.length > 0 && 'display_order' in productsSample[0]
      },
      categories: {
        sample: categoriesSample,
        error: categoriesError?.message,
        hasSortOrder: categoriesSample && categoriesSample.length > 0 && 'sort_order' in categoriesSample[0]
      }
    });

  } catch (error) {
    console.error('Erro no teste:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
