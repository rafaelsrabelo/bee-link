import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar cores e tamanhos da loja (incluindo os padrão)
    const { data: colors, error: colorsError } = await supabase
      .from('store_attributes')
      .select('*')
      .eq('attribute_type', 'color')
      .or(`store_id.eq.${store.id},store_id.is.null`)
      .order('sort_order', { ascending: true });

    const { data: sizes, error: sizesError } = await supabase
      .from('store_attributes')
      .select('*')
      .eq('attribute_type', 'size')
      .or(`store_id.eq.${store.id},store_id.is.null`)
      .order('sort_order', { ascending: true });

    if (colorsError || sizesError) {
      console.error('Erro ao buscar atributos:', { colorsError, sizesError });
      return NextResponse.json({ error: 'Erro ao buscar atributos' }, { status: 500 });
    }

    return NextResponse.json({
      colors: colors || [],
      sizes: sizes || []
    });

  } catch (error) {
    console.error('Erro na API de atributos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { action, type, name, value, hex_code, id } = body;

    // Se for uma ação de edição
    if (action === 'edit' && id) {
      return await handleEditAttribute(supabase, store.id, body);
    }

    // Se for uma ação de exclusão
    if (action === 'delete' && id) {
      return await handleDeleteAttribute(supabase, store.id, body);
    }

    // Validações para criação
    if (!type || !['color', 'size'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de atributo inválido' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    if (type === 'color' && (!hex_code || !/^#[0-9A-F]{6}$/i.test(hex_code))) {
      return NextResponse.json({ error: 'Código hexadecimal inválido' }, { status: 400 });
    }

    if (type === 'size' && (!value || !value.trim())) {
      return NextResponse.json({ error: 'Valor do tamanho é obrigatório' }, { status: 400 });
    }

    // Verificar se já existe
    const { data: existing, error: checkError } = await supabase
      .from('store_attributes')
      .select('id')
      .eq('store_id', store.id)
      .eq('attribute_type', type)
      .eq('name', name.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar atributo existente:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar atributo' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: `${type === 'color' ? 'Cor' : 'Tamanho'} já existe` }, { status: 400 });
    }

    // Buscar o maior sort_order para o tipo
    const { data: maxOrder, error: maxOrderError } = await supabase
      .from('store_attributes')
      .select('sort_order')
      .eq('attribute_type', type)
      .or(`store_id.eq.${store.id},store_id.is.null`)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxOrder?.sort_order || 0) + 1;

    // Inserir novo atributo
    const newAttribute = {
      store_id: store.id,
      attribute_type: type,
      name: name.trim(),
      value: type === 'color' ? name.trim() : value.trim(),
      hex_code: type === 'color' ? hex_code : null,
      sort_order: nextSortOrder
    };

    const { data: inserted, error: insertError } = await supabase
      .from('store_attributes')
      .insert(newAttribute)
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir atributo:', insertError);
      return NextResponse.json({ error: 'Erro ao adicionar atributo' }, { status: 500 });
    }

    return NextResponse.json(inserted);

  } catch (error) {
    console.error('Erro na API de atributos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function handleEditAttribute(supabase: any, storeId: string, body: any) {
  const { id, type, name, value, hex_code } = body;

  // Validações
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  if (type === 'color' && (!hex_code || !/^#[0-9A-F]{6}$/i.test(hex_code))) {
    return NextResponse.json({ error: 'Código hexadecimal inválido' }, { status: 400 });
  }

  if (type === 'size' && (!value || !value.trim())) {
    return NextResponse.json({ error: 'Valor do tamanho é obrigatório' }, { status: 400 });
  }

  // Verificar se o atributo existe (pode ser padrão ou da loja)
  const { data: existing, error: checkError } = await supabase
    .from('store_attributes')
    .select('id, is_default, store_id')
    .eq('id', id)
    .or(`store_id.eq.${storeId},store_id.is.null`)
    .single();

  if (checkError || !existing) {
    return NextResponse.json({ error: 'Atributo não encontrado' }, { status: 404 });
  }

  // Atualizar atributo
  const updateData = {
    name: name.trim(),
    value: type === 'color' ? name.trim() : value.trim(),
    hex_code: type === 'color' ? hex_code : null,
    updated_at: new Date().toISOString()
  };

  const { data: updated, error: updateError } = await supabase
    .from('store_attributes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Erro ao atualizar atributo:', updateError);
    return NextResponse.json({ error: 'Erro ao atualizar atributo' }, { status: 500 });
  }

  return NextResponse.json(updated);
}

async function handleDeleteAttribute(supabase: any, storeId: string, body: any) {
  const { id } = body;

  // Verificar se o atributo existe (pode ser padrão ou da loja)
  const { data: existing, error: checkError } = await supabase
    .from('store_attributes')
    .select('id, is_default, store_id')
    .eq('id', id)
    .or(`store_id.eq.${storeId},store_id.is.null`)
    .single();

  if (checkError || !existing) {
    return NextResponse.json({ error: 'Atributo não encontrado' }, { status: 404 });
  }

  // Deletar atributo
  const { error: deleteError } = await supabase
    .from('store_attributes')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Erro ao deletar atributo:', deleteError);
    return NextResponse.json({ error: 'Erro ao deletar atributo' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
