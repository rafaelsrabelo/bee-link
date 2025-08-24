'use client';

import { ArrowDown, ArrowUp, GripVertical, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  display_order: number;
  available?: boolean;
}

interface ProductOrderManagerProps {
  products: Product[];
  storeSlug: string;
  onOrderChange?: (products: Product[]) => void;
}

export default function ProductOrderManager({ 
  products, 
  storeSlug, 
  onOrderChange 
}: ProductOrderManagerProps) {
  const [orderedProducts, setOrderedProducts] = useState<Product[]>(
    [...products].sort((a, b) => a.display_order - b.display_order)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveProduct = (fromIndex: number, toIndex: number) => {
    const newProducts = [...orderedProducts];
    const [movedProduct] = newProducts.splice(fromIndex, 1);
    newProducts.splice(toIndex, 0, movedProduct);
    
    // Atualizar display_order baseado na nova posição
    const updatedProducts = newProducts.map((product, index) => ({
      ...product,
      display_order: index
    }));
    
    setOrderedProducts(updatedProducts);
    onOrderChange?.(updatedProducts);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveProduct(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < orderedProducts.length - 1) {
      moveProduct(index, index + 1);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveProduct(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const saveOrder = async () => {
    setIsSaving(true);
    try {
      console.log('Enviando dados para reordenação de produtos:', {
        products: orderedProducts.map((product, index) => ({
          id: product.id,
          display_order: index
        }))
      });

      const response = await fetch(`/api/stores/${storeSlug}/products/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: orderedProducts.map((product, index) => ({
            id: product.id,
            display_order: index
          }))
        })
      });

      console.log('Resposta da API de produtos:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Resultado:', result);
        toast.success('Ordem dos produtos atualizada com sucesso!');
      } else {
        const errorData = await response.json();
        console.error('Erro da API:', errorData);
        throw new Error(`Erro ao salvar ordem: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar ordem dos produtos: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Ordem de Exibição dos Produtos
        </h3>
        <button
          type="button"
          onClick={saveOrder}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {isSaving ? 'Salvando...' : 'Salvar Ordem'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Arraste os produtos para reordenar ou use os botões de seta. 
            A ordem será refletida na página do cliente.
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {orderedProducts.map((product, index) => (
            <div
              key={product.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <GripVertical 
                  size={20} 
                  className="text-gray-400 cursor-grab active:cursor-grabbing" 
                />
                <span className="text-sm font-medium text-gray-500 w-8">
                  {index + 1}
                </span>
              </div>

              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {product.category} • {product.price}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === orderedProducts.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
