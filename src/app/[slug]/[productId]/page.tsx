import { notFound } from 'next/navigation';
import { stores } from '../data';
import ProductPageClient from './product-page-client';

interface ProductPageProps {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productId } = await params;
  const store = stores[slug as keyof typeof stores];

  // Se a loja não existir, mostra página 404
  if (!store) {
    notFound();
  }

  // Encontra o produto pelo ID (nome do produto)
  const product = store.products.find(p => 
    p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === productId
  );

  // Se o produto não existir, mostra página 404
  if (!product) {
    notFound();
  }

  return <ProductPageClient store={store} product={product} />;
}

// Metadados dinâmicos para SEO e compartilhamento
export async function generateMetadata({ params }: ProductPageProps) {
  const { slug, productId } = await params;
  const store = stores[slug as keyof typeof stores];

  if (!store) {
    return {
      title: 'Loja não encontrada',
    };
  }

  const product = store.products.find(p => 
    p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === productId
  );

  if (!product) {
    return {
      title: 'Produto não encontrado',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bee-link.vercel.app';

  return {
    title: `${product.name} - ${store.store_name}`,
    description: `${product.name} por ${product.price} da ${store.store_name}. ${store.description}`,
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
} 