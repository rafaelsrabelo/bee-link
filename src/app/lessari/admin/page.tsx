"use client";

import { Edit, Eye, EyeOff, Package, Plus, Settings, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  description: string;
  readyToShip?: boolean;
  available?: boolean;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: '',
    image: '',
    category: 'bag',
    description: '',
    readyToShip: false,
    available: true
  });

  // Carregar produtos da API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const apiProducts = await response.json();
          setProducts(apiProducts || []);
        }
      } catch (error) {
        console.error('Erro ao carregar produtos da API:', error);
        setProducts([]);
      }
    };
    
    loadProducts();
  }, []);

  const saveProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProducts),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar produtos');
      }
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      alert('Erro ao salvar produtos. Tente novamente.');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setNewProduct({ ...newProduct, image: result.imageUrl });
      } else {
        const error = await response.json();
        alert(`Erro no upload: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditImageUpload = async (file: File) => {
    if (!file || !editingProduct) return;
    
    setUploadingEditImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setEditingProduct({ ...editingProduct, image: result.imageUrl });
      } else {
        const error = await response.json();
        alert(`Erro no upload: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image || !newProduct.description) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name || '',
      price: newProduct.price || '',
      image: newProduct.image || '',
      category: newProduct.category || 'bag',
      description: newProduct.description || '',
      readyToShip: newProduct.readyToShip || false,
      available: newProduct.available !== false
    };

    const updatedProducts = [...products, product];
    await saveProducts(updatedProducts);
    setNewProduct({
      name: '',
      price: '',
      image: '',
      category: 'bag',
      description: '',
      readyToShip: false,
      available: true
    });
    setShowAddForm(false);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditing(product.id);
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    const updatedProducts = products.map(p =>
      p.id === editingProduct.id ? editingProduct : p
    );
    await saveProducts(updatedProducts);
    setIsEditing(null);
    setEditingProduct(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      const updatedProducts = products.filter(p => p.id !== id);
      await saveProducts(updatedProducts);
    }
  };

  const toggleAvailability = async (id: string) => {
    const updatedProducts = products.map(p =>
      p.id === id ? { ...p, available: !p.available } : p
    );
    await saveProducts(updatedProducts);
  };

  const handleReset = async () => {
    if (confirm('Tem certeza que deseja limpar todos os produtos? Isso removerá todos os produtos adicionados via admin.')) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([]),
        });
        
        if (response.ok) {
          setProducts([]);
        } else {
          alert('Erro ao limpar produtos. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao limpar produtos:', error);
        alert('Erro ao limpar produtos. Tente novamente.');
      }
    }
  };

  const availableProducts = products.filter(p => p.available);
  const unavailableProducts = products.filter(p => !p.available);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#856342] to-[#6B4F35] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Painel Administrativo</h1>
                <p className="text-amber-100 text-sm sm:text-base">Lessari - Gerencie seus produtos</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="bg-[#A67C52] hover:bg-[#856342] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
              <button
                onClick={handleReset}
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="hidden sm:inline">Limpar Produtos</span>
                <span className="sm:hidden">Limpar</span>
              </button>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#856342]">
            <div className="flex items-center">
              <div className="p-2 bg-[#856342]/10 rounded-lg">
                <Package className="w-6 h-6 text-[#856342]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-[#856342]">{products.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">{availableProducts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <EyeOff className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Indisponíveis</p>
                <p className="text-2xl font-bold text-orange-600">{unavailableProducts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#A67C52]">
            <div className="flex items-center">
              <div className="p-2 bg-[#A67C52]/10 rounded-lg">
                <Package className="w-6 h-6 text-[#A67C52]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pronta Entrega</p>
                <p className="text-2xl font-bold text-[#A67C52]">{products.filter(p => p.readyToShip).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#856342]">Adicionar Novo Produto</h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                  placeholder="Ex: Bolsa média alça removível"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço *</label>
                <input
                  type="text"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                  placeholder="Ex: R$ 69,99"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto *</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="text-sm text-blue-600">Fazendo upload da imagem...</div>
                  )}
                  {newProduct.image && (
                    <div className="text-sm text-green-600">
                      ✅ Imagem carregada: {newProduct.image}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                >
                  <option value="bag">Bolsa</option>
                  <option value="accessory">Acessório</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                  placeholder="Descreva o produto..."
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.readyToShip}
                    onChange={(e) => setNewProduct({...newProduct, readyToShip: e.target.checked})}
                    className="rounded border-gray-300 text-[#856342] focus:ring-[#856342]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pronta Entrega</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.available}
                    onChange={(e) => setNewProduct({...newProduct, available: e.target.checked})}
                    className="rounded border-gray-300 text-[#856342] focus:ring-[#856342]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Disponível</span>
                </label>
              </div>
            </div>
            
                         <div className="flex justify-end gap-3 mt-6">
               <button
                 type="button"
                 onClick={() => setShowAddForm(false)}
                 className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
               >
                 Cancelar
               </button>
               <button
                 type="button"
                 onClick={handleAddProduct}
                 className="px-6 py-2 bg-[#856342] text-white rounded-lg hover:bg-[#6B4F35] transition-colors"
               >
                 Adicionar Produto
               </button>
             </div>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#856342] to-[#6B4F35]">
            <h2 className="text-xl font-semibold text-white">Produtos da Loja</h2>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 mx-4 max-w-md mx-auto">
                    <div className="w-20 h-20 bg-[#856342]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-[#856342]" />
                    </div>
                    <h3 className="text-[#856342] text-lg font-medium mb-2">Catálogo Vazio</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Nenhum produto cadastrado ainda.
                    </p>
                    <div className="text-gray-500 text-xs">
                      Clique em &quot;Adicionar Produto&quot; para começar! ✨
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
                        product.available ? 'border-green-200' : 'border-red-200'
                      }`}
                    >
                      <div className="relative">
                        <div className="aspect-square relative overflow-hidden rounded-t-lg">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                          {!product.available && (
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Indisponível
                              </span>
                            </div>
                          )}
                          {product.readyToShip && (
                            <div className="absolute top-2 left-2 bg-[#856342] text-white px-2 py-1 rounded-full text-xs font-medium">
                              Pronta Entrega
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-[#856342] text-lg line-clamp-2">
                              {product.name}
                            </h3>
                            <span className="text-lg font-bold text-[#A67C52]">
                              {product.price}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {product.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              {product.category}
                            </span>
                            {product.readyToShip && (
                              <span className="bg-[#A67C52]/10 text-[#A67C52] px-2 py-1 rounded-full text-xs">
                                Pronta Entrega
                              </span>
                            )}
                          </div>
                          
                                                     <div className="flex gap-2">
                             <button
                               type="button"
                               onClick={() => handleEditProduct(product)}
                               className="flex-1 bg-[#856342] hover:bg-[#6B4F35] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                             >
                               <Edit className="w-4 h-4 inline mr-1" />
                               Editar
                             </button>
                             <button
                               type="button"
                               onClick={() => toggleAvailability(product.id)}
                               className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                 product.available
                                   ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                   : 'bg-green-100 text-green-700 hover:bg-green-200'
                               }`}
                             >
                               {product.available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                             </button>
                             <button
                               type="button"
                               onClick={() => handleDeleteProduct(product.id)}
                               className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-semibold text-[#856342]">Editar Produto</h2>
                 <button
                   type="button"
                   onClick={handleCancelEdit}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                  <input
                    type="text"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleEditImageUpload(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                      disabled={uploadingEditImage}
                    />
                    {uploadingEditImage && (
                      <div className="text-sm text-blue-600">Fazendo upload da imagem...</div>
                    )}
                    {editingProduct.image && (
                      <div className="text-sm text-green-600">
                        ✅ Imagem atual: {editingProduct.image}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                  >
                    <option value="bag">Bolsa</option>
                    <option value="accessory">Acessório</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#856342] focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingProduct.readyToShip}
                      onChange={(e) => setEditingProduct({...editingProduct, readyToShip: e.target.checked})}
                      className="rounded border-gray-300 text-[#856342] focus:ring-[#856342]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pronta Entrega</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingProduct.available}
                      onChange={(e) => setEditingProduct({...editingProduct, available: e.target.checked})}
                      className="rounded border-gray-300 text-[#856342] focus:ring-[#856342]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Disponível</span>
                  </label>
                </div>
              </div>
              
                             <div className="flex justify-end gap-3 mt-6">
                 <button
                   type="button"
                   onClick={handleCancelEdit}
                   className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button
                   type="button"
                   onClick={handleSaveEdit}
                   className="px-6 py-2 bg-[#856342] text-white rounded-lg hover:bg-[#6B4F35] transition-colors"
                 >
                   Salvar Alterações
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 