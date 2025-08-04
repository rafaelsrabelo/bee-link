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

    // Buscar o produto pelo ID
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', store.id)
      .single();

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
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
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
  } catch (error) {
    console.error('Erro ao gerar metadados:', error);
    return {
      title: 'Erro ao carregar produto',
      description: 'Ocorreu um erro ao carregar o produto.'
    };
  }
} 