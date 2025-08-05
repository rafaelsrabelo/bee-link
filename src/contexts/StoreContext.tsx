'use client';

import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  user_id: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
  };
  layout_type?: 'default' | 'banner';
  banner_image?: string;
  show_products_by_category?: boolean;
}

interface StoreContextType {
  store: Store | null;
  loading: boolean;
  currentSlug: string | null;
  setCurrentSlug: (slug: string) => void;
  loadStore: () => Promise<void>;
  updateStore: (storeData: Partial<Store>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // Wrapper para setCurrentSlug com logs
  const setCurrentSlugWithLog = (slug: string) => {
    setCurrentSlug(slug);
  };

  const loadStore = async () => {
    if (!currentSlug) {
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', currentSlug)
        .single();

      if (error) {
        setStore(null);
        return;
      }

      setStore(data);
    } catch (error) {
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const updateStore = async (storeData: Partial<Store>) => {
    if (!store) return;

    try {
      const { data, error } = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', store.id)
        .select()
        .single();

      if (error) {
        return;
      }

      setStore(data);
    } catch (error) {
    }
  };

  const value = {
    store,
    loading,
    currentSlug,
    setCurrentSlug: setCurrentSlugWithLog,
    loadStore,
    updateStore,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
} 