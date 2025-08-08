'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ConfigurableBannerProps {
  images: string[];
  type: 'single' | 'carousel';
  height: 'small' | 'medium' | 'large';
  rounded: boolean;
  padding: boolean;
  colors: {
    primary: string;
    text: string;
  };
}

const heightClasses = {
  small: 'h-24',
  medium: 'h-32',
  large: 'h-48'
};

export default function ConfigurableBanner({ 
  images, 
  type, 
  height, 
  rounded, 
  padding, 
  colors 
}: ConfigurableBannerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (type === 'carousel' && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 5000); // 5 seconds

      return () => clearInterval(interval);
    }
  }, [type, images.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return null;
  }

  const containerClasses = `
    ${padding ? 'px-4' : ''} 
    ${rounded ? 'rounded-xl' : ''} 
    overflow-hidden
  `;

  const bannerClasses = `
    ${heightClasses[height]} 
    w-full 
    relative 
    ${rounded ? 'rounded-xl' : ''}
  `;

  return (
    <div className={`max-w-4xl mx-auto ${containerClasses}`}>
      <div className={bannerClasses}>
        {type === 'single' ? (
          // Banner único
          <Image
            src={images[0]}
            alt="Banner da loja"
            fill
            className="object-cover"
          />
        ) : (
          // Carrossel
          <>
            {images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`Banner ${index + 1}`}
                fill
                className={`object-cover transition-opacity duration-500 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            
            {/* Indicadores */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Botões de navegação */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
