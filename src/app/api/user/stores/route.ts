import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando busca de lojas do usuário...');
    
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('👤 Usuário:', user ? user.id : 'Não autenticado');
    console.log('❌ Erro de auth:', authError);
    console.log('🔍 Cookie store:', cookieStore);
    console.log('🍪 Todos os cookies:', cookieStore.getAll());
    console.log('🔍 Supabase cookies:', cookieStore.getAll().filter(c => c.name.includes('supabase')));
    
    if (authError || !user) {
      console.log('🚫 Usuário não autenticado, retornando 401');
      console.log('🔍 Detalhes do erro:', authError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar lojas do usuário
    console.log('🔍 Buscando lojas para usuário:', user.id);
    
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('📊 Lojas encontradas:', stores);
    console.log('❌ Erro ao buscar lojas:', storesError);

    if (storesError) {
      console.error('Erro ao buscar lojas:', storesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar lojas',
        details: storesError.message 
      }, { status: 500 });
    }

    // IMPORTANTE: Sempre retornar array vazio se não há lojas
    // Isso evita o loop de redirecionamento
    console.log('✅ Retornando lojas:', stores || []);
    return NextResponse.json(stores || []);
  } catch (error) {
    console.error('💥 Erro interno na API:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 