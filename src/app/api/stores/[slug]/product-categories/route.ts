import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET - Buscar categorias disponíveis + categorias personalizadas da loja
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Primeiro, buscar a loja para verificar se existe e pegar o user_id
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Para debug: vamos simular o user_id temporariamente
    // TODO: Remover após teste - GET temporariamente sem autenticação
    const { data: { user } } = await supabase.auth.getUser();
    
    // Se não tem usuário autenticado, usar o user_id da loja para debug
    const currentUserId = user?.id || store.user_id;

    // Estratégia: Buscar apenas categorias criadas pelo usuário atual
    // Vamos usar o campo 'description' para guardar metadados temporariamente
    // ou filtrar pelas categorias que estão sendo usadas pelos produtos da loja
    
    // 1. Buscar categorias usadas pelos produtos desta loja
    const { data: products } = await supabase
      .from('products')
      .select('category, category_id')
      .eq('store_id', store.id)
      .not('category', 'is', null)
      .not('category_id', 'is', null);

    const usedCategoryIds = products?.map(p => p.category_id).filter(Boolean) || [];

    // 2. Implementar isolamento por usuário usando metadados no campo 'description'
    // Estratégia: usar formato "user:{user_id}|desc:{description}" no campo description
    
    const { data: userCategories, error: userCategoriesError } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .gte('id', 21) // Categorias criadas por usuários começam do ID 21
      .order('created_at', { ascending: false });

    if (userCategoriesError) {
      console.error('Erro ao buscar categorias do usuário:', userCategoriesError);
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
    }

    // 3. Filtrar categorias criadas pelo usuário atual
    const ownedCategories = (userCategories || []).filter(cat => {
      if (!cat.description) return false;
      // Verificar se a categoria foi criada por este usuário
      return cat.description.includes(`user:${currentUserId}`);
    });

    // 4. Buscar categorias usadas pelos produtos (se existirem)
    let usedCategories = [];
    if (usedCategoryIds.length > 0) {
      const { data: usedCats, error: usedError } = await supabase
        .from('product_categories')
        .select('*')
        .in('id', usedCategoryIds)
        .eq('is_active', true);
      
      if (!usedError) {
        usedCategories = usedCats || [];
      }
    }

    // 5. Combinar categorias próprias + categorias usadas (removendo duplicatas)
    const allCategories = [...ownedCategories, ...usedCategories];
    const uniqueCategories = allCategories.filter((cat, index, self) => 
      index === self.findIndex(c => c.id === cat.id)
    );

    const storeCategories = uniqueCategories.sort((a, b) => a.sort_order - b.sort_order);

    // Não há mais categoriesError para verificar aqui

    // Converter para o formato esperado pela interface
    const categories = (storeCategories || []).map(cat => {
      // Extrair descrição limpa removendo metadados
      const cleanDescription = cat.description
        ? cat.description.replace(/^user:[^|]+\|desc:/, '')
        : '';
      
      return {
        id: cat.id,
        name: cat.name,
        description: cleanDescription,
        color: cat.color || '#8B5CF6',
        store_id: store.id, // Simulamos que é da loja
        is_active: cat.is_active,
        sort_order: cat.sort_order
      };
    });

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json([]);
  }
}

// POST - Criar nova categoria global (disponível para todas as lojas)
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const { name, description, color } = body;

    // Validar dados obrigatórios
    if (!name) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome da categoria deve ter pelo menos 2 caracteres' }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'Nome da categoria deve ter no máximo 50 caracteres' }, { status: 400 });
    }

    // Buscar a loja para autenticação
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== store.user_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Não precisamos validar nome único pois cada loja pode ter categorias com nomes iguais

    // Buscar o próximo sort_order
    const { data: categories } = await supabase
      .from('product_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = categories && categories.length > 0 ? categories[0].sort_order + 1 : 1;

    // Gerar slug único a partir do nome
    const baseSlug = name.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove múltiplos hífens
      .trim();

    // Garantir que o slug seja único adicionando timestamp se necessário
    let slug_generated = baseSlug;
    const { data: existingSlug } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', slug_generated)
      .single();

    if (existingSlug) {
      // Se já existe, adicionar timestamp para tornar único
      slug_generated = `${baseSlug}-${Date.now()}`;
    }

    // Criar nova categoria com metadados do usuário
    // Formato: "user:{user_id}|desc:{description_real}"
    const userDescription = `user:${user.id}|desc:${description?.trim() || ''}`;
    
    const { data: newCategory, error: insertError } = await supabase
      .from('product_categories')
      .insert({
        name: name.trim(),
        name_pt: name.trim(), // Mesmo nome para português
        slug: slug_generated,
        description: userDescription, // Incluir metadados do usuário
        icon: 'package', // Ícone padrão
        color: color || '#8B5CF6',
        is_active: true,
        sort_order: nextSortOrder
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir categoria:', insertError);
      
      // Retornar erro amigável sem detalhes técnicos
      if (insertError.message?.includes('duplicate key')) {
        return NextResponse.json({ 
          error: 'Esta categoria já existe. Tente um nome diferente.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Erro ao criar categoria. Tente novamente.' 
      }, { status: 500 });
    }

    // Extrair descrição limpa dos metadados
    const cleanDescription = newCategory.description
      ? newCategory.description.replace(/^user:[^|]+\|desc:/, '')
      : '';
    
    // Converter para o formato esperado
    const categoryResponse = {
      id: newCategory.id,
      name: newCategory.name,
      description: cleanDescription,
      color: newCategory.color || '#8B5CF6',
      store_id: store.id,
      is_active: newCategory.is_active,
      sort_order: newCategory.sort_order
    };

    return NextResponse.json(categoryResponse, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Editar categoria existente
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const { id, name, description, color } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 });
    }

    // Buscar a loja para autenticação
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== store.user_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Atualizar categoria mantendo metadados do usuário
    const userDescription = `user:${user.id}|desc:${description?.trim() || ''}`;
    
    const { data: updatedCategory, error: updateError } = await supabase
      .from('product_categories')
      .update({
        name: name.trim(),
        name_pt: name.trim(),
        description: userDescription, // Manter metadados do usuário
        color: color || '#8B5CF6'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar categoria:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar categoria' 
      }, { status: 500 });
    }

    // Extrair descrição limpa dos metadados
    const cleanDescription = updatedCategory.description
      ? updatedCategory.description.replace(/^user:[^|]+\|desc:/, '')
      : '';
    
    const categoryResponse = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: cleanDescription,
      color: updatedCategory.color || '#8B5CF6',
      store_id: store.id,
      is_active: updatedCategory.is_active,
      sort_order: updatedCategory.sort_order
    };

    return NextResponse.json(categoryResponse);
  } catch (error) {
    console.error('Erro ao editar categoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar categoria
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    // Buscar a loja para autenticação
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== store.user_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se categoria está sendo usada por produtos (sem filtrar por store ainda)
    const { data: productsUsingCategory, error: productsCheckError } = await supabase
      .from('products')
      .select('id, store_id, name')
      .eq('category_id', categoryId);

    if (productsCheckError) {
      return NextResponse.json({ error: 'Erro ao verificar produtos' }, { status: 500 });
    }
    
    // Filtrar apenas produtos da loja atual
    const storeProducts = productsUsingCategory?.filter(product => product.store_id === store.id) || [];

    if (storeProducts.length > 0) {
      return NextResponse.json({ 
        error: `Não é possível deletar. Esta categoria está sendo usada por ${storeProducts.length} produto(s) da sua loja.`
      }, { status: 400 });
    }

    // Deletar categoria
    const { error: deleteError } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Erro ao deletar categoria'
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}