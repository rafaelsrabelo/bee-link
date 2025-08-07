'use client';

import { ArrowLeft, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { StoreData } from '../../[slug]/data';

interface StoreHeaderProps {
  store: StoreData;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const router = useRouter();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: store.store_name,
          text: store.description,
          url: window.location.href,
        });
      } catch {
      }
    } else {
      // Fallback: copiar para clipboard
      await navigator.clipboard.writeText(window.location.href);
      // Usar toast aqui se disponível, senão manter alert como fallback
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).toast) {
        ((window as unknown as Record<string, unknown>).toast as { success: (msg: string) => void }).success('Link copiado para a área de transferência!');
      } else {
        alert('Link copiado para a área de transferência!');
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-primary">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Botão voltar */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-content-body hover:text-content-headline transition-colors p-2 rounded-lg hover:bg-background-tertiary"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          {/* Info da loja no header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div className="hidden sm:block">
              <h3 className="font-semibold text-content-headline">{store.store_name}</h3>
              <p className="text-xs text-content-placeholder">bee-link.beecoders.club/{store.slug}</p>
            </div>
          </div>

          {/* Botão compartilhar */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 text-content-body hover:text-content-headline transition-colors p-2 rounded-lg hover:bg-background-tertiary"
          >
            <Share2 size={20} />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
        </div>
      </div>
    </header>
  );
}