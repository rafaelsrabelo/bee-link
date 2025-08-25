'use client';

import { Package, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import UnifiedProductImageManager from './unified-product-image-manager';
import ProductCategorySelector from './product-category-selector';
import { applyPriceMask, parsePriceToCents } from '../../lib/price-utils';
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
    text: string;
    header: string;
    background: string;
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
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Carregar categorias quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}/product-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!newProduct.name?.trim()) {
      newErrors.name = 'Nome do produto é obrigatório';
    }
    
    if (!newProduct.price || parsePriceToCents(newProduct.price) === 0) {
      newErrors.price = 'Preço é obrigatório';
    }
    
    if (!newProduct.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = async () => {
    if (!validateForm()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      // Buscar nome real da categoria
      let categoryName = 'Geral';
      if (newProduct.category_id) {
        const category = categories.find(cat => cat.id === newProduct.category_id);
        categoryName = category?.name || 'Geral';
      }

      // Converter preço para centavos
      const priceInCents = parsePriceToCents(newProduct.price || '');
      
      // Definir imagem principal
      let mainImage = '';
      if (productImages.length > 0) {
        const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
        mainImage = primaryImage.image_url;
      }

      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name || '',
        price: priceInCents.toString(),
        image: mainImage,
        category: categoryName,
        category_id: newProduct.category_id,
        description: newProduct.description || '',
        readyToShip: newProduct.readyToShip || false,
        available: newProduct.available !== false,
        store_id: undefined // Será definido pela API
      };

      // Salvar produto
      const response = await fetch(`/api/stores/${storeSlug}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar produto');
      }

      const savedProduct = await response.json();

      // Salvar imagens se houver
      if (productImages.length > 0) {
        const imagesToSave = productImages.map((img, index) => ({
          product_id: savedProduct.id,
          image_url: img.image_url,
          alt_text: img.alt_text || `${product.name} - Imagem ${index + 1}`,
          is_primary: img.is_primary,
          sort_order: img.sort_order || index
        }));

        await fetch(`/api/stores/${storeSlug}/products`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: savedProduct.id,
            images: imagesToSave
          }),
        });
      }

      // Resetar formulário
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
      setErrors({});

      onProductAdded(savedProduct);
      toast.success('Produto adicionado com sucesso!');
      onClose();

    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
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
      setErrors({});
      onClose();
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
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
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
              disabled={saving}
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
                const maskedValue = applyPriceMask(e.target.value);
                setNewProduct({...newProduct, price: maskedValue});
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
              disabled={saving}
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
                setNewProduct({...newProduct, category: category?.name || 'Geral', category_id: categoryId});
              }}
              placeholder="Selecionar categoria"
              colors={colors}
            />
          </div>

          {/* Imagens do Produto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagens do Produto
            </label>
            <UnifiedProductImageManager
              images={productImages}
              onImagesChange={setProductImages}
              disabled={saving}
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 A primeira imagem será exibida na listagem de produtos
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              value={newProduct.description}
              onChange={(e) => {
                setNewProduct({...newProduct, description: e.target.value});
                if (errors.description) {
                  setErrors({...errors, description: ''});
                }
              }}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                errors.description 
                  ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Descreva o produto..."
              disabled={saving}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Opções */}
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newProduct.readyToShip}
                onChange={(e) => setNewProduct({...newProduct, readyToShip: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">Pronta Entrega</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newProduct.available}
                onChange={(e) => setNewProduct({...newProduct, available: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">Disponível</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAddProduct}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
