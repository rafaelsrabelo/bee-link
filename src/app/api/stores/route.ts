import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando criação de loja...');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('👤 Usuário:', user ? user.id : 'Não autenticado');
    console.log('❌ Erro de auth:', authError);
    
    if (authError || !user) {
      console.log('🚫 Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { store_name, slug, logo, colors, description } = body;

    console.log('📝 Dados recebidos:', { store_name, slug, colors, description });

    // Validações
    if (!store_name || !slug) {
      console.log('❌ Validação falhou: nome ou slug faltando');
      return NextResponse.json({ error: 'Nome da loja e slug são obrigatórios' }, { status: 400 });
    }

    // Verificar se o slug já existe
    console.log('🔍 Verificando se slug já existe:', slug);
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    console.log('📊 Loja existente:', existingStore);
    console.log('❌ Erro ao verificar:', checkError);

    if (existingStore) {
      console.log('❌ Slug já existe');
      return NextResponse.json({ error: 'Esta URL já está em uso. Escolha outra.' }, { status: 400 });
    }

                 // Criar a loja
             console.log('🚀 Criando loja...');
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

    console.log('📊 Loja criada:', store);
    console.log('❌ Erro ao criar:', storeError);

    if (storeError) {
      console.error('Erro ao criar loja:', storeError);
      return NextResponse.json({ 
        error: 'Erro ao criar loja',
        details: storeError.message 
      }, { status: 500 });
    }

    console.log('✅ Loja criada com sucesso!');
    return NextResponse.json(store);
  } catch (error) {
    console.error('💥 Erro interno:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 