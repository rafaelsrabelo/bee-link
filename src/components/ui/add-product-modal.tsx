'use client';

import { Package, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import MobileImageUpload from './mobile-image-upload';
import ProductCategorySelector from './product-category-selector';
import ProductMultiImageManager from './product-multi-image-manager';
import type { ProductImage } from '../../types/product-image';

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
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
        setNewProduct(prev => ({ ...prev, image: data.imageUrl }));
        toast.success('Imagem enviada com sucesso!');
      } else {
        // Mostrar mensagem de erro específica do backend
        toast.error(data.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async () => {
    // Limpar erros anteriores
    setErrors({});
    
    const newErrors: {[key: string]: string} = {};

    // Validação mais detalhada
    if (!newProduct.name?.trim()) {
      newErrors.name = 'O nome do produto é obrigatório';
    }

    if (!newProduct.price?.trim()) {
      newErrors.price = 'O preço do produto é obrigatório';
    } else {
      // Validar formato do preço (agora sempre será R$ X,XX)
      const priceRegex = /^R\$ \d{1,3}(\.\d{3})*,\d{2}$/;
      if (!priceRegex.test(newProduct.price.trim())) {
        newErrors.price = 'Digite um preço válido';
      }
    }

    // Se há erros, mostra o primeiro e para
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
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
          name: newProduct.name?.trim() || '',
          price: newProduct.price?.trim() || '',
          image: newProduct.image,
          category: newProduct.category,
          category_id: newProduct.category_id,
          description: newProduct.description?.trim(),
          readyToShip: newProduct.readyToShip,
          available: newProduct.available,
        }),
      });

      if (response.ok) {
        const product = await response.json();
        
        // Salvar imagens se houver alguma
        if (productImages.length > 0) {
          try {
            for (const image of productImages) {
              await fetch(`/api/products/${product.id}/images`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image_url: image.image_url,
                  alt_text: image.alt_text,
                  is_primary: image.is_primary,
                  sort_order: image.sort_order
                }),
              });
            }
          } catch (imageError) {
            console.error('Erro ao salvar imagens:', imageError);
            toast.error('Produto criado, mas houve erro ao salvar algumas imagens');
          }
        }
        
        onProductAdded(product);
        toast.success('Produto adicionado com sucesso!');
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
        setProductImages([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao adicionar produto');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor. Tente novamente.');
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
              onChange={(e) => {
                setNewProduct({...newProduct, name: e.target.value});
                // Limpar erro quando usuário começar a digitar
                if (errors.name) {
                  setErrors({...errors, name: ''});
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Digite o nome do produto"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço *
            </label>
            <input
              type="text"
              value={newProduct.price}
              onChange={(e) => {
                // Aplicar máscara de dinheiro
                let value = e.target.value;
                
                // Remove tudo que não é número
                value = value.replace(/\D/g, '');
                
                // Converte para centavos
                value = (Number(value) / 100).toFixed(2) + '';
                
                // Aplica formatação brasileira
                value = value.replace('.', ',');
                value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                
                // Adiciona R$ no início
                if (value !== '0,00') {
                  value = 'R$ ' + value;
                } else {
                  value = '';
                }
                
                setNewProduct({...newProduct, price: value});
                // Limpar erro quando usuário começar a digitar
                if (errors.price) {
                  setErrors({...errors, price: ''});
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                errors.price 
                  ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="R$ 0,00"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Digite apenas os números (ex: 1050 = R$ 10,50)
            </p>
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

          {/* Imagens do Produto */}
          <div>
            <ProductMultiImageManager
              images={productImages}
              onImagesChange={setProductImages}
              disabled={saving}
            />
            
            {/* Imagem tradicional (compatibilidade) */}
            {productImages.length === 0 && (
              <div className="mt-4 border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou adicione uma imagem única
                </label>
                <MobileImageUpload
                  currentImage={newProduct.image}
                  onImageSelect={handleImageUpload}
                  loading={uploadingImage}
                  disabled={uploadingImage || saving}
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Use o gerenciador acima para adicionar múltiplas imagens
                </p>
              </div>
            )}
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
