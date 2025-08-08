// Sistema híbrido de analytics
// GA4 para análises avançadas + dados básicos locais para dashboard

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: unknown[];
  }
  
  function gtag(...args: unknown[]): void;
}

export interface AnalyticsConfig {
  ga4Id?: string;
  enableLocalTracking: boolean;
  enableGA4: boolean;
}

export interface ProductClickEvent {
  product_id: string;
  product_name: string;
  product_price?: number;
  category?: string;
  is_direct_link?: boolean;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface PageViewEvent {
  page_title: string;
  page_url: string;
  referrer?: string;
}

class Analytics {
  private config: AnalyticsConfig;
  private sessionId: string;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.initializeGA4();
  }

  private   generateSessionId(): string {
    // Evitar Date.now() e Math.random() para problemas de hidratação
    if (typeof window === 'undefined') {
      return 'server-session';
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeGA4() {
    if (this.config.enableGA4 && this.config.ga4Id && typeof window !== 'undefined') {
      // Carregar GA4
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.ga4Id}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', this.config.ga4Id);
    }
  }

  // Rastrear clique em produto
  async trackProductClick(event: ProductClickEvent) {
    try {
      // GA4 Tracking
      if (this.config.enableGA4 && typeof gtag !== 'undefined') {
        gtag('event', 'product_click', {
          product_id: event.product_id,
          product_name: event.product_name,
          product_price: event.product_price,
          product_category: event.category,
          currency: 'BRL',
          value: event.product_price || 0,
          is_direct_link: event.is_direct_link || false,
          referrer: event.referrer || '',
          utm_source: event.utm_source || '',
          utm_medium: event.utm_medium || '',
          utm_campaign: event.utm_campaign || ''
        });
      }

      // Local Tracking (apenas dados essenciais)
      if (this.config.enableLocalTracking) {
        await this.sendToLocalAPI({
          type: 'product_click',
          product_id: event.product_id,
          product_name: event.product_name,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
          is_direct_link: event.is_direct_link || false,
          referrer: event.referrer || '',
          utm_source: event.utm_source || '',
          utm_medium: event.utm_medium || '',
          utm_campaign: event.utm_campaign || ''
        });
      }
    } catch {
    }
  }

  // Rastrear visualização de página
  async trackPageView(event: PageViewEvent) {
    try {
      // GA4 Tracking
      if (this.config.enableGA4 && typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_title: event.page_title,
          page_url: event.page_url,
          referrer: event.referrer
        });
      }

      // Local Tracking (apenas dados essenciais)
      if (this.config.enableLocalTracking) {
        await this.sendToLocalAPI({
          type: 'page_view',
          page_url: event.page_url,
          page_title: event.page_title,
          session_id: this.sessionId,
          timestamp: new Date().toISOString()
        });
      }
    } catch {
    }
  }

  // Enviar dados para API local
  private async sendToLocalAPI(data: {
    type: string;
    product_id?: string;
    product_name?: string;
    page_url?: string;
    page_title?: string;
    session_id: string;
    timestamp: string;
    is_direct_link?: boolean;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }) {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar dados');
      }
    } catch {
    }
  }

  // Obter session ID
  getSessionId(): string {
    return this.sessionId;
  }
}

// Instância global
let analyticsInstance: Analytics | null = null;

export const initializeAnalytics = (config: AnalyticsConfig) => {
  if (typeof window !== 'undefined') {
    analyticsInstance = new Analytics(config);
  }
};

export const trackProductClick = (event: ProductClickEvent) => {
  if (analyticsInstance) {
    analyticsInstance.trackProductClick(event);
  }
};

export const trackPageView = (event: PageViewEvent) => {
  if (analyticsInstance) {
    analyticsInstance.trackPageView(event);
  }
};

export const getSessionId = (): string => {
  return analyticsInstance?.getSessionId() || '';
};

// Hook para React
export const useAnalytics = () => {
  return {
    trackProductClick,
    trackPageView,
    getSessionId
  };
}; 