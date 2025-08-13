import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import ProductPageClient from './product-page-client';

interface ProductPageProps {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productId } = await params;
  
  try {
    // Buscar a store pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      notFound();
    }

    // Buscar o produto pelo ID com todos os dados
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name, description, color)
      `)
      .eq('id', productId)
      .eq('store_id', store.id)
      .single();

    // Se o produto foi encontrado, buscar cores e tamanhos específicos da loja
    let colors: Array<{
      id: string;
      name: string;
      hex_code: string;
      attribute_type: string;
      store_id: string | null;
      is_default: boolean;
      sort_order: number;
    }> = [];
    let sizes: Array<{
      id: string;
      name: string;
      attribute_type: string;
      store_id: string | null;
      is_default: boolean;
      sort_order: number;
    }> = [];
    
    if (product) {
      // Buscar cores da loja
      const { data: storeColors } = await supabase
        .from('store_attributes')
        .select('*')
        .eq('attribute_type', 'color')
        .or(`store_id.eq.${store.id},store_id.is.null`)
        .order('sort_order', { ascending: true });
      
      // Buscar tamanhos da loja
      const { data: storeSizes } = await supabase
        .from('store_attributes')
        .select('*')
        .eq('attribute_type', 'size')
        .or(`store_id.eq.${store.id},store_id.is.null`)
        .order('sort_order', { ascending: true });
        
      colors = storeColors || [];
      sizes = storeSizes || [];
      
      // Adicionar cores e tamanhos ao produto
      product.colors = colors;
      product.sizes = sizes;
      
      // Garantir que o produto tenha pelo menos uma imagem estruturada
      if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
        if (product.image) {
          product.images = [{
            id: '1',
            url: product.image,
            is_primary: true
          }];
        } else {
          product.images = [];
        }
      }
      

    }

    if (productError || !product) {
      notFound();
    }

    // Formatar os dados para o componente
    const formattedStore = {
      store_name: store.name,
      description: store.description,
      slug: store.slug,
      logo: store.logo,
      colors: store.colors,
      social_networks: store.social_networks
    };

    return <ProductPageClient store={formattedStore} product={product} />;
  } catch {
    notFound();
  }
}

// Metadados dinâmicos para SEO e compartilhamento
export async function generateMetadata({ params }: ProductPageProps) {
  const { slug, productId } = await params;
  
  try {
    // Buscar a store pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return {
        title: 'Loja não encontrada',
        description: 'A loja solicitada não foi encontrada.'
      };
    }

    // Buscar o produto no Supabase
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', store.id)
      .single();

    if (productError || !product) {
      return {
        title: 'Produto não encontrado',
        description: 'O produto solicitado não foi encontrado.'
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bee-link.vercel.app';

    return {
      title: `${product.name} - ${store.name}`,
      description: `${product.name} por ${product.price} da ${store.name}. ${store.description}`,
      openGraph: {
        title: product.name,
        description: `${product.name} por ${product.price}`,
        type: 'website',
        url: `${baseUrl}/${store.slug}/${productId}`,
        siteName: 'Bee Link',
        images: [
          {
            url: product.image,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: `${product.name} por ${product.price}`,
        images: [product.image],
      },
    };
  } catch {
    return {
      title: 'Erro ao carregar produto',
      description: 'Ocorreu um erro ao carregar o produto.'
    };
  }
} 