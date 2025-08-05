import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: layouts, error } = await supabase
      .from('store_layouts')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar layouts' }, { status: 500 });
    }

    return NextResponse.json(layouts);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 