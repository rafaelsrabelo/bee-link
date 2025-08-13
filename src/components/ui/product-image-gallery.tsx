'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ProductImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
}

export default function ProductImageGallery({
  images
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Se não há imagens, mostrar placeholder
  if (images.length === 0) {
    return (
      <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">Nenhuma imagem</div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const currentImage = images[currentImageIndex];

  return (
    <div className="relative">
      {/* Imagem Principal */}
      <div className="aspect-square relative">
        <Image
          src={currentImage.url}
          alt={`Imagem ${currentImageIndex + 1}`}
          fill
          className="object-cover"
        />
        
        {/* Navegação (só se houver mais de uma imagem) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Contador de imagens */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}

        {/* Indicador de imagem principal */}
        {currentImage.is_primary && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Principal
          </div>
        )}
      </div>

      {/* Thumbnails (se houver mais de uma imagem) */}
      {images.length > 1 && (
        <div className="mt-4 p-4 bg-white/50 rounded-lg backdrop-blur-sm">
          <div className="text-center mb-2">
            <span className="text-xs text-gray-600 font-medium">Clique nas imagens para visualizar</span>
          </div>
          <div className="flex gap-2 justify-center overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goToImage(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === index
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-400 hover:scale-102'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {currentImageIndex === index && (
                  <div className="absolute inset-0 bg-blue-500/20" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
