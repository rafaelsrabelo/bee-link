'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Edit, Eye, EyeOff, Package, Plus, Settings, Trash2, X, Store, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import DeleteModal from '../../../../components/ui/delete-modal';
import LottieLoader from '../../../../components/ui/lottie-loader';
import DotsLoading from '../../../../components/ui/dots-loading';
import MobileImageUpload from '../../../../components/ui/mobile-image-upload';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AdminHeader from '../../../../components/ui/admin-header';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  description: string;
  readyToShip?: boolean;
  available?: boolean;
  store_id?: string;
}

interface Store {
  id: string;
  store_name: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  user_id: string;
}

export default function ProductsPage({ params }: { params: { slug: string } }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: ''
  });
  const [loading, setLoading] = useState(true);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: '',
    image: '',
    category: 'bag',
    description: '',
    readyToShip: false,
    available: true
  });

  const { user } = useAuth();
  const router = useRouter();
  const { slug } = use(params);

  // Verificar se todos os campos obrigatórios estão preenchidos
  const isFormValid = Boolean(
    newProduct.name?.trim() && 
    newProduct.price?.trim() && 
    (newProduct.image || selectedImage) && // Aceita imagem enviada OU selecionada
    newProduct.description?.trim()
  );



  // Carregar dados da loja e produtos
  useEffect(() => {
    if (user) {
      loadStoreAndProducts();
    }
  }, [user, slug]);



  const loadStoreAndProducts = async () => {
    setLoading(true);
    try {
      // Carregar dados da loja
      const storeResponse = await fetch(`/api/stores/${slug}`);
      if (!storeResponse.ok) {
        toast.error('Loja não encontrada');
        router.push('/create-store');
        return;
      }
      const storeData = await storeResponse.json();
      setStore(storeData);

      // Verificar se o usuário é dono da loja
      if (storeData.user_id !== user?.id) {
        toast.error('Você não tem permissão para acessar esta loja');
        router.push('/');
        return;
      }

      // Carregar produtos da loja
      const productsResponse = await fetch(`/api/stores/${slug}/products`);
      if (productsResponse.ok) {
        const apiProducts = await productsResponse.json();
        setProducts(apiProducts || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProductsLoaded(true);
      }, 500);
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      const response = await fetch(`/api/stores/${slug}/products`, {
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
      toast.error('Erro ao salvar produtos');
    }
  };

  const handleImageUpload = async (file: File) => {
    setSelectedImage(file); // Salva a imagem selecionada imediatamente
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewProduct(prev => ({ ...prev, image: data.imageUrl }));
        setSelectedImage(null); // Limpa a imagem selecionada
        toast.success('Imagem enviada com sucesso!');
      } else {
        throw new Error('Erro ao enviar imagem');
      }
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem');
      setSelectedImage(null); // Limpa em caso de erro
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditImageUpload = async (file: File) => {
    setUploadingEditImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setEditingProduct(prev => prev ? { ...prev, image: data.url } : null);
        toast.success('Imagem enviada com sucesso!');
      } else {
        throw new Error('Erro ao enviar imagem');
      }
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!isFormValid) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name!,
      price: newProduct.price!,
      image: newProduct.image!,
      category: newProduct.category!,
      description: newProduct.description!,
      readyToShip: newProduct.readyToShip || false,
      available: newProduct.available !== false,
      store_id: store?.id
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
    toast.success('Produto adicionado com sucesso!');
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
    toast.success('Produto atualizado com sucesso!');
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    setDeleteModal({
      isOpen: true,
      productId: id,
      productName: product?.name || ''
    });
  };

  const confirmDeleteProduct = async () => {
    if (!deleteModal.productId) return;

    const updatedProducts = products.filter(p => p.id !== deleteModal.productId);
    await saveProducts(updatedProducts);

    setDeleteModal({ isOpen: false, productId: null, productName: '' });
    toast.success('Produto deletado com sucesso!');
  };

  const toggleAvailability = async (id: string) => {
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, available: !p.available } : p
    );
    await saveProducts(updatedProducts);
    toast.success('Disponibilidade atualizada!');
  };

  const handleReset = async () => {
    setDeleteModal({
      isOpen: true,
      productId: 'all',
      productName: 'todos os produtos'
    });
  };

  const confirmReset = async () => {
    await saveProducts([]);
    setDeleteModal({ isOpen: false, productId: null, productName: '' });
    toast.success('Todos os produtos foram removidos!');
  };

  if (loading || !store) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
          <LottieLoader 
            animationData={loadingAnimation}
            size={200}
            text="Carregando..."
          />
        </div>
      </ProtectedRoute>
    );
  }

  const availableProducts = products.filter(p => p.available);
  const unavailableProducts = products.filter(p => !p.available);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <AdminHeader
          store={store}
          currentPage="products"
          title="Gerenciar Produtos"
          subtitle={`${store.store_name} - Gerencie seus produtos`}
          icon={Package}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: store.colors.primary }}>
              <div className="flex items-center">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${store.colors.primary}10` }}>
                  <Package className="w-6 h-6" style={{ color: store.colors.primary }} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                  <p className="text-2xl font-bold" style={{ color: store.colors.primary }}>{products.length}</p>
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
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: store.colors.accent }}>
              <div className="flex items-center">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${store.colors.accent}10` }}>
                  <Package className="w-6 h-6" style={{ color: store.colors.accent }} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pronta Entrega</p>
                  <p className="text-2xl font-bold" style={{ color: store.colors.accent }}>{products.filter(p => p.readyToShip).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setTimeout(() => {
                  const formElement = document.getElementById('add-product-form');
                  if (formElement) {
                    formElement.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }
                }, 100);
              }}
              className="text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              style={{ backgroundColor: `${store.colors.accent}CC` }}
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Produto</span>
            </button>
            <button
              onClick={handleReset}
              type="button"
              className="bg-red-500/80 hover:bg-red-500 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <Trash2 className="w-5 h-5 inline mr-2" />
              Limpar Produtos
            </button>
          </div>

          {/* Products List */}
          {!productsLoaded ? (
            <div className="flex justify-center py-12">
              <LottieLoader 
                animationData={loadingAnimation}
                size={150}
                text="Carregando produtos..."
              />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Adicione seu primeiro produto para começar a vender.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                style={{ backgroundColor: `${store.colors.primary}CC` }}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Adicionar Primeiro Produto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                  <div className="relative h-48 bg-gray-100">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => toggleAvailability(product.id)}
                        className={`p-1 rounded-full ${
                          product.available 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {product.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                      <span className="text-lg font-bold" style={{ color: store.colors.primary }}>
                        R$ {product.price}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {product.category}
                      </span>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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

          {/* Add Product Form */}
          {showAddForm && (
            <div id="add-product-form" className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Adicionar Novo Produto</h2>
                <button
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="text"
                      value={newProduct.price}
                      onChange={(e) => {
                        // Remover tudo exceto números
                        const value = e.target.value.replace(/[^\d]/g, '');
                        // Converter para centavos e formatar
                        const cents = parseInt(value) || 0;
                        const reais = Math.floor(cents / 100);
                        const centavos = cents % 100;
                        const formatted = `${reais},${centavos.toString().padStart(2, '0')}`;
                        setNewProduct({...newProduct, price: formatted});
                      }}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Digite apenas números (ex: 41,99)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                  <MobileImageUpload
                    onImageSelect={handleImageUpload}
                    currentImage={newProduct.image}
                    disabled={uploadingImage}
                    loading={uploadingImage}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newProduct.readyToShip}
                      onChange={(e) => setNewProduct({...newProduct, readyToShip: e.target.checked})}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pronta Entrega</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newProduct.available}
                      onChange={(e) => setNewProduct({...newProduct, available: e.target.checked})}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                  disabled={!isFormValid}
                  className="px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: store.colors.primary }}
                >
                  {isFormValid ? 'Adicionar Produto' : 'Preencha todos os campos'}
                </button>
              </div>
            </div>
          )}

          {/* Edit Product Form */}
          {isEditing && editingProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Editar Produto</h2>
                  <button
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <input
                        type="text"
                        value={editingProduct.price}
                        onChange={(e) => {
                          // Remover tudo exceto números
                          const value = e.target.value.replace(/[^\d]/g, '');
                          // Converter para centavos e formatar
                          const cents = parseInt(value) || 0;
                          const reais = Math.floor(cents / 100);
                          const centavos = cents % 100;
                          const formatted = `${reais},${centavos.toString().padStart(2, '0')}`;
                          setEditingProduct({...editingProduct, price: formatted});
                        }}
                        placeholder="0,00"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                    <MobileImageUpload
                      onImageSelect={handleEditImageUpload}
                      currentImage={editingProduct.image}
                      disabled={uploadingEditImage}
                      loading={uploadingEditImage}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProduct.readyToShip}
                        onChange={(e) => setEditingProduct({...editingProduct, readyToShip: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pronta Entrega</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProduct.available}
                        onChange={(e) => setEditingProduct({...editingProduct, available: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                    className="px-6 py-2 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: store.colors.primary }}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Deletar */}
          <DeleteModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, productId: null, productName: '' })}
            onConfirm={deleteModal.productId === 'all' ? confirmReset : confirmDeleteProduct}
            title={deleteModal.productId === 'all' ? 'Limpar Todos os Produtos' : 'Deletar Produto'}
            message={deleteModal.productId === 'all' 
              ? 'Tem certeza que deseja limpar todos os produtos? Isso removerá todos os produtos adicionados via admin.'
              : 'Tem certeza que deseja deletar o produto'
            }
            itemName={deleteModal.productName}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
} 