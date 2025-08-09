import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { slug } = await params;
    
    const { data: store, error } = await supabase
      .from('stores')
      .select(`
        *,
        category:store_categories(id, name, slug, description, icon, color)
      `)
      .eq('slug', slug)
      .single();

    if (error || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { slug } = await params;
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      store_type, 
      description, 
      logo, 
      colors, 
      address, 
      social_networks, 
      category_id, 
      layout_type, 
      banner_image, 
      show_products_by_category,
      layout_settings
    } = body;
    // Validações
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome da loja é obrigatório' }, { status: 400 });
    }

    if (!social_networks?.whatsapp?.trim()) {
      return NextResponse.json({ error: 'WhatsApp é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário é dono da loja
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('user_id')
      .eq('slug', slug)
      .single();

    if (checkError || !existingStore) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    if (existingStore.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Debug: Log dos layout_settings recebidos
    console.log('Layout Settings recebidos:', layout_settings);
    console.log('Card Layout:', layout_settings?.card_layout);

    // Preparar dados para atualização
    const updateData = {
      name: name.trim(),
      store_type: store_type || 'ecommerce',
      description: description?.trim() || '',
      logo: logo || '',
      category_id: category_id || null,
      layout_type: layout_type || 'default',
      banner_image: banner_image || null,
      show_products_by_category: show_products_by_category || false,
      colors: colors || {
        text: "#1A202C",
        header: "#3b7af7",
        primary: "#3b7af7",
        background: "#F0F9FF"
      },
      address: address || null,
      social_networks: social_networks || {},
      layout_settings: layout_settings || {
        // Configurações padrão
        show_banner: false,
        banner_type: 'single',
        banner_images: [],
        banner_height: 'medium',
        banner_rounded: false,
        banner_padding: false,
        show_store_description: true,
        show_social_links: true,
        show_contact_info: true,
        products_per_row: 3,
        card_layout: 'grid',
        show_product_badges: true,
        show_quick_add: true,
        show_floating_cart: true,
        cart_position: 'bottom-right',
        category_display: 'filters',
        show_category_icons: true
      },
      updated_at: new Date().toISOString()
    };

    // Atualizar a loja
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar loja:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar loja',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 