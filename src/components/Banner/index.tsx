import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerImage {
  url: string;
  id: string;
}

interface BannerProps {
  images: BannerImage[];
  type: 'single' | 'carousel';
  height: 'small' | 'medium' | 'large' | 'full';
  rounded?: boolean;
  padding?: boolean;
}

const heightClasses = {
  small: 'h-32 sm:h-40',
  medium: 'h-48 sm:h-64',
  large: 'h-64 sm:h-96',
  full: 'h-[calc(100vh-4rem)]'
};

export function Banner({ images, type, height, rounded = true, padding = true }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (type === 'carousel' && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((current) => (current + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [type, images.length]);

  const nextSlide = () => {
    setCurrentIndex((current) => (current + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((current) => (current - 1 + images.length) % images.length);
  };

  if (!images.length) return null;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-background-tertiary',
        heightClasses[height],
        rounded && 'rounded-2xl',
        padding && 'p-4'
      )}
    >
      <div
        className="h-full w-full transition-transform duration-500 ease-in-out"
        style={{
          transform: type === 'carousel' ? `translateX(-${currentIndex * 100}%)` : 'none',
          width: type === 'carousel' ? `${images.length * 100}%` : '100%',
          display: 'flex',
        }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative h-full"
            style={{ width: type === 'carousel' ? `${100 / images.length}%` : '100%' }}
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

      {type === 'carousel' && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((image) => (
              <button
                type="button"
                key={image.id}
                onClick={() => setCurrentIndex(images.findIndex(img => img.id === image.id))}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  images[currentIndex].id === image.id ? 'bg-white w-4' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
