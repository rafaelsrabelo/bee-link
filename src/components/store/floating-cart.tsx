'use client';

import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

interface FloatingCartProps {
  items: CartItem[];
  totalItems: number;
  totalValue: number;
  storeColors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  onOpenCart?: () => void;
  onCheckout?: () => void;
  onAddItem?: (itemName: string, selectedColor?: string | null, selectedSize?: string | null) => void;
  onRemoveItem?: (itemName: string, selectedColor?: string | null, selectedSize?: string | null) => void;
  isCheckingOut?: boolean;
}

export default function FloatingCart({
  items,
  totalItems,
  totalValue,
  storeColors,
  onOpenCart,
  onCheckout,
  onAddItem,
  onRemoveItem,
  isCheckingOut = false
}: FloatingCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mostrar carrinho apenas quando há itens
  useEffect(() => {
    setIsVisible(totalItems > 0);
    // Se não há itens, fechar expansão
    if (totalItems === 0) {
      setIsExpanded(false);
    }
  }, [totalItems]);

  // Formatar valor total
  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop para fechar quando expandido */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsExpanded(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsExpanded(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Fechar carrinho expandido"
        />
      )}

      {/* Carrinho Flutuante */}
      <div 
        className={`
          fixed bottom-4 z-50 transition-all duration-300 ease-in-out
          ${isExpanded ? 'bottom-0 left-0 right-0' : 'md:left-1/2 md:transform md:-translate-x-1/2 md:max-w-sm md:w-auto md:mx-4 left-4 right-4'}
        `}
      >
        {/* Versão Expandida */}
        {isExpanded ? (
          <div 
            className="bg-white rounded-t-2xl shadow-2xl max-h-96 overflow-hidden"
            style={{ borderTopColor: storeColors.primary, borderTopWidth: '3px' }}
          >
            {/* Header do carrinho expandido */}
            <div 
              className="flex items-center justify-between p-4 text-white"
              style={{ backgroundColor: storeColors.primary }}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Seu Carrinho</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de itens */}
            <div className="max-h-48 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={`${item.id}-${item.name}-${item.selectedColor || 'no-color'}-${item.selectedSize || 'no-size'}`} className="flex items-center space-x-3">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    {(item.selectedColor || item.selectedSize) && (
                      <p className="text-xs text-gray-400">
                        {item.selectedColor && `Cor: ${item.selectedColor}`}
                        {item.selectedColor && item.selectedSize && ' • '}
                        {item.selectedSize && `Tamanho: ${item.selectedSize}`}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      R$ {item.price}
                    </p>
                  </div>
                  
                  {/* Controles de quantidade */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onRemoveItem?.(item.name, item.selectedColor, item.selectedSize)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                      style={{ backgroundColor: 'transparent', border: `1px solid ${storeColors.primary}` }}
                      title={item.quantity === 1 ? "Remover item" : "Diminuir quantidade"}
                    >
                      <Minus className="w-3 h-3" style={{ color: storeColors.primary }} />
                    </button>
                    
                    <span className="font-medium text-sm min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => onAddItem?.(item.name, item.selectedColor, item.selectedSize)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all"
                      style={{ backgroundColor: storeColors.primary }}
                      title="Adicionar mais"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer com total e ações */}
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total:</span>
                <span className="font-bold text-lg" style={{ color: storeColors.primary }}>
                  {formatPrice(totalValue)}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  onCheckout?.();
                }}
                disabled={isCheckingOut}
                className="w-full px-4 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ backgroundColor: storeColors.primary }}
              >
                {isCheckingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Carregando...
                  </>
                ) : (
                  'Finalizar Pedido'
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Versão Compacta - Web */
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={`
              hidden md:flex bg-gray-800 rounded-full shadow-lg px-6 py-3 
              hover:shadow-xl transition-all duration-200 transform hover:scale-105
              items-center space-x-4
            `}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </div>
            
            <span className="text-white font-semibold">
              {formatPrice(totalValue)}
            </span>
            
            <span className="text-white text-sm bg-white/20 px-3 py-1 rounded-full">
              VER SACOLA
            </span>
          </button>
        )}

        {/* Versão Compacta - Mobile (mantém o layout original) */}
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={`
              md:hidden w-full bg-white rounded-2xl shadow-lg p-4 
              hover:shadow-xl transition-all duration-200 transform hover:scale-105
              border-2
            `}
            style={{ borderColor: storeColors.primary }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: storeColors.primary }}
                >
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Toque para ver detalhes
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg" style={{ color: storeColors.primary }}>
                  {formatPrice(totalValue)}
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </button>
        )}
      </div>
    </>
  );
}