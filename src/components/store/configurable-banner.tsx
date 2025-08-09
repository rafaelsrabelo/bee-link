import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface BannerImage {
  url: string;
  id: string;
}

interface ConfigurableBannerProps {
  images: string[];
  type: 'single' | 'carousel';
  height: 'small' | 'medium' | 'large' | 'full';
  rounded?: boolean;
  padding?: boolean;
  colors?: {
    primary: string;
    background: string;
  };
}

const heightClasses = {
  small: 'h-32 sm:h-40 md:h-48',
  medium: 'h-40 sm:h-56 md:h-64 lg:h-72',
  large: 'h-56 sm:h-72 md:h-96 lg:h-[28rem]',
  full: 'h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]'
};

export default function ConfigurableBanner({ 
  images, 
  type, 
  height, 
  rounded = true, 
  padding = true,
  colors 
}: ConfigurableBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtrar imagens válidas
  const validImages = images.filter(img => img && img.trim() !== '');
  
  // Converter para formato esperado pelo componente Banner
  const bannerImages: BannerImage[] = validImages.map((img, index) => ({
    url: img,
    id: `banner-${index}`
  }));

  useEffect(() => {
    if (type === 'carousel' && bannerImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((current) => (current + 1) % bannerImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [type, bannerImages.length]);

  if (validImages.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((current) => (current + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((current) => (current - 1 + bannerImages.length) % bannerImages.length);
  };

  return (
    <div className={`${padding ? 'px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 mt-4 sm:mt-6' : ''}`}>
      <div
        className={`relative w-full overflow-hidden ${
          rounded ? 'rounded-lg' : ''
        } ${heightClasses[height]} bg-gray-100`}
      >
        <div
          className="h-full w-full transition-transform duration-500 ease-in-out"
          style={{
            transform: type === 'carousel' ? `translateX(-${currentIndex * 100}%)` : 'none',
            width: type === 'carousel' ? `${bannerImages.length * 100}%` : '100%',
            display: 'flex',
          }}
        >
          {bannerImages.map((image, index) => (
            <div
              key={image.id}
              className="relative h-full"
              style={{ width: type === 'carousel' ? `${100 / bannerImages.length}%` : '100%' }}
            >
              <Image
                src={image.url}
                alt={`Banner ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {type === 'carousel' && bannerImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 sm:p-2 shadow-lg hover:bg-white transition-colors"
              style={{ color: colors?.primary || '#10b981' }}
            >
              <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 sm:p-2 shadow-lg hover:bg-white transition-colors"
              style={{ color: colors?.primary || '#10b981' }}
            >
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:gap-2">
              {bannerImages.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}