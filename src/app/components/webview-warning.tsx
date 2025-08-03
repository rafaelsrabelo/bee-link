"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useWebViewDetection } from "../hooks/useWebViewDetection";

interface WebViewWarningProps {
  storeColors: {
    primary: string;
    secondary: string;
  };
}

export default function WebViewWarning({ storeColors }: WebViewWarningProps) {
  const { showWebViewWarning } = useWebViewDetection();
  const [isVisible, setIsVisible] = useState(true);

  if (!showWebViewWarning || !isVisible) {
    return null;
  }

  const openInBrowser = () => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium">Melhor experiência no navegador</div>
            <div className="text-xs opacity-90">Abra no navegador para uma navegação mais suave</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openInBrowser}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-white/70 hover:text-white px-2 py-1 rounded-full text-xs transition-all"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
} 