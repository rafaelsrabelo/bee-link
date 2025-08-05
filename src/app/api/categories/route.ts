import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: categories, error } = await supabase
      .from('store_categories')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
    }

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 