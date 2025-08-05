// Google Tag Manager Analytics Utility

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Inicializar dataLayer
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Função para enviar eventos para GTM
export const pushToDataLayer = (event: any) => {
  if (typeof window !== 'undefined') {
    window.dataLayer.push(event);
  }
};

// Função para enviar eventos de e-commerce
export const trackGTMEvent = (eventName: string, parameters: any = {}) => {
  pushToDataLayer({
    event: eventName,
    ...parameters
  });
};

// Eventos específicos de e-commerce
export const trackProductClick = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
}) => {
  trackGTMEvent('product_click', {
    ecommerce: {
      currency: 'BRL',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand,
        quantity: 1
      }]
    }
  });
};

export const trackAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  quantity?: number;
}) => {
  trackGTMEvent('add_to_cart', {
    ecommerce: {
      currency: 'BRL',
      value: product.price * (product.quantity || 1),
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand,
        quantity: product.quantity || 1
      }]
    }
  });
};

export const trackBeginCheckout = (products: Array<{
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  quantity: number;
}>) => {
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  
  trackGTMEvent('begin_checkout', {
    ecommerce: {
      currency: 'BRL',
      value: totalValue,
      items: products.map(product => ({
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand,
        quantity: product.quantity
      }))
    }
  });
};

export const trackPurchase = (transaction: {
  id: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
    brand?: string;
    quantity: number;
  }>;
}) => {
  trackGTMEvent('purchase', {
    ecommerce: {
      transaction_id: transaction.id,
      value: transaction.value,
      tax: transaction.tax,
      shipping: transaction.shipping,
      currency: transaction.currency || 'BRL',
      items: transaction.products.map(product => ({
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand,
        quantity: product.quantity
      }))
    }
  });
};

// Eventos de página
export const trackPageView = (pageData: {
  title: string;
  url: string;
  referrer?: string;
}) => {
  trackGTMEvent('page_view', {
    page_title: pageData.title,
    page_location: pageData.url,
    page_referrer: pageData.referrer
  });
};

// Eventos customizados
export const trackCustomEvent = (eventName: string, parameters: any = {}) => {
  trackGTMEvent(eventName, parameters);
};

// Eventos de erro
export const trackError = (error: {
  message: string;
  stack?: string;
  context?: string;
}) => {
  trackGTMEvent('app_error', {
    error_message: error.message,
    error_stack: error.stack,
    error_context: error.context
  });
};

// Eventos de formulário
export const trackFormSubmit = (formData: {
  form_name: string;
  form_id?: string;
  success: boolean;
}) => {
  trackGTMEvent('form_submit', {
    form_name: formData.form_name,
    form_id: formData.form_id,
    form_success: formData.success
  });
};

// Eventos de scroll
export const trackScroll = (scrollDepth: number) => {
  trackGTMEvent('scroll', {
    scroll_depth: scrollDepth
  });
};

// Eventos de tempo na página
export const trackTimeOnPage = (timeInSeconds: number) => {
  trackGTMEvent('time_on_page', {
    time_in_seconds: timeInSeconds
  });
};

// Hook para React
export const useGTMAnalytics = () => {
  return {
    trackProductClick,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    trackPageView,
    trackCustomEvent,
    trackError,
    trackFormSubmit,
    trackScroll,
    trackTimeOnPage,
    pushToDataLayer
  };
};

// Função para limpar ecommerce dataLayer
export const clearEcommerceDataLayer = () => {
  if (typeof window !== 'undefined') {
    window.dataLayer.push({ ecommerce: null });
  }
}; 