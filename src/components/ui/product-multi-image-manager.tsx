'use client';

import { Camera, Edit, Image as ImageIcon, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { ProductImage } from '../../types/product-image';

interface ProductMultiImageManagerProps {
  productId?: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

interface ImageUploadState {
  uploading: boolean;
  progress: number;
}

export default function ProductMultiImageManager({
  productId,
  images = [],
  onImagesChange,
  disabled = false
}: ProductMultiImageManagerProps) {
  const [uploadStates, setUploadStates] = useState<Map<string, ImageUploadState>>(new Map());
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [altTextInput, setAltTextInput] = useState('');

  // Ordenar imagens por sort_order
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande (máximo 5MB)`);
        continue;
      }

      const uploadId = `${Date.now()}-${Math.random()}`;
      
      setUploadStates(prev => new Map(prev.set(uploadId, {
        uploading: true,
        progress: 0
      })));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro no upload');
        }

        const result = await response.json();
        
        // Criar nova imagem
        const newImage: ProductImage = {
          id: Date.now(), // ID temporário (será substituído pelo banco)
          product_id: productId || '',
          image_url: result.imageUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, ''), // Nome sem extensão
          is_primary: images.length === 0, // Primeira imagem é primária
          sort_order: images.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        onImagesChange([...images, newImage]);
        toast.success('Imagem adicionada com sucesso!');

      } catch (error) {
        console.error('Erro no upload:', error);
        toast.error(error instanceof Error ? error.message : 'Erro no upload da imagem');
      } finally {
        setUploadStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }
    }
  }, [disabled, productId, images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !e.dataTransfer.files.length) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [disabled, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files?.length) return;
    
    handleFileSelect(e.target.files);
    e.target.value = ''; // Reset input
  }, [disabled, handleFileSelect]);

  const handleSetPrimary = (imageId: number) => {
    if (disabled) return;

    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    
    onImagesChange(updatedImages);
    toast.success('Imagem principal alterada');
  };

  const handleDeleteImage = (imageId: number) => {
    if (disabled) return;

    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;

    const updatedImages = images.filter(img => img.id !== imageId);
    
    // Se deletou a imagem primária e há outras imagens, definir a primeira como primária
    if (imageToDelete.is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true;
    }

    onImagesChange(updatedImages);
    toast.success('Imagem removida');
  };

  const handleUpdateAltText = () => {
    if (!editingImage || disabled) return;

    const updatedImages = images.map(img => 
      img.id === editingImage.id 
        ? { ...img, alt_text: altTextInput }
        : img
    );

    onImagesChange(updatedImages);
    setEditingImage(null);
    setAltTextInput('');
    toast.success('Texto alternativo atualizado');
  };

  const handleReorderImage = (imageId: number, direction: 'up' | 'down') => {
    if (disabled) return;

    const currentIndex = sortedImages.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedImages.length) return;

    const updatedImages = [...sortedImages];
    [updatedImages[currentIndex], updatedImages[newIndex]] = 
    [updatedImages[newIndex], updatedImages[currentIndex]];

    // Atualizar sort_order
    updatedImages.forEach((img, index) => {
      img.sort_order = index;
    });

    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Imagens do Produto ({images.length})
        </h3>
        <div className="text-sm text-gray-500">
          Máximo 5MB por imagem • JPG, PNG, WebP, GIF
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          if (!disabled) {
            document.getElementById('multi-image-input')?.click();
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            document.getElementById('multi-image-input')?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <input
          id="multi-image-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            {uploadStates.size > 0 ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {uploadStates.size > 0 ? 'Fazendo upload...' : 'Adicionar imagens'}
            </p>
            <p className="text-xs text-gray-500">
              Clique para selecionar ou arraste imagens aqui
            </p>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedImages.map((image, index) => (
            <div
              key={image.id}
              className={`
                relative group bg-white border-2 rounded-lg overflow-hidden shadow-sm
                ${image.is_primary ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'}
              `}
            >
              {/* Image */}
              <div className="aspect-square relative">
                <Image
                  src={image.image_url}
                  alt={image.alt_text || `Imagem ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Principal
                    </div>
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    {/* Set Primary */}
                    {!image.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={disabled}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                        title="Definir como principal"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit Alt Text */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingImage(image);
                        setAltTextInput(image.alt_text || '');
                      }}
                      disabled={disabled}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                      title="Editar texto alternativo"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={disabled}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                      title="Remover imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Bar */}
              <div className="p-2 bg-white border-t">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">
                      {image.alt_text || `Imagem ${index + 1}`}
                    </p>
                  </div>
                  
                  {/* Reorder Buttons */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleReorderImage(image.id, 'up')}
                      disabled={disabled || index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorderImage(image.id, 'down')}
                      disabled={disabled || index === sortedImages.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Alt Text Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Editar Texto Alternativo</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingImage(null);
                  setAltTextInput('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto alternativo (para acessibilidade)
                </label>
                <input
                  type="text"
                  value={altTextInput}
                  onChange={(e) => setAltTextInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva a imagem..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingImage(null);
                    setAltTextInput('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateAltText}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload States */}
      {uploadStates.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadStates.entries()).map(([id, state]) => (
            <div key={id} className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span className="text-sm text-blue-700">Fazendo upload...</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
