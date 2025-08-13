'use client';

import { Edit, Palette, Plus, Ruler, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Color {
  id?: number;
  name: string;
  hex_code: string;
  is_default?: boolean;
}

interface Size {
  id?: number;
  name: string;
  value: string;
  is_default?: boolean;
}

interface ProductAttributesManagerProps {
  storeSlug: string;
  selectedColors: Color[];
  selectedSizes: Size[];
  onColorsChange: (colors: Color[]) => void;
  onSizesChange: (sizes: Size[]) => void;
  colorsEnabled?: boolean;
  sizesEnabled?: boolean;
  onColorsEnabledChange?: (enabled: boolean) => void;
  onSizesEnabledChange?: (enabled: boolean) => void;
  colors?: {
    primary: string;
  };
}

export default function ProductAttributesManager({
  storeSlug,
  selectedColors,
  selectedSizes,
  onColorsChange,
  onSizesChange,
  colorsEnabled = true,
  sizesEnabled = true,
  onColorsEnabledChange,
  onSizesEnabledChange,
  colors
}: ProductAttributesManagerProps) {
  const [availableColors, setAvailableColors] = useState<Color[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showEditColorModal, setShowEditColorModal] = useState(false);
  const [showEditSizeModal, setShowEditSizeModal] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', hex_code: '#000000' });
  const [newSize, setNewSize] = useState({ name: '', value: '' });
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [editingSize, setEditingSize] = useState<Size | null>(null);

  // Carregar cores e tamanhos disponíveis
  useEffect(() => {
    loadAttributes();
  }, [storeSlug]);

  const loadAttributes = async () => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}/attributes-config`);
      if (response.ok) {
        const data = await response.json();
        setAvailableColors(data.colors || []);
        setAvailableSizes(data.sizes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar atributos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addColor = async () => {
    if (!newColor.name.trim()) {
      toast.error('Digite o nome da cor');
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(newColor.hex_code)) {
      toast.error('Digite um código hexadecimal válido (ex: #FF0000)');
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeSlug}/attributes-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'color',
          name: newColor.name,
          hex_code: newColor.hex_code
        })
      });

      if (response.ok) {
        const color = await response.json();
        setAvailableColors(prev => [...prev, color]);
        setNewColor({ name: '', hex_code: '#000000' });
        setShowColorModal(false);
        toast.success('Cor adicionada com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar cor');
      }
    } catch (error) {
      toast.error('Erro ao adicionar cor');
    }
  };

  const addSize = async () => {
    if (!newSize.name.trim() || !newSize.value.trim()) {
      toast.error('Digite o nome e valor do tamanho');
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeSlug}/attributes-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'size',
          name: newSize.name,
          value: newSize.value
        })
      });

      if (response.ok) {
        const size = await response.json();
        setAvailableSizes(prev => [...prev, size]);
        setNewSize({ name: '', value: '' });
        setShowSizeModal(false);
        toast.success('Tamanho adicionado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar tamanho');
      }
    } catch (error) {
      toast.error('Erro ao adicionar tamanho');
    }
  };

  const editColor = async () => {
    if (!editingColor || !editingColor.id) return;
    
    if (!editingColor.name.trim()) {
      toast.error('Digite o nome da cor');
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(editingColor.hex_code)) {
      toast.error('Digite um código hexadecimal válido (ex: #FF0000)');
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeSlug}/attributes-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          id: editingColor.id,
          type: 'color',
          name: editingColor.name,
          hex_code: editingColor.hex_code
        })
      });

      if (response.ok) {
        const updatedColor = await response.json();
        setAvailableColors(prev => prev.map(c => c.id === editingColor.id ? updatedColor : c));
        setEditingColor(null);
        setShowEditColorModal(false);
        toast.success('Cor editada com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao editar cor');
      }
    } catch (error) {
      toast.error('Erro ao editar cor');
    }
  };

  const editSize = async () => {
    if (!editingSize || !editingSize.id) return;
    
    if (!editingSize.name.trim() || !editingSize.value.trim()) {
      toast.error('Digite o nome e valor do tamanho');
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeSlug}/attributes-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          id: editingSize.id,
          type: 'size',
          name: editingSize.name,
          value: editingSize.value
        })
      });

      if (response.ok) {
        const updatedSize = await response.json();
        setAvailableSizes(prev => prev.map(s => s.id === editingSize.id ? updatedSize : s));
        setEditingSize(null);
        setShowEditSizeModal(false);
        toast.success('Tamanho editado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao editar tamanho');
      }
    } catch (error) {
      toast.error('Erro ao editar tamanho');
    }
  };

  const [showDeleteColorModal, setShowDeleteColorModal] = useState(false);
  const [showDeleteSizeModal, setShowDeleteSizeModal] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);
  const [sizeToDelete, setSizeToDelete] = useState<Size | null>(null);

  const deleteColor = async (color: Color) => {
    if (!color.id) return;

    setColorToDelete(color);
    setShowDeleteColorModal(true);
  };

  const confirmDeleteColor = async () => {
    if (!colorToDelete || !colorToDelete.id) return;

    try {
      const response = await fetch(`/api/stores/${storeSlug}/attributes-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: colorToDelete.id,
          type: 'color'
        })
      });

      if (response.ok) {
        setAvailableColors(prev => prev.filter(c => c.id !== colorToDelete.id));
        onColorsChange(selectedColors.filter(c => c.name !== colorToDelete.name));
        toast.success('Cor deletada com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar cor');
      }
    } catch (error) {
      toast.error('Erro ao deletar cor');
    } finally {
      setShowDeleteColorModal(false);
      setColorToDelete(null);
    }
  };

  const deleteSize = async (size: Size) => {
    if (!size.id) return;

    setSizeToDelete(size);
    setShowDeleteSizeModal(true);
  };

  const confirmDeleteSize = async () => {
    if (!sizeToDelete || !sizeToDelete.id) return;

    try {
      const response = await fetch(`/api/stores/${storeSlug}/attributes-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: sizeToDelete.id,
          type: 'size'
        })
      });

      if (response.ok) {
        setAvailableSizes(prev => prev.filter(s => s.id !== sizeToDelete.id));
        onSizesChange(selectedSizes.filter(s => s.name !== sizeToDelete.name));
        toast.success('Tamanho deletado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar tamanho');
      }
    } catch (error) {
      toast.error('Erro ao deletar tamanho');
    } finally {
      setShowDeleteSizeModal(false);
      setSizeToDelete(null);
    }
  };

  const handleColorClick = (color: Color) => {
    const isSelected = selectedColors.some(c => c.name === color.name);
    if (isSelected) {
      onColorsChange(selectedColors.filter(c => c.name !== color.name));
    } else {
      onColorsChange([...selectedColors, color]);
    }
  };

  const handleSizeClick = (size: Size) => {
    const isSelected = selectedSizes.some(s => s.name === size.name);
    if (isSelected) {
      onSizesChange(selectedSizes.filter(s => s.name !== size.name));
    } else {
      onSizesChange([...selectedSizes, size]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Switches de Habilitação */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={colorsEnabled}
              onChange={(e) => onColorsEnabledChange?.(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Habilitar Cores</span>
          </label>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sizesEnabled}
              onChange={(e) => onSizesEnabledChange?.(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Habilitar Tamanhos</span>
          </label>
        </div>
      </div>

      {/* Cores */}
      {colorsEnabled && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Cores Disponíveis
            </h3>
            <button
              type="button"
              onClick={() => setShowColorModal(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3 h-3" />
              Adicionar Cor
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {availableColors.map((color) => {
              const isSelected = selectedColors.some(c => c.name === color.name);
              
              return (
                <div
                  key={color.name}
                  className={`
                    relative flex items-center justify-between p-2 rounded-lg border-2 text-xs font-medium transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <button
                    type="button"
                    onClick={() => handleColorClick(color)}
                    className="flex items-center gap-2 flex-1"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <span>{color.name}</span>
                  </button>
                  
                  {/* Botões de ação */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingColor(color);
                        setShowEditColorModal(true);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar cor"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteColor(color)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Deletar cor"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedColors.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-medium mb-2">Cores Selecionadas:</p>
              <div className="flex flex-wrap gap-2">
                {selectedColors.map((color) => (
                  <span
                    key={color.name}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    {color.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tamanhos */}
      {sizesEnabled && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Tamanhos Disponíveis
            </h3>
            <button
              type="button"
              onClick={() => setShowSizeModal(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3 h-3" />
              Adicionar Tamanho
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {availableSizes.map((size) => {
              const isSelected = selectedSizes.some(s => s.name === size.name);
              
              return (
                <div
                  key={size.name}
                  className={`
                    relative flex items-center justify-between px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <button
                    type="button"
                    onClick={() => handleSizeClick(size)}
                    className="flex-1 text-left"
                  >
                    {size.name}
                  </button>
                  
                  {/* Botões de ação */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSize(size);
                        setShowEditSizeModal(true);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar tamanho"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSize(size)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Deletar tamanho"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSizes.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700 font-medium mb-2">Tamanhos Selecionados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSizes.map((size) => (
                  <span
                    key={size.name}
                    className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                  >
                    {size.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Adicionar Cor */}
      {showColorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Adicionar Cor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Cor
                </label>
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Vermelho"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Hexadecimal
                </label>
                <input
                  type="color"
                  value={newColor.hex_code}
                  onChange={(e) => setNewColor({ ...newColor, hex_code: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowColorModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Tamanho */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Adicionar Tamanho</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Tamanho
                </label>
                <input
                  type="text"
                  value={newSize.name}
                  onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Grande"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Tamanho
                </label>
                <input
                  type="text"
                  value={newSize.value}
                  onChange={(e) => setNewSize({ ...newSize, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: G"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addSize}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cor */}
      {showEditColorModal && editingColor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Editar Cor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Cor
                </label>
                <input
                  type="text"
                  value={editingColor.name}
                  onChange={(e) => setEditingColor({ ...editingColor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Hexadecimal
                </label>
                <input
                  type="color"
                  value={editingColor.hex_code}
                  onChange={(e) => setEditingColor({ ...editingColor, hex_code: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowEditColorModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={editColor}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Tamanho */}
      {showEditSizeModal && editingSize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Editar Tamanho</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Tamanho
                </label>
                <input
                  type="text"
                  value={editingSize.name}
                  onChange={(e) => setEditingSize({ ...editingSize, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Tamanho
                </label>
                <input
                  type="text"
                  value={editingSize.value}
                  onChange={(e) => setEditingSize({ ...editingSize, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowEditSizeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={editSize}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Deletar Cor */}
      {showDeleteColorModal && colorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja deletar a cor <strong>"{colorToDelete.name}"</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteColorModal(false);
                  setColorToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteColor}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Deletar Tamanho */}
      {showDeleteSizeModal && sizeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja deletar o tamanho <strong>"{sizeToDelete.name}"</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteSizeModal(false);
                  setSizeToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteSize}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
