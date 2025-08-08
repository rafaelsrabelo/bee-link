'use client';

import { Package, Upload, X } from 'lucide-react';
import { useState } from 'react';
import MobileImageUpload from './mobile-image-upload';
import ProductCategorySelector from './product-category-selector';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  category_id?: number;
  description: string;
  readyToShip?: boolean;
  available?: boolean;
  store_id?: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: Product) => void;
  storeSlug: string;
  colors?: {
    primary: string;
  };
}

export default function AddProductModal({ 
  isOpen, 
  onClose, 
  onProductAdded, 
  storeSlug,
  colors 
}: AddProductModalProps) {
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: '',
    image: '',
    category: 'Geral',
    category_id: undefined,
    description: '',
    readyToShip: false,
    available: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'bee-link-products');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewProduct(prev => ({ ...prev, image: data.url }));
      } else {
        console.error('Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/stores/${storeSlug}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProduct.name,
          price: newProduct.price,
          image: newProduct.image,
          category: newProduct.category,
          category_id: newProduct.category_id,
          description: newProduct.description,
          readyToShip: newProduct.readyToShip,
          available: newProduct.available,
        }),
      });

      if (response.ok) {
        const product = await response.json();
        onProductAdded(product);
        onClose();
        // Reset form
        setNewProduct({
          name: '',
          price: '',
          image: '',
          category: 'Geral',
          category_id: undefined,
          description: '',
          readyToShip: false,
          available: true
        });
      } else {
        console.error('Erro ao adicionar produto');
      }
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Adicionar Produto</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Nome do Produto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o nome do produto"
            />
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço *
            </label>
            <input
              type="text"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="R$ 0,00"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <ProductCategorySelector
              storeSlug={storeSlug}
              value={newProduct.category_id}
              onChange={(categoryId) => {
                const category = categories.find(cat => cat.id === categoryId);
                setNewProduct({...newProduct, category: category?.name || 'Geral', category_id: categoryId})
              }}

            />
          </div>

          {/* Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem do Produto
            </label>
            <MobileImageUpload
              currentImage={newProduct.image}
              onImageSelect={handleImageUpload}
              loading={uploadingImage}
              disabled={uploadingImage}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva o produto..."
            />
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newProduct.readyToShip}
                onChange={(e) => setNewProduct({...newProduct, readyToShip: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Pronta Entrega</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newProduct.available}
                onChange={(e) => setNewProduct({...newProduct, available: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Disponível</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAddProduct}
            disabled={saving}
            className="px-6 py-2 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors?.primary || '#3B82F6' }}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando...
              </div>
            ) : (
              'Adicionar Produto'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
