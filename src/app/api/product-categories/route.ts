import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name_pt');

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar categorias de produtos' }, { status: 500 });
    }

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const { name, name_pt, slug, description, icon, color } = body;

    // Validar dados obrigatórios
    if (!name || !name_pt || !slug) {
      return NextResponse.json({ error: 'Nome, nome em português e slug são obrigatórios' }, { status: 400 });
    }

    // Verificar se o slug já existe
    const { data: existingCategory } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return NextResponse.json({ error: 'Já existe uma categoria com este slug' }, { status: 400 });
    }

    // Inserir nova categoria
    const { data: newCategory, error } = await supabase
      .from('product_categories')
      .insert({
        name: name.trim(),
        name_pt: name_pt.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || '',
        icon: icon || 'package',
        color: color || '#8B5CF6',
        sort_order: 0
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
    }

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 