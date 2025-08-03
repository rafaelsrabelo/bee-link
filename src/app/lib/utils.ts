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
  
  // Abrir WhatsApp
  window.open(whatsappUrl, '_blank');
  
  // Aguardar um pouco e redirecionar para a página principal
  // Isso garante que o usuário sempre retorne para a loja
  setTimeout(() => {
    window.location.href = fallbackUrl;
  }, 2000);
}

export function saveNavigationState(storeSlug: string, productId?: string): void {
  if (typeof window === 'undefined') return;
  
  const state = {
    storeSlug,
    productId,
    timestamp: Date.now(),
    returnUrl: window.location.href
  };
  
  localStorage.setItem('bee-link-navigation-state', JSON.stringify(state));
}

export function getNavigationState(): { storeSlug: string; productId?: string; returnUrl: string } | null {
  if (typeof window === 'undefined') return null;
  
  const state = localStorage.getItem('bee-link-navigation-state');
  if (!state) return null;
  
  try {
    const parsed = JSON.parse(state);
    // Verificar se o estado não é muito antigo (mais de 1 hora)
    if (Date.now() - parsed.timestamp > 3600000) {
      localStorage.removeItem('bee-link-navigation-state');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearNavigationState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bee-link-navigation-state');
}