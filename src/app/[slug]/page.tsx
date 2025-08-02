import { notFound } from 'next/navigation';
import { type StoreData, stores } from './data';
import StorePageClient from './store-page-client';

interface StorePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = stores[slug as keyof typeof stores];

  // Se a loja não existir, mostra página 404
  if (!store) {
    notFound();
  }

  return <StorePageClient store={store} />;
}

// Metadados dinâmicos para SEO e compartilhamento
export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params;
  const store = stores[slug as keyof typeof stores];

  if (!store) {
    return {
      title: 'Loja não encontrada',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bee-link.vercel.app';

  return {
    title: `${store.store_name} - ${store.description}`,
    description: `Conheça a ${store.store_name}: ${store.description}. Acesse nosso catálogo e entre em contato!`,
    openGraph: {
      title: store.store_name,
      description: store.description,
      type: 'website',
      url: `${baseUrl}/${store.slug}`,
      siteName: 'Bee Link',
    },
    twitter: {
      card: 'summary_large_image',
      title: store.store_name,
      description: store.description,
    },
  };
}