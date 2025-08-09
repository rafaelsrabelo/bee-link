import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar preço em Real brasileiro
export function formatPrice(price: number | string): string {
  if (typeof price === 'string') {
    // Se já está formatado como "R$ X,XX", retorna como está
    if (price.includes('R$')) {
      return price;
    }
    // Se é string numérica, converte para número
    const numericPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(numericPrice)) {
      return 'R$ 0,00';
    }
    price = numericPrice;
  }
  
  // Formatar número como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}
