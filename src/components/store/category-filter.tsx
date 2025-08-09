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
    // Se tem category_data, usar name
    if (p.category_data?.name) {
      return p.category_data.name;
    }
    // Se não tem category_data mas tem category, usar category
    if (p.category) {
      return p.category;
    }
    // Fallback para "Geral"
    return 'Geral';
  }))];

  // Filtrar categorias vazias
  const validCategories = categories.filter(cat => cat && cat.trim() !== '');
  const allCategories = validCategories;

  // Função para rolar até a categoria na página
  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    
    {
      // Rolar para a categoria específica
      const categoryElement = document.getElementById(`category-${category}`);
      if (categoryElement) {
        const offset = 100; // Offset para não ficar colado no topo
        const elementPosition = categoryElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }

    // Callback opcional
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  // Observar intersecção para atualizar categoria ativa automaticamente
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const categoryName = entry.target.getAttribute('data-category');
            // Só atualizar se não for "Todos" e for diferente da categoria atual
            if (categoryName && categoryName !== 'Todos' && categoryName !== activeCategory) {
              setActiveCategory(categoryName);
            }
          }
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px', // Detectar quando a categoria está no terço superior da tela
        threshold: 0.1
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
  }, [activeCategory]);

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

  // Inicializar com a primeira categoria selecionada quando o componente montar
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
    <div className="sticky top-0 z-40 backdrop-blur-md border-b border-white/10" 
         style={{ backgroundColor: `${storeColors.background}95` }}>
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide"
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
                flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'shadow-sm' 
                  : 'hover:shadow-sm'
                }
              `}
              style={{
                backgroundColor: isActive ? storeColors.primary : 'rgba(255, 255, 255, 0.8)',
                color: isActive ? '#ffffff' : storeColors.text,
                border: isActive ? 'none' : `1px solid ${storeColors.primary}30`
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