'use client';

import { Plus, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CreateStoreCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
  storeSlug: string;
  colors?: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
}

export default function CreateStoreCategoryModal({ 
  isOpen, 
  onClose, 
  onCategoryCreated, 
  storeSlug,
  colors 
}: CreateStoreCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8B5CF6'
  });
  const [loading, setLoading] = useState(false);

  const availableColors = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
    '#EF4444', '#EC4899', '#14B8A6', '#F97316'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação local
    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('Nome da categoria deve ter pelo menos 2 caracteres');
      return;
    }

    if (formData.name.trim().length > 50) {
      toast.error('Nome da categoria deve ter no máximo 50 caracteres');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/stores/${storeSlug}/product-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color
        }),
      });

      if (response.ok) {
        toast.success('Categoria criada com sucesso!');
        setFormData({ name: '', description: '', color: '#8B5CF6' });
        onCategoryCreated();
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Erro ao criar categoria:', response.status, errorData);
        toast.error(errorData.error || `Erro ao criar categoria (${response.status})`);
      }
    } catch (error) {
      console.error('Erro de rede ao criar categoria:', error);
      toast.error('Erro de conexão ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', color: '#8B5CF6' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5" style={{ color: colors?.primary || '#8B5CF6' }} />
            <h2 className="text-lg font-semibold text-gray-900">Nova Categoria</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Bebidas, Doces, Salgados..."
              maxLength={50}
              required
            />
            {formData.name.trim().length > 0 && (
              <p className={`text-xs mt-1 ${
                formData.name.trim().length < 2 ? 'text-red-500' : 
                formData.name.trim().length > 45 ? 'text-yellow-500' : 'text-gray-500'
              }`}>
                {formData.name.trim().length}/50 caracteres
                {formData.name.trim().length < 2 && ' - Mínimo 2 caracteres'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descrição da categoria..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor da Categoria
            </label>
            <div className="flex items-center gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors?.primary || '#8B5CF6' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Categoria
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}