'use client';

import { useEffect, useRef } from 'react';

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function IconWrapper({ children, className }: IconWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remover atributos do Dark Reader se existirem
    if (ref.current) {
      const svgs = ref.current.querySelectorAll('svg');
      svgs.forEach(svg => {
        // Remover atributos do Dark Reader que causam problemas de hidratação
        svg.removeAttribute('data-darkreader-inline-stroke');
        svg.removeAttribute('data-darkreader-inline-fill');
        
        // Remover estilos inline do Dark Reader
        const style = svg.getAttribute('style');
        if (style && style.includes('--darkreader-inline')) {
          svg.removeAttribute('style');
        }
      });
    }
  }, []);

  return (
    <div ref={ref} className={className} suppressHydrationWarning={true}>
      {children}
    </div>
  );
}