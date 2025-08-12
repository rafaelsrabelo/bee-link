import { useEffect, useState } from 'react';

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  user_id: string;
  address?: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  latitude?: number;
  longitude?: number;
  social_networks?: {
    instagram?: string;
    whatsapp?: string;
    tiktok?: string;
    spotify?: string;
    youtube?: string;
  };
  layout_settings?: {
    show_banner: boolean;
    banner_type: string;
    banner_images: string[];
    banner_height: string;
    banner_rounded: boolean;
    banner_padding: boolean;
    show_store_description: boolean;
    show_social_links: boolean;
    show_contact_info: boolean;
    products_per_row: number;
    card_layout: string;
    show_product_badges: boolean;
    show_product_description: boolean;
    show_quick_add: boolean;
    show_floating_cart: boolean;
    cart_position: string;
    category_display: string;
    show_category_icons: boolean;
  };
  print_settings?: {
    default_printer: string;
    auto_print: boolean;
    print_format: string;
    paper_width: number;
    auto_cut: boolean;
    print_logo: boolean;
    print_address: boolean;
  };
}

interface CacheEntry {
  data: Store;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const storeCache = new Map<string, CacheEntry>();

export function useStoreCache(slug: string, userId: string | undefined) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStore = async (forceRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const cacheKey = `${slug}-${userId}`;
    const cached = storeCache.get(cacheKey);

    // Verificar se há cache válido e não forçar refresh
    if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
      setStore(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stores/${slug}`);
      if (!response.ok) {
        throw new Error('Loja não encontrada');
      }

      const storeData = await response.json();

      // Verificar se o usuário é dono da loja
      if (storeData.user_id !== userId) {
        throw new Error('Você não tem permissão para acessar esta loja');
      }

      // Salvar no cache
      storeCache.set(cacheKey, {
        data: storeData,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      });

      setStore(storeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = () => {
    const cacheKey = `${slug}-${userId}`;
    storeCache.delete(cacheKey);
  };

  useEffect(() => {
    loadStore();
  }, [slug, userId]);

  return {
    store,
    loading,
    error,
    loadStore,
    invalidateCache
  };
}
