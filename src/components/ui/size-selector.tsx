"use client";

import { useState } from 'react';

interface SizeSelectorProps {
  sizes?: string[];
  selectedSize?: string;
  onSizeSelect?: (size: string) => void;
  disabled?: boolean;
  colors?: {
    primary: string;
    text: string;
  };
}

const defaultSizes = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

export default function SizeSelector({ 
  sizes = defaultSizes, 
  selectedSize, 
  onSizeSelect, 
  disabled = false,
  colors 
}: SizeSelectorProps) {
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

  if (!sizes || sizes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: colors?.primary }}>
          Tamanho
        </h3>
        {selectedSize && (
          <span className="text-xs text-gray-500">
            Selecionado: {selectedSize}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size;
          const isHovered = hoveredSize === size;
          
          return (
            <button
              key={size}
              type="button"
              disabled={disabled}
              onClick={() => onSizeSelect?.(size)}
              onMouseEnter={() => setHoveredSize(size)}
              onMouseLeave={() => setHoveredSize(null)}
              className={`
                px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all duration-200
                ${disabled 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : isSelected
                    ? 'text-white shadow-md transform scale-105'
                    : isHovered
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
              `}
              style={{
                backgroundColor: isSelected ? colors?.primary : undefined,
                borderColor: isSelected ? colors?.primary : undefined,
                color: isSelected ? 'white' : colors?.text || '#374151'
              }}
            >
              {size}
            </button>
          );
        })}
      </div>
      
      {!selectedSize && !disabled && (
        <p className="text-xs text-gray-500">
          Selecione um tamanho para continuar
        </p>
      )}
    </div>
  );
}
