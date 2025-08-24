'use client';

import { ArrowDown, ArrowUp, GripVertical, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  sort_order: number;
}

interface CategoryOrderManagerProps {
  categories: Category[];
  storeSlug: string;
  onOrderChange?: (categories: Category[]) => void;
}

export default function CategoryOrderManager({ 
  categories, 
  storeSlug, 
  onOrderChange 
}: CategoryOrderManagerProps) {
  const [orderedCategories, setOrderedCategories] = useState<Category[]>(
    [...categories].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveCategory = (fromIndex: number, toIndex: number) => {
    const newCategories = [...orderedCategories];
    const [movedCategory] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, movedCategory);
    
    // Atualizar sort_order baseado na nova posição
    const updatedCategories = newCategories.map((category, index) => ({
      ...category,
      sort_order: index
    }));
    
    setOrderedCategories(updatedCategories);
    onOrderChange?.(updatedCategories);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveCategory(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < orderedCategories.length - 1) {
      moveCategory(index, index + 1);
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
      moveCategory(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const saveOrder = async () => {
    setIsSaving(true);
    try {
      console.log('Enviando dados para reordenação:', {
        categories: orderedCategories.map((category, index) => ({
          id: category.id,
          sort_order: index
        }))
      });

      const response = await fetch(`/api/stores/${storeSlug}/categories/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: orderedCategories.map((category, index) => ({
            id: category.id,
            sort_order: index
          }))
        })
      });

      console.log('Resposta da API:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Resultado:', result);
        toast.success('Ordem das categorias atualizada com sucesso!');
      } else {
        const errorData = await response.json();
        console.error('Erro da API:', errorData);
        throw new Error(`Erro ao salvar ordem: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar ordem das categorias: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Ordem de Exibição das Categorias
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
            Arraste as categorias para reordenar ou use os botões de seta. 
            A ordem será refletida na página do cliente.
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {orderedCategories.map((category, index) => (
            <div
              key={category.id}
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
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color || '#8B5CF6' }}
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">
                    {category.name}
                  </h4>
                  {category.description && (
                    <p className="text-sm text-gray-500 truncate">
                      {category.description}
                    </p>
                  )}
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
                  disabled={index === orderedCategories.length - 1}
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
