import { notFound } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import StorePageClient from './store-page-client';

interface StorePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  
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

    // Formatar os dados para o componente
    const formattedStore = {
      store_name: store.name,
      description: store.description,
      slug: store.slug,
      logo: store.logo,
      colors: store.colors,
      social_networks: store.social_networks
    };

    return <StorePageClient store={formattedStore} />;
  } catch (error) {
    console.error('Erro ao carregar loja:', error);
    notFound();
  }
}

// Metadados dinâmicos para SEO e compartilhamento
export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params;
  
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bee-link.vercel.app';

    return {
      title: `${store.name} - ${store.description}`,
      description: `Conheça a ${store.name}: ${store.description}. Acesse nosso catálogo e entre em contato!`,
      openGraph: {
        title: store.name,
        description: store.description,
        type: 'website',
        url: `${baseUrl}/${store.slug}`,
        siteName: 'Bee Link',
      },
      twitter: {
        card: 'summary_large_image',
        title: store.name,
        description: store.description,
      },
    };
  } catch (error) {
    return {
      title: 'Loja não encontrada',
      description: 'A loja solicitada não foi encontrada.'
    };
  }
}