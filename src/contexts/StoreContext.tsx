'use client';

import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Store {
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
    console.log('🔄 setCurrentSlug chamado com:', slug);
    setCurrentSlug(slug);
  };

  const loadStore = async () => {
    console.log('🔄 loadStore chamado com currentSlug:', currentSlug);
    if (!currentSlug) {
      console.log('❌ currentSlug é null, retornando');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Buscando loja no Supabase com slug:', currentSlug);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', currentSlug)
        .single();

      if (error) {
        console.error('❌ Erro ao carregar loja:', error);
        setStore(null);
        return;
      }

      console.log('✅ Loja carregada com sucesso:', data);
      setStore(data);
    } catch (error) {
      console.error('❌ Erro ao carregar loja:', error);
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
        console.error('Erro ao atualizar loja:', error);
        return;
      }

      setStore(data);
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
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