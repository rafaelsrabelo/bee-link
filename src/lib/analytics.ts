// Sistema híbrido de analytics
// GA4 para análises avançadas + dados básicos locais para dashboard

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

  private generateSessionId(): string {
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
      function gtag(...args: any[]) {
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
          value: event.product_price || 0
        });
      }

      // Local Tracking (apenas dados essenciais)
      if (this.config.enableLocalTracking) {
        await this.sendToLocalAPI({
          type: 'product_click',
          product_id: event.product_id,
          product_name: event.product_name,
          session_id: this.sessionId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao rastrear clique:', error);
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
    } catch (error) {
      console.error('Erro ao rastrear visualização:', error);
    }
  }

  // Enviar dados para API local
  private async sendToLocalAPI(data: any) {
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
    } catch (error) {
      console.error('Erro ao enviar dados locais:', error);
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