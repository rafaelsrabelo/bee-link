'use client';

import { useEffect } from 'react';
import { 
  trackProductClick, 
  trackAddToCart, 
  trackBeginCheckout, 
  trackPurchase,
  trackPageView,
  trackCustomEvent,
  trackError,
  trackFormSubmit,
  useGTMAnalytics
} from '../../lib/gtm-analytics';

interface GTMAnalyticsExampleProps {
  storeSlug: string;
}

export default function GTMAnalyticsExample({ storeSlug }: GTMAnalyticsExampleProps) {
  const analytics = useGTMAnalytics();

  useEffect(() => {
    // Rastrear visualização da página
    trackPageView({
      title: 'Dashboard Analytics - GTM',
      url: window.location.href,
      referrer: document.referrer
    });
  }, []);

  const handleProductClick = () => {
    // Simular clique em produto
    trackProductClick({
      id: 'prod-123',
      name: 'Produto Teste GTM',
      price: 29.90,
      category: 'Eletrônicos',
      brand: 'Marca Teste'
    });

    console.log('Clique em produto rastreado via GTM');
  };

  const handleAddToCart = () => {
    // Simular adição ao carrinho
    trackAddToCart({
      id: 'prod-123',
      name: 'Produto Teste GTM',
      price: 29.90,
      category: 'Eletrônicos',
      brand: 'Marca Teste',
      quantity: 2
    });

    console.log('Produto adicionado ao carrinho via GTM');
  };

  const handleBeginCheckout = () => {
    // Simular início de checkout
    trackBeginCheckout([
      {
        id: 'prod-123',
        name: 'Produto Teste GTM',
        price: 29.90,
        category: 'Eletrônicos',
        brand: 'Marca Teste',
        quantity: 2
      },
      {
        id: 'prod-456',
        name: 'Outro Produto',
        price: 15.50,
        category: 'Acessórios',
        brand: 'Marca Teste',
        quantity: 1
      }
    ]);

    console.log('Início de checkout rastreado via GTM');
  };

  const handlePurchase = () => {
    // Simular compra
    trackPurchase({
      id: 'trans-789',
      value: 75.30,
      tax: 5.30,
      shipping: 10.00,
      currency: 'BRL',
      products: [
        {
          id: 'prod-123',
          name: 'Produto Teste GTM',
          price: 29.90,
          category: 'Eletrônicos',
          brand: 'Marca Teste',
          quantity: 2
        },
        {
          id: 'prod-456',
          name: 'Outro Produto',
          price: 15.50,
          category: 'Acessórios',
          brand: 'Marca Teste',
          quantity: 1
        }
      ]
    });

    console.log('Compra rastreada via GTM');
  };

  const handleCustomEvent = () => {
    // Evento customizado
    trackCustomEvent('custom_button_click', {
      button_name: 'test_button',
      page_section: 'analytics_demo',
      user_type: 'admin'
    });

    console.log('Evento customizado rastreado via GTM');
  };

  const handleFormSubmit = () => {
    // Simular envio de formulário
    trackFormSubmit({
      form_name: 'contact_form',
      form_id: 'contact-123',
      success: true
    });

    console.log('Formulário rastreado via GTM');
  };

  const handleError = () => {
    // Simular erro
    trackError({
      message: 'Erro de teste no GTM',
      stack: 'Error: Test error\n    at handleError',
      context: 'analytics_demo'
    });

    console.log('Erro rastreado via GTM');
  };


} 