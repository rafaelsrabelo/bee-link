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

export function openWhatsAppWithFallback(phoneNumber: string, message: string): void {
  if (typeof window === 'undefined') return;
  
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
  
  // Solução mais simples: sempre usar window.open() mas com fallback
  try {
    const newWindow = window.open(whatsappUrl, '_blank');
    
    // Se window.open() falhou (comum em WebViews), usar location.href
    if (!newWindow) {
      window.location.href = whatsappUrl;
    }
  } catch {
    // Fallback para qualquer erro
    window.location.href = whatsappUrl;
  }
}

