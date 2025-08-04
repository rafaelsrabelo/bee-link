'use client';

import Lottie from 'lottie-react';
import loadingAnimation from '../../../public/animations/loading-dots-blue.json';

interface DotsLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function DotsLoading({ 
  text = "Carregando", 
  size = 'md' 
}: DotsLoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{text}</span>
      <div className={sizeClasses[size]}>
        <Lottie 
          animationData={loadingAnimation}
          loop={true}
          autoplay={true}
        />
      </div>
    </div>
  );
} 