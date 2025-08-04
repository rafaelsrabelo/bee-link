'use client';

import { Camera, Upload } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef } from 'react';

interface MobileImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImage?: string;
  disabled?: boolean;
  loading?: boolean;
}



export default function MobileImageUpload({
  onImageSelect,
  currentImage,
  disabled = false,
  loading = false
}: MobileImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-[#856342] bg-[#856342]/5' 
            : 'border-gray-300 hover:border-[#856342]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? onButtonClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        
        {currentImage ? (
          <div className="space-y-3">
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src={currentImage}
                alt="Preview"
                fill
                className="object-cover rounded-lg"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onButtonClick();
                  }}
                  className="absolute -top-2 -right-2 bg-[#856342] text-white p-1 rounded-full hover:bg-[#6B4F35] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Toque para trocar a imagem
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#856342]"></div>
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {loading ? 'Fazendo upload...' : 'Adicionar imagem'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                📱 Toque para adicionar imagem (câmera ou galeria)
              </p>
              <p className="text-xs text-gray-500">
                💻 Arraste uma imagem ou clique para selecionar
              </p>
            </div>
          </div>
        )}
      </div>


    </div>
  );
} 