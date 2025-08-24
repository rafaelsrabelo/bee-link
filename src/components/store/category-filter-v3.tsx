'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  category_id?: number;
  category_data?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
  };
  description?: string;
  available?: boolean;
}

interface CategoryFilterProps {
  products: Product[];
  storeColors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  onCategoryClick?: (category: string) => void;
}

export default function CategoryFilter({ products, storeColors, onCategoryClick }: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Filtrar produtos disponíveis e extrair categorias
  const availableProducts = products.filter((p: Product) => p.available !== false);
  
  // Priorizar category_data.name se disponível, senão usar category
  const categories = [...new Set(availableProducts.map(p => {
    if (p.category_data?.name) {
      return p.category_data.name;
    }
    if (p.category) {
      return p.category;
    }
    return 'Geral';
  }))];

  // Filtrar categorias vazias
  const validCategories = categories.filter(cat => cat && cat.trim() !== '');
  const allCategories = validCategories;

  // Função para rolar até a categoria na página
  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    
    {
      const categoryElement = document.getElementById(`category-${category}`);
      if (categoryElement) {
        const offset = 100;
        const elementPosition = categoryElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }

    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  // Observar intersecção para atualizar categoria ativa automaticamente
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Encontrar a categoria mais visível
        let maxIntersection = 0;
        let mostVisibleCategory = activeCategory;

        for (const entry of entries) {
          if (entry.intersectionRatio > maxIntersection) {
            maxIntersection = entry.intersectionRatio;
            const categoryName = entry.target.getAttribute('data-category');
            if (categoryName && categoryName !== 'Todos') {
              mostVisibleCategory = categoryName;
            }
          }
        }

        // Atualizar apenas se a categoria mais visível for diferente da atual
        if (mostVisibleCategory !== activeCategory) {
          setActiveCategory(mostVisibleCategory);
        }
      },
      {
        rootMargin: '-15% 0px -70% 0px', // Ajustado para detectar melhor
        threshold: [0, 0.1, 0.5, 1.0] // Múltiplos thresholds para melhor precisão
      }
    );

    // Observar seções de categoria
    const categoryElements = document.querySelectorAll('[data-category]');
    for (const el of categoryElements) {
      observer.observe(el);
    }

    return () => {
      for (const el of categoryElements) {
        observer.unobserve(el);
      }
    };
  }, [activeCategory]); // Readicionado activeCategory para detectar mudanças

  // Centralizar categoria ativa no scroll horizontal
  const centerActiveCategory = useCallback((category: string) => {
    const container = scrollContainerRef.current;
    const categoryButton = categoryRefs.current[category];
    
    if (container && categoryButton) {
      const containerWidth = container.offsetWidth;
      const buttonWidth = categoryButton.offsetWidth;
      const buttonOffsetLeft = categoryButton.offsetLeft;
      
      const scrollPosition = buttonOffsetLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Inicializar com a primeira categoria selecionada
  useEffect(() => {
    if (validCategories.length > 0) {
      setActiveCategory(validCategories[0]);
      centerActiveCategory(validCategories[0]);
    }
  }, [validCategories, centerActiveCategory]);

  // Centralizar quando a categoria ativa mudar
  useEffect(() => {
    if (activeCategory) {
      centerActiveCategory(activeCategory);
    }
  }, [activeCategory, centerActiveCategory]);

  // Se não há categorias suficientes, não renderizar
  if (categories.length <= 1) {
    return null;
  }

  return (
    <div 
      className="sticky top-0 z-40 backdrop-blur-md border-b border-gray-200/30 shadow-sm"
      style={{ backgroundColor: `${storeColors.background}95` }}
    >
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide"
      >
        {allCategories.map((category) => {
          const isActive = activeCategory === category;
          
          return (
            <button
              key={category}
              type="button"
              ref={(el) => {
                categoryRefs.current[category] = el;
              }}
              onClick={() => scrollToCategory(category)}
              className={`
                flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive 
                  ? 'shadow-lg transform scale-105' 
                  : 'hover:shadow-md hover:transform hover:scale-102'
                }
              `}
              style={{
                backgroundColor: isActive 
                  ? storeColors.primary 
                  : 'rgba(255, 255, 255, 0.9)',
                color: isActive 
                  ? '#ffffff' 
                  : '#374151',
                border: isActive 
                  ? 'none' 
                  : `1px solid ${storeColors.primary}20`,
                boxShadow: isActive 
                  ? `0 4px 12px ${storeColors.primary}30` 
                  : '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
