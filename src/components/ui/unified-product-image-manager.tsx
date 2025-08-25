'use client';

import { Camera, Edit, Image as ImageIcon, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { ProductImage } from '../../types/product-image';

interface UnifiedProductImageManagerProps {
  productId?: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  disabled?: boolean;
  showPrimaryIndicator?: boolean;
}

interface ImageUploadState {
  uploading: boolean;
  progress: number;
}

export default function UnifiedProductImageManager({
  productId,
  images = [],
  onImagesChange,
  disabled = false,
  showPrimaryIndicator = true
}: UnifiedProductImageManagerProps) {
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
        // Simular progresso
        const progressInterval = setInterval(() => {
          setUploadStates(prev => {
            const current = prev.get(uploadId);
            if (current && current.progress < 90) {
              const newMap = new Map(prev);
              newMap.set(uploadId, { ...current, progress: current.progress + 10 });
              return newMap;
            }
            return prev;
          });
        }, 100);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro no upload');
        }

        const result = await response.json();
        
        // Marcar como 100% concluído
        setUploadStates(prev => {
          const newMap = new Map(prev);
          newMap.set(uploadId, { uploading: true, progress: 100 });
          return newMap;
        });

        // Aguardar um pouco para mostrar o 100%
        await new Promise(resolve => setTimeout(resolve, 200));
        
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleImageClick = useCallback((e: React.MouseEvent, image: ProductImage) => {
    e.preventDefault();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFileSelect(target.files);
      }
    };
    
    input.click();
  }, [handleFileSelect]);

  const handleSetPrimary = useCallback((imageId: number) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    onImagesChange(updatedImages);
    toast.success('Imagem principal definida!');
  }, [images, onImagesChange]);

  const handleDeleteImage = useCallback((imageId: number) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // Se a imagem deletada era primária e há outras imagens, definir a primeira como primária
    const deletedImage = images.find(img => img.id === imageId);
    if (deletedImage?.is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true;
    }
    
    onImagesChange(updatedImages);
    toast.success('Imagem removida!');
  }, [images, onImagesChange]);

  const handleReorderImages = useCallback((fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    // Atualizar sort_order
    updatedImages.forEach((img, index) => {
      img.sort_order = index;
    });
    
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleEditAltText = useCallback((image: ProductImage) => {
    setEditingImage(image);
    setAltTextInput(image.alt_text || '');
  }, []);

  const handleSaveAltText = useCallback(() => {
    if (!editingImage) return;
    
    const updatedImages = images.map(img => 
      img.id === editingImage.id 
        ? { ...img, alt_text: altTextInput }
        : img
    );
    
    onImagesChange(updatedImages);
    setEditingImage(null);
    setAltTextInput('');
    toast.success('Texto alternativo salvo!');
  }, [editingImage, altTextInput, images, onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 relative
          ${disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
          }
        `}
        onClick={() => !disabled && document.getElementById('image-upload')?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && document.getElementById('image-upload')?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <input
          id="image-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        {/* Loading Overlay */}
        {uploadStates.size > 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Enviando imagem...</p>
              <p className="text-xs text-gray-500">Aguarde um momento</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-blue-100 rounded-full">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {images.length === 0 ? 'Adicionar imagens do produto' : 'Adicionar mais imagens'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Arraste e solte ou clique para selecionar
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Imagens */}
      {sortedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Imagens do Produto ({sortedImages.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Loading Placeholders */}
            {Array.from(uploadStates.keys()).map((uploadId, index) => (
              <div
                key={`loading-${uploadId}`}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden aspect-square bg-gray-50"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-6 h-6 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Carregando...</p>
                  </div>
                </div>
              </div>
            ))}
            
            {sortedImages.map((image, index) => (
              <div
                key={image.id}
                className={`
                  relative group border rounded-lg overflow-hidden transition-all duration-200
                  ${image.is_primary ? 'ring-2 ring-blue-500' : 'border-gray-200'}
                `}
              >
                {/* Imagem */}
                <div className="aspect-square relative">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || 'Imagem do produto'}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(e, image);
                        }}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        title="Substituir imagem"
                      >
                        <Edit className="w-4 h-4 text-gray-700" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAltText(image);
                        }}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        title="Editar texto alternativo"
                      >
                        <ImageIcon className="w-4 h-4 text-gray-700" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        className="p-2 bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        title="Remover imagem"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Indicador de imagem primária */}
                  {showPrimaryIndicator && image.is_primary && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Principal
                    </div>
                  )}
                  
                  {/* Número da ordem */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                    {index + 1}
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="p-2 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={image.is_primary}
                      className={`
                        text-xs px-2 py-1 rounded transition-colors
                        ${image.is_primary 
                          ? 'bg-blue-100 text-blue-600 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-600'
                        }
                      `}
                    >
                      {image.is_primary ? 'Principal' : 'Definir Principal'}
                    </button>
                    
                    {/* Controles de ordem */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorderImages(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        title="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderImages(index, Math.min(images.length - 1, index + 1))}
                        disabled={index === images.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
        </div>
      )}

      {/* Modal para editar texto alternativo */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Editar Texto Alternativo
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto Alternativo
              </label>
              <input
                type="text"
                value={altTextInput}
                onChange={(e) => setAltTextInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva a imagem..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingImage(null);
                  setAltTextInput('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAltText}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
