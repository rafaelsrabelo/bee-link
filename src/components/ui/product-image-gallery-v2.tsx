'use client';

import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface ProductImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

export default function ProductImageGallery({
  images = [],
  productName,
  className = ''
}: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ordenar imagens (principal primeiro, depois por sort_order)
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  }, [sortedImages.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  }, [sortedImages.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          setIsLightboxOpen(false);
          break;
      }
    };

    if (isLightboxOpen) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen, goToNext, goToPrevious]);

  // Se não há imagens, não renderizar nada
  if (!sortedImages.length) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <p className="text-gray-500">Nenhuma imagem disponível</p>
      </div>
    );
  }

  const currentImage = sortedImages[currentIndex];

  // Verificar se a URL da imagem é válida
  if (!currentImage.image_url || currentImage.image_url.trim() === '') {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <p className="text-gray-500">Imagem não disponível</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`}>
        {/* Main Image */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden group h-full">
          <div className="relative w-full h-full">
            <Image
              src={currentImage.image_url}
              alt={currentImage.alt_text || `${productName} - Imagem ${currentIndex + 1}`}
              fill
              className="object-cover transition-opacity duration-300"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error('Erro ao carregar imagem:', currentImage.image_url);
                setIsLoading(false);
              }}
              priority={currentIndex === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-300 rounded" />
              </div>
            )}

            {/* Navigation Arrows (show only if there are multiple images) */}
            {sortedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Zoom Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Ampliar imagem"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Image Counter */}
            {sortedImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                {currentIndex + 1} / {sortedImages.length}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails (only show if multiple images) */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goToImage(index)}
                className={`
                  relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200
                  ${index === currentIndex 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text || `${productName} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-xs px-1 rounded-br">
                    ★
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Instructions */}
        {sortedImages.length > 1 && (
          <p className="text-sm text-gray-500 text-center">
            Use as setas para navegar entre as imagens ou clique nas miniaturas
          </p>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative max-w-full max-h-full">
              <Image
                src={currentImage.image_url}
                alt={currentImage.alt_text || `${productName} - Imagem ${currentIndex + 1}`}
                width={800}
                height={800}
                className="object-contain max-w-full max-h-[80vh]"
                priority
              />
            </div>

            {/* Navigation in Lightbox */}
            {sortedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 bg-black/30 rounded-full"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 bg-black/30 rounded-full"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image Counter in Lightbox */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded">
                  {currentIndex + 1} de {sortedImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Strip in Lightbox */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => goToImage(index)}
                  className={`
                    relative flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all duration-200
                    ${index === currentIndex 
                      ? 'border-white' 
                      : 'border-gray-400 hover:border-gray-200 opacity-70 hover:opacity-100'
                    }
                  `}
                >
                  <Image
                    src={image.image_url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
