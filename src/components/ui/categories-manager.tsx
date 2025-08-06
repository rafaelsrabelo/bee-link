'use client';

import { Edit, FolderOpen, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import DeleteModal from './delete-modal';

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  store_id: string;
  is_active: boolean;
  sort_order: number;
}

interface CategoriesManagerProps {
  storeSlug: string;
  onClose: () => void;
}

export default function CategoriesManager({ storeSlug, onClose }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '#8B5CF6' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryId: number | null;
    categoryName: string;
  }>({ isOpen: false, categoryId: null, categoryName: '' });

  const availableColors = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
    '#EF4444', '#EC4899', '#14B8A6', '#F97316'
  ];

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}/product-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  // Iniciar edição
  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description,
      color: category.color
    });
  };

  // Salvar edição
  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeSlug}/product-categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          color: editForm.color
        })
      });

      if (response.ok) {
        toast.success('Categoria atualizada!');
        setEditingId(null);
        loadCategories();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao atualizar categoria');
      }
    } catch (_error) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  // Cancelar edição
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', color: '#8B5CF6' });
  };

  // Abrir modal de confirmação de delete
  const openDeleteModal = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name
    });
  };

  // Fechar modal de delete
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
  };

  // Confirmar delete da categoria
  const confirmDeleteCategory = async () => {
    if (!deleteModal.categoryId) return;

    setDeletingId(deleteModal.categoryId);
    try {
      const response = await fetch(`/api/stores/${storeSlug}/product-categories?id=${deleteModal.categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Categoria deletada!');
        closeDeleteModal();
        loadCategories();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao deletar categoria');
      }
    } catch (_error) {
      toast.error('Erro ao deletar categoria');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Gerenciar Categorias</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-gray-600">
                Crie categorias na página de produtos para gerenciá-las aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {editingId === category.id ? (
                    // Modo de edição
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nome da categoria"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Descrição (opcional)"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={editForm.color}
                          onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {availableColors.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: editForm.color }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Modo de visualização
                    <div className="flex-1 flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    {editingId === category.id ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Salvar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(category)}
                          disabled={deletingId === category.id}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Deletar"
                        >
                          {deletingId === category.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Delete */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCategory}
        title="Deletar Categoria"
        message="Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita."
        itemName={deleteModal.categoryName}
      />
    </div>
  );
}