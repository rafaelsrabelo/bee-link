/**
 * Utilitários para formatação e conversão de preços
 */

/**
 * Converte um valor em centavos para formato brasileiro (R$ X,XX)
 */
export function formatPriceFromCents(cents: number): string {
  if (cents === 0) return 'R$ 0,00';
  
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  
  return `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
}

/**
 * Converte um preço formatado (R$ X,XX) para centavos
 * Melhorada para lidar com diferentes formatos de entrada
 */
export function parsePriceToCents(priceString: string): number {
  if (!priceString) return 0;
  
  // Remove "R$ " e espaços
  let cleanPrice = priceString.replace(/[R$\s]/g, '');
  
  // Se o valor já parece estar em centavos (não tem vírgula ou ponto decimal)
  if (!cleanPrice.includes(',') && !cleanPrice.includes('.')) {
    const cents = Number.parseInt(cleanPrice);
    return Number.isNaN(cents) ? 0 : cents;
  }
  
  // Se tem vírgula e ponto, provavelmente está malformado
  if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
    // Remover tudo após o primeiro ponto decimal
    const parts = cleanPrice.split('.');
    if (parts.length > 1) {
      cleanPrice = `${parts[0]}.${parts[1]}`;
    }
  }
  
  // Substitui vírgula por ponto para conversão
  cleanPrice = cleanPrice.replace(',', '.');
  
  // Converte para número
  const price = Number.parseFloat(cleanPrice);
  
  if (Number.isNaN(price)) return 0;
  
  // Converte para centavos
  return Math.round(price * 100);
}

/**
 * Corrige valores de preço que podem estar corrompidos
 * Útil para valores que já foram convertidos incorretamente
 */
export function fixCorruptedPrice(priceValue: string | number): number {
  if (typeof priceValue === 'number') {
    // Se o valor é 500, provavelmente é R$ 5,00 em centavos
    if (priceValue === 500) {
      return 500; // Já está em centavos
    }
    // Se o valor é maior que 1000, provavelmente já está em centavos
    if (priceValue > 1000) {
      return priceValue;
    }
    // Se o valor está entre 1 e 999, provavelmente está em reais
    if (priceValue >= 1 && priceValue <= 999) {
      return Math.round(priceValue * 100);
    }
    // Para outros casos, assumir que já está em centavos
    return priceValue;
  }
  
  if (typeof priceValue === 'string') {
    // Se é string, usar parsePriceToCents
    return parsePriceToCents(priceValue);
  }
  
  return 0;
}

/**
 * Aplica máscara de preço em tempo real (para inputs)
 */
export function applyPriceMask(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (numbers === '') return '';
  
  // Converte para centavos
  const cents = Number.parseInt(numbers);
  
  // Converte para formato brasileiro
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  
  // Formata com separadores de milhares
  const formattedReais = reais.toLocaleString('pt-BR');
  
  return `R$ ${formattedReais},${centavos.toString().padStart(2, '0')}`;
}

/**
 * Remove a máscara de preço e retorna apenas números
 */
export function removePriceMask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida se um preço está no formato correto
 */
export function isValidPrice(priceString: string): boolean {
  if (!priceString) return false;
  
  const cleanPrice = priceString.replace(/[R$\s]/g, '').replace(',', '.');
  const price = Number.parseFloat(cleanPrice);
  
  return !Number.isNaN(price) && price >= 0;
}

