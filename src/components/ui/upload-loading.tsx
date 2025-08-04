'use client';

import Lottie from 'lottie-react';
import loadingAnimation from '../../../public/animations/loading-dots-blue.json';

interface UploadLoadingProps {
  text?: string;
}

export default function UploadLoading({ text = "Fazendo upload da imagem..." }: UploadLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
      <div className="w-20 h-20">
        <Lottie 
          animationData={loadingAnimation}
          loop={true}
          autoplay={true}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{text}</p>
        <p className="text-xs text-gray-500 mt-1">Aguarde um momento...</p>
      </div>
    </div>
  );
} 