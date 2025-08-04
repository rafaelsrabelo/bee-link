import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import CartPageClient from './cart-page-client';

interface CartPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CartPage({ params }: CartPageProps) {
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
      social_networks: store.social_networks,
      products: [] // Array vazio pois os produtos são carregados separadamente
    };

    return <CartPageClient store={formattedStore} />;
  } catch {
    notFound();
  }
} 