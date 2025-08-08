'use client';

import { useEffect } from 'react';
import { initializeAnalytics } from '../../lib/analytics';

export default function AnalyticsInitializer() {
  useEffect(() => {
    // Inicializar analytics com configuração básica
    initializeAnalytics({
      enableLocalTracking: true,
      enableGA4: false, // Desabilitado por enquanto
      ga4Id: undefined
    });
  }, []);

  return null; // Componente não renderiza nada
}
