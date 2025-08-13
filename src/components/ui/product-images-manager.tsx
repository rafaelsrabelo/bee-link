'use client';

import { Image as ImageIcon, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import MobileImageUpload from './mobile-image-upload';

interface ProductImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface ProductImagesManagerProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  colors?: {
    primary: string;
  };
}

export default function ProductImagesManager({
  images,
  onImagesChange,
  colors
}: ProductImagesManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImage, setNewImage] = useState<Partial<ProductImage>>({
    url: '',
    is_primary: false
  });

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      // Validações no frontend
      if (!file.type.startsWith('image/')) {
        toast.error('O arquivo deve ser uma imagem (JPG, PNG, etc)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter menos de 5MB');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'bee-link-products');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setNewImage(prev => ({ ...prev, url: data.imageUrl }));
        toast.success('Imagem enviada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const addImage = () => {
    if (!newImage.url) {
      toast.error('Selecione uma imagem');
      return;
    }

    // Se for a primeira imagem, definir como principal
    const isPrimary = images.length === 0;

    const imageToAdd: ProductImage = {
      id: Date.now().toString(),
      url: newImage.url,
      is_primary: isPrimary
    };

    onImagesChange([...images, imageToAdd]);
    setNewImage({ url: '', is_primary: false });
    setShowAddModal(false);
    toast.success('Imagem adicionada com sucesso!');
  };

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // Se a imagem removida era principal e ainda há outras imagens, definir a primeira como principal
    const removedImage = images.find(img => img.id === imageId);
    if (removedImage?.is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true;
    }
    
    onImagesChange(updatedImages);
    toast.success('Imagem removida com sucesso!');
  };

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    onImagesChange(updatedImages);
    toast.success('Imagem principal definida!');
  };

  return (
    <div className="space-y-4">
      {/* Lista de imagens */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt="Imagem do produto"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Indicador de imagem principal */}
              {image.is_primary && (
                <div className="absolute top-2 left-2">
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Principal
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(image.id)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                    title="Definir como principal"
                  >
                    ⭐
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  title="Remover imagem"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nenhuma imagem adicionada</p>
          <p className="text-xs text-gray-400">Clique em "Adicionar Imagem" para começar</p>
        </div>
      )}

      {/* Botão para adicionar imagem */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Adicionar Imagem
      </button>

      {/* Modal para adicionar imagem */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Adicionar Imagem</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload de imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Produto
                </label>
                <MobileImageUpload
                  currentImage={newImage.url}
                  onImageSelect={handleImageUpload}
                  loading={uploadingImage}
                  disabled={uploadingImage}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addImage}
                disabled={!newImage.url}
                className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors?.primary || '#3B82F6' }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
