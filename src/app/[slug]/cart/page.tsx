import { notFound } from 'next/navigation';
import { stores } from '../data';
import CartPageClient from './cart-page-client';

interface CartPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CartPage({ params }: CartPageProps) {
  const { slug } = await params;
  const store = Object.values(stores).find(s => s.slug === slug);
  
  if (!store) {
    notFound();
  }

  return <CartPageClient store={store} />;
} 