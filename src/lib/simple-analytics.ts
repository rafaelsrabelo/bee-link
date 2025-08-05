// Utilitário simples para tracking de analytics

export const trackEvent = async (eventData: {
  event_type: 'page_view' | 'product_click' | 'add_to_cart' | 'header_cart_click';
  store_slug: string;
  product_id?: string;
  product_name?: string;
  product_price?: number;
}) => {
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      console.error('Erro ao registrar evento:', response.statusText);
    }
  } catch (error) {
    console.error('Erro ao enviar evento de analytics:', error);
  }
};

export const trackPageView = (storeSlug: string) => {
  trackEvent({
    event_type: 'page_view',
    store_slug: storeSlug,
  });
};

export const trackProductClick = (storeSlug: string, product: {
  id: string;
  name: string;
  price: string;
}) => {
  const price = parseFloat(product.price.replace('R$', '').replace(',', '.').trim());
  
  trackEvent({
    event_type: 'product_click',
    store_slug: storeSlug,
    product_id: product.id,
    product_name: product.name,
    product_price: price,
  });
};

export const trackAddToCart = (storeSlug: string, product: {
  id: string;
  name: string;
  price: string;
}) => {
  const price = parseFloat(product.price.replace('R$', '').replace(',', '.').trim());
  
  trackEvent({
    event_type: 'add_to_cart',
    store_slug: storeSlug,
    product_id: product.id,
    product_name: product.name,
    product_price: price,
  });
}; 