import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitários para detectar WebViews e gerenciar navegação
export function isInstagramWebView(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isInstagram = userAgent.includes('instagram');
  const isInApp = userAgent.includes('instagram') || userAgent.includes('fbav') || userAgent.includes('fban');
  
  return isInstagram || isInApp;
}

export function isMobileWebView(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isInApp = userAgent.includes('instagram') || userAgent.includes('fbav') || userAgent.includes('fban') || userAgent.includes('wv');
  
  return isMobile && isInApp;
}

export function openWhatsAppWithFallback(phoneNumber: string, message: string, fallbackUrl: string): void {
  if (typeof window === 'undefined') return;
  
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
  
  // Marcar que estamos abrindo WhatsApp
  localStorage.setItem('bee-link-whatsapp-opened', Date.now().toString());
  
  // Abrir WhatsApp
  window.open(whatsappUrl, '_blank');
  
  // Detectar quando a página volta a ficar visível (retorno do WhatsApp)
  let hidden = false;
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      hidden = true;
    } else if (hidden) {
      // Página voltou a ficar visível
      hidden = false;
      
      // Verificar se foi retorno do WhatsApp
      const whatsappOpened = localStorage.getItem('bee-link-whatsapp-opened');
      if (whatsappOpened) {
        const timeSinceWhatsApp = Date.now() - Number.parseInt(whatsappOpened);
        
        // Se foi há menos de 30 segundos, provavelmente retornou do WhatsApp
        if (timeSinceWhatsApp < 30000) {
          // Limpar o carrinho e mostrar confirmação
          localStorage.removeItem('cart');
          localStorage.removeItem('cart-store-slug');
          localStorage.removeItem('bee-link-whatsapp-opened');
          
          // Adicionar parâmetro para mostrar confirmação
          const url = new URL(window.location.href);
          url.searchParams.set('orderSent', 'true');
          window.history.replaceState({}, '', url.toString());
          
          // Recarregar para mostrar a confirmação
          window.location.reload();
        }
      }
    }
  };
  
  // Adicionar listener para mudanças de visibilidade
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Remover listener após 30 segundos
  setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    localStorage.removeItem('bee-link-whatsapp-opened');
  }, 30000);
}

