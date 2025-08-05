// Firebase Analytics Implementation
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getCrashlytics, log } from 'firebase/crashlytics';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
let analytics: any = null;
let messaging: any = null;
let crashlytics: any = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    messaging = getMessaging(app);
    crashlytics = getCrashlytics(app);
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
  }
}

// Interfaces
export interface FirebaseEvent {
  name: string;
  parameters?: Record<string, any>;
}

export interface ProductClickEvent {
  product_id: string;
  product_name: string;
  product_price?: number;
  product_category?: string;
  currency?: string;
}

export interface PageViewEvent {
  page_title: string;
  page_url: string;
  referrer?: string;
}

export interface UserProperties {
  user_type?: 'admin' | 'customer';
  store_slug?: string;
  subscription_plan?: string;
}

// Classe principal de Analytics
class FirebaseAnalytics {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Definir usuário
  setUser(userId: string, properties?: UserProperties) {
    this.userId = userId;
    
    if (analytics) {
      setUserId(analytics, userId);
      
      if (properties) {
        setUserProperties(analytics, properties);
      }
    }
  }

  // Rastrear evento customizado
  trackEvent(event: FirebaseEvent) {
    if (analytics) {
      logEvent(analytics, event.name, {
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: Date.now(),
        ...event.parameters
      });
    }
  }

  // Rastrear clique em produto
  trackProductClick(event: ProductClickEvent) {
    this.trackEvent({
      name: 'product_click',
      parameters: {
        product_id: event.product_id,
        product_name: event.product_name,
        product_price: event.product_price,
        product_category: event.product_category,
        currency: event.currency || 'BRL',
        value: event.product_price || 0
      }
    });
  }

  // Rastrear visualização de página
  trackPageView(event: PageViewEvent) {
    this.trackEvent({
      name: 'page_view',
      parameters: {
        page_title: event.page_title,
        page_url: event.page_url,
        referrer: event.referrer
      }
    });
  }

  // Rastrear adição ao carrinho
  trackAddToCart(productId: string, productName: string, price: number) {
    this.trackEvent({
      name: 'add_to_cart',
      parameters: {
        product_id: productId,
        product_name: productName,
        price: price,
        currency: 'BRL',
        value: price
      }
    });
  }

  // Rastrear início de checkout
  trackBeginCheckout(total: number, items: any[]) {
    this.trackEvent({
      name: 'begin_checkout',
      parameters: {
        value: total,
        currency: 'BRL',
        items: items,
        item_count: items.length
      }
    });
  }

  // Rastrear compra
  trackPurchase(transactionId: string, total: number, items: any[]) {
    this.trackEvent({
      name: 'purchase',
      parameters: {
        transaction_id: transactionId,
        value: total,
        currency: 'BRL',
        items: items,
        item_count: items.length
      }
    });
  }

  // Rastrear erro
  trackError(error: Error, context?: Record<string, any>) {
    if (crashlytics) {
      log(crashlytics, error);
    }

    this.trackEvent({
      name: 'app_error',
      parameters: {
        error_message: error.message,
        error_stack: error.stack,
        ...context
      }
    });
  }

  // Configurar Push Notifications
  async setupPushNotifications() {
    if (messaging && 'serviceWorker' in navigator) {
      try {
        // Solicitar permissão
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Obter token
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
          });

          // Enviar token para o servidor
          await this.sendTokenToServer(token);

          // Listener para mensagens em primeiro plano
          onMessage(messaging, (payload) => {
            console.log('Mensagem recebida:', payload);
            
            // Mostrar notificação
            if (payload.notification) {
              new Notification(payload.notification.title || 'Nova mensagem', {
                body: payload.notification.body,
                icon: payload.notification.icon
              });
            }
          });

          return token;
        }
      } catch (error) {
        console.error('Erro ao configurar push notifications:', error);
        this.trackError(error as Error, { context: 'push_notifications' });
      }
    }
  }

  // Enviar token para o servidor
  private async sendTokenToServer(token: string) {
    try {
      await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId: this.userId,
          sessionId: this.sessionId
        }),
      });
    } catch (error) {
      console.error('Erro ao enviar token:', error);
    }
  }

  // Obter session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Obter user ID
  getUserId(): string | null {
    return this.userId;
  }
}

// Instância global
let firebaseAnalyticsInstance: FirebaseAnalytics | null = null;

// Funções de conveniência
export const initializeFirebaseAnalytics = () => {
  if (typeof window !== 'undefined') {
    firebaseAnalyticsInstance = new FirebaseAnalytics();
  }
};

export const setFirebaseUser = (userId: string, properties?: UserProperties) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.setUser(userId, properties);
  }
};

export const trackFirebaseEvent = (event: FirebaseEvent) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.trackEvent(event);
  }
};

export const trackFirebaseProductClick = (event: ProductClickEvent) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.trackProductClick(event);
  }
};

export const trackFirebasePageView = (event: PageViewEvent) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.trackPageView(event);
  }
};

export const trackFirebaseAddToCart = (productId: string, productName: string, price: number) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.trackAddToCart(productId, productName, price);
  }
};

export const trackFirebaseBeginCheckout = (total: number, items: any[]) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.trackBeginCheckout(total, items);
  }
};

export const trackFirebasePurchase = (transactionId: string, total: number, items: any[]) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.trackPurchase(transactionId, total, items);
  }
};

export const trackFirebaseError = (error: Error, context?: Record<string, any>) => {
  if (firebaseAnalyticsInstance) {
    firebaseAnalyticsInstance.trackError(error, context);
  }
};

export const setupFirebasePushNotifications = async () => {
  if (firebaseAnalyticsInstance) {
    return await firebaseAnalyticsInstance.setupPushNotifications();
  }
};

export const getFirebaseSessionId = (): string => {
  return firebaseAnalyticsInstance?.getSessionId() || '';
};

export const getFirebaseUserId = (): string | null => {
  return firebaseAnalyticsInstance?.getUserId() || null;
};

// Hook para React
export const useFirebaseAnalytics = () => {
  return {
    setUser: setFirebaseUser,
    trackEvent: trackFirebaseEvent,
    trackProductClick: trackFirebaseProductClick,
    trackPageView: trackFirebasePageView,
    trackAddToCart: trackFirebaseAddToCart,
    trackBeginCheckout: trackFirebaseBeginCheckout,
    trackPurchase: trackFirebasePurchase,
    trackError: trackFirebaseError,
    setupPushNotifications: setupFirebasePushNotifications,
    getSessionId: getFirebaseSessionId,
    getUserId: getFirebaseUserId
  };
}; 