'use client';

import { useEffect } from 'react';
import { 
  initializeFirebaseAnalytics, 
  setFirebaseUser, 
  trackFirebaseProductClick, 
  trackFirebasePageView,
  trackFirebaseAddToCart,
  setupFirebasePushNotifications,
  useFirebaseAnalytics
} from '../../lib/firebase-analytics';

interface FirebaseAnalyticsExampleProps {
  storeSlug: string;
  userId?: string;
}

export default function FirebaseAnalyticsExample({ storeSlug, userId }: FirebaseAnalyticsExampleProps) {
  const analytics = useFirebaseAnalytics();

  useEffect(() => {
    // Inicializar Firebase Analytics
    initializeFirebaseAnalytics();

    // Definir usuário se disponível
    if (userId) {
      setFirebaseUser(userId, {
        user_type: 'admin',
        store_slug: storeSlug
      });
    }

    // Rastrear visualização da página
    trackFirebasePageView({
      page_title: 'Dashboard Analytics',
      page_url: window.location.href,
      referrer: document.referrer
    });

    // Configurar push notifications
    setupPushNotifications();
  }, [userId, storeSlug]);

  const setupPushNotifications = async () => {
    try {
      const token = await setupFirebasePushNotifications();
      if (token) {
        console.log('Push notifications configuradas:', token);
      }
    } catch (error) {
      console.error('Erro ao configurar push notifications:', error);
    }
  };

  const handleProductClick = (productId: string, productName: string, price: number) => {
    // Rastrear clique em produto
    trackFirebaseProductClick({
      product_id: productId,
      product_name: productName,
      product_price: price,
      currency: 'BRL'
    });

    console.log('Clique em produto rastreado:', productName);
  };

  const handleAddToCart = (productId: string, productName: string, price: number) => {
    // Rastrear adição ao carrinho
    trackFirebaseAddToCart(productId, productName, price);

    console.log('Produto adicionado ao carrinho:', productName);
  };

  const handleCustomEvent = () => {
    // Rastrear evento customizado
    analytics.trackEvent({
      name: 'custom_button_click',
      parameters: {
        button_name: 'test_button',
        page_section: 'analytics_demo'
      }
    });

    console.log('Evento customizado rastreado');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔥 Firebase Analytics - Demonstração
      </h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Status do Firebase</h4>
          <p className="text-sm text-blue-700">
            ✅ Analytics inicializado
            {userId && <span> | 👤 Usuário: {userId}</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simular clique em produto */}
          <button
            onClick={() => handleProductClick('prod-123', 'Produto Teste', 29.90)}
            className="p-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium text-green-900">Clique em Produto</div>
            <div className="text-xs text-green-700">Rastreia visualização de produto</div>
          </button>

          {/* Simular adição ao carrinho */}
          <button
            onClick={() => handleAddToCart('prod-123', 'Produto Teste', 29.90)}
            className="p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium text-purple-900">Adicionar ao Carrinho</div>
            <div className="text-xs text-purple-700">Rastreia adição ao carrinho</div>
          </button>

          {/* Evento customizado */}
          <button
            onClick={handleCustomEvent}
            className="p-3 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium text-orange-900">Evento Customizado</div>
            <div className="text-xs text-orange-700">Rastreia evento personalizado</div>
          </button>

          {/* Configurar push notifications */}
          <button
            onClick={setupPushNotifications}
            className="p-3 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium text-red-900">Push Notifications</div>
            <div className="text-xs text-red-700">Configurar notificações</div>
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">📊 O que está sendo rastreado:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Visualizações de página</li>
            <li>• Cliques em produtos</li>
            <li>• Adições ao carrinho</li>
            <li>• Eventos customizados</li>
            <li>• Erros da aplicação</li>
            <li>• Push notifications</li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">🔍 Como verificar:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener" className="underline">Console do Firebase</a></li>
            <li>2. Vá em "Analytics" no menu lateral</li>
            <li>3. Clique nos botões acima para gerar eventos</li>
            <li>4. Os dados aparecem em tempo real (pode demorar alguns minutos)</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 