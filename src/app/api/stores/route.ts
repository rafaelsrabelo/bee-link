import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { store_name, slug, logo, colors, description } = body;


    // Validações
    if (!store_name || !slug) {
      return NextResponse.json({ error: 'Nome da loja e slug são obrigatórios' }, { status: 400 });
    }

    // Verificar se o slug já existe
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();


    if (existingStore) {
      return NextResponse.json({ error: 'Esta URL já está em uso. Escolha outra.' }, { status: 400 });
    }

                 // Criar a loja
             const { data: store, error: storeError } = await supabase
               .from('stores')
               .insert({
                 name: store_name, // Corrigido: store_name -> name
                 slug,
                 logo: logo || '',
                 colors: colors || {
                   primary: '#8B5CF6',
                   secondary: '#7C3AED',
                   accent: '#A855F7'
                 },
                 description: description || '',
                 user_id: user.id
               })
               .select()
               .single();


    if (storeError) {
      return NextResponse.json({ 
        error: 'Erro ao criar loja',
        details: storeError.message 
      }, { status: 500 });
    }

    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 