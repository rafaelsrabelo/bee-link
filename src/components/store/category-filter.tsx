'use client';

import { useEffect, useRef, useState } from 'react';

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
  description: string;
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
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
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

  // Filtrar categorias vazias e adicionar "Todos" como primeira opção
  const validCategories = categories.filter(cat => cat && cat.trim() !== '');
  const allCategories = ['Todos', ...validCategories];

  // Função para rolar até a categoria na página
  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    
    if (category === 'Todos') {
      // Rolar para o topo da seção de produtos
      const productsSection = document.getElementById('products-section');
      if (productsSection) {
        productsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    } else {
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

  // Inicializar com "Todos" selecionado quando o componente montar
  useEffect(() => {
    // Sempre começar com "Todos" selecionado
    setActiveCategory('Todos');
    centerActiveCategory('Todos');
  }, []);

  // Centralizar categoria ativa no scroll horizontal
  const centerActiveCategory = (category: string) => {
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
  };

  // Centralizar quando a categoria ativa mudar
  useEffect(() => {
    if (activeCategory) {
      centerActiveCategory(activeCategory);
    }
  }, [activeCategory]);

  // Se não há categorias suficientes, não renderizar
  if (categories.length <= 1) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 backdrop-blur-md border-b border-white/10" 
         style={{ backgroundColor: `${storeColors.background}95` }}>
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
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
                flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'shadow-lg transform scale-105' 
                  : 'hover:scale-105 hover:shadow-md'
                }
              `}
              style={{
                backgroundColor: isActive ? storeColors.primary : 'rgba(255, 255, 255, 0.1)',
                color: isActive ? '#ffffff' : storeColors.text,
                border: isActive ? 'none' : `1px solid ${storeColors.primary}40`
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