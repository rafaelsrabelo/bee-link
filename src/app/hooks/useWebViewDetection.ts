import { useEffect, useState } from 'react';
import { isInstagramWebView, isMobileWebView } from '../lib/utils';

export function useWebViewDetection() {
  const [isInWebView, setIsInWebView] = useState(false);
  const [isInstagram, setIsInstagram] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWebView = () => {
      if (typeof window === 'undefined') return;
      
      const inWebView = isMobileWebView();
      const inInstagram = isInstagramWebView();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent.toLowerCase()
      );

      setIsInWebView(inWebView);
      setIsInstagram(inInstagram);
      setIsMobile(isMobileDevice);
    };

    checkWebView();

    // Re-verificar quando a orientação da tela mudar (comum em WebViews)
    if (typeof window !== 'undefined') {
      window.addEventListener('orientationchange', checkWebView);
      window.addEventListener('resize', checkWebView);

      return () => {
        window.removeEventListener('orientationchange', checkWebView);
        window.removeEventListener('resize', checkWebView);
      };
    }
  }, []);

  return {
    isInWebView,
    isInstagram,
    isMobile,
    showWebViewWarning: isInWebView && isInstagram
  };
} 