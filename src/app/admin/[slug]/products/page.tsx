'use client';

import { Edit, Eye, EyeOff, FolderPlus, MousePointer, Package, Plus, ShoppingCart, Star, Tag, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import loadingAnimation from '../../../../../public/animations/loading-dots-blue.json';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AddProductModal from '../../../../components/ui/add-product-modal';
import AdminHeader from '../../../../components/ui/admin-header';
import CategoriesManager from '../../../../components/ui/categories-manager';
import CreateStoreCategoryModal from '../../../../components/ui/create-store-category-modal';
import DeleteModal from '../../../../components/ui/delete-modal';
import LottieLoader from '../../../../components/ui/lottie-loader';
import MobileImageUpload from '../../../../components/ui/mobile-image-upload';
import ProductCategorySelector from '../../../../components/ui/product-category-selector';
import PromotionsManager from '../../../../components/ui/promotions-manager';
import { useAuth } from '../../../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  category_id?: number;
  category_data?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
  };
  description: string;
  readyToShip?: boolean;
  available?: boolean;
  store_id?: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    header: string;
  };
  user_id: string;
}

export default function ProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [analytics, setAnalytics] = useState<{
    top_products: Array<{
      product_id: string;
      product_name: string;
      clicks: number;
      rank: number;
    }>;
    top_cart_products: Array<{
      product_id: string;
      product_name: string;
      cart_clicks: number;
      rank: number;
    }>;
  } | null>(null);
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
    category: 'Geral',
    category_id: undefined,
    description: '',
    readyToShip: false,
    available: true
  });
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);
  const [categoriesRefreshKey, setCategoriesRefreshKey] = useState(0);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Função para buscar nome da categoria pelo ID
  const getCategoryNameById = async (categoryId: number): Promise<string> => {
    try {
      const response = await fetch(`/api/stores/${slug}/product-categories`);
      if (response.ok) {
        const categories = await response.json();
        console.log('Categorias carregadas:', categories);
        console.log('Procurando categoria com ID:', categoryId);
        
        const category = categories.find((cat: { id: number; name: string }) => cat.id === categoryId);
        console.log('Categoria encontrada:', category);
        
        if (category?.name) {
          return category.name;
        }
        
        console.warn('Categoria não encontrada, usando fallback');
        return 'Geral';
      }
      
      console.error('Erro na resposta da API:', response.status, response.statusText);
      return 'Geral';
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return 'Geral';
    }
  };

  // Função para forçar refresh das categorias
  const refreshCategories = () => {
    setCategoriesRefreshKey(prev => prev + 1);
    // Reset da categoria selecionada no formulário para evitar estado inconsistente
    if (newProduct.category === 'selected') {
      setNewProduct(prev => ({
        ...prev,
        category_id: undefined,
        category: 'Geral' // Reset para valor padrão
      }));
    }
  };

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



  // Carregar tudo de uma vez
  useEffect(() => {
    if (user && slug) {
      loadStoreAndProducts();
    }
  }, [user, slug]);

  const loadStoreAndProducts = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      
      // Carregar analytics
      await loadAnalytics();
      
      // Carregar loja diretamente
      const storeResponse = await fetch(`/api/stores/${slug}`);
      if (!storeResponse.ok) {
        toast.error('Loja não encontrada');
        router.push('/create-store');
        return;
      }
      const storeData = await storeResponse.json();
      
      // Verificar permissão
      if (storeData.user_id !== user?.id) {
        toast.error('Você não tem permissão para acessar esta loja');
        router.push('/');
        return;
      }
      
      // Definir a loja no estado local
      setStore(storeData);
      
      // Carregar produtos
      await loadProducts();
    } catch (error) {
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProductsLoaded(true);
      }, 500);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/stores/${slug}/analytics?period=30d`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch {
    }
  };

  const loadProducts = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      // Carregar produtos da loja
      const productsResponse = await fetch(`/api/stores/${slug}/products`);
      if (productsResponse.ok) {
        const apiProducts = await productsResponse.json();
        setProducts(apiProducts || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProductsLoaded(true);
      }, 500);
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    if (!slug) return;
    
    setProducts(newProducts);
    try {
      const response = await fetch(`/api/stores/${slug}/products/bulk`, {
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
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!isFormValid || savingProduct) {
      if (!isFormValid) toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSavingProduct(true);
    try {
      // Buscar nome real da categoria
      let categoryName = 'Geral'; // Default
      
      console.log('Debug categoria:', {
        category: newProduct.category,
        category_id: newProduct.category_id
      });
      
      if (newProduct.category_id) {
        // Se tem category_id, buscar o nome real da categoria
        try {
          categoryName = await getCategoryNameById(newProduct.category_id);
          console.log('Categoria encontrada pelo ID:', categoryName);
        } catch (error) {
          console.error('Erro ao buscar categoria:', error);
          categoryName = 'Geral'; // Fallback
        }
      } else if (newProduct.category && newProduct.category !== 'selected' && newProduct.category !== 'Geral') {
        // Se não tem category_id mas tem category (e não é 'selected' nem 'Geral'), usar o valor
        categoryName = newProduct.category;
        console.log('Usando categoria direta:', categoryName);
      }
      
      console.log('Categoria final:', categoryName);

      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name || '',
        price: newProduct.price || '',
        image: newProduct.image || '',
        category: categoryName,
        category_id: newProduct.category_id || undefined,
        description: newProduct.description || '',
        readyToShip: newProduct.readyToShip || false,
        available: newProduct.available !== false,
        store_id: store?.id
      };

      // Usar API específica para CREATE - NÃO deleta todos os produtos!
      const response = await fetch(`/api/stores/${slug}/products`, {
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

      // Adicionar apenas localmente - não recarregar todos
      setProducts([...products, savedProduct]);

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

      setShowAddForm(false);
      toast.success('Produto adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error('Erro ao salvar produto:', error);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setIsEditing(product.id);
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || savingEdit) return;

    setSavingEdit(true);
    try {
      // Buscar nome real da categoria se foi selecionada uma categoria personalizada
      let categoryName = editingProduct.category;
      if (editingProduct.category === 'selected' && editingProduct.category_id) {
        try {
          categoryName = await getCategoryNameById(editingProduct.category_id);
          console.log('Categoria encontrada para edição:', categoryName);
        } catch (error) {
          console.error('Erro ao buscar categoria:', error);
          categoryName = 'Geral'; // Fallback
        }
      } else if (editingProduct.category === 'Geral') {
        // Se a categoria é 'Geral', manter como está
        categoryName = 'Geral';
      }

      // Remover campos que não existem na tabela products
      const { category_data, ...productWithoutCategoryData } = editingProduct;
      
      const updatedProduct = {
        ...productWithoutCategoryData,
        category: categoryName,
        category_id: editingProduct.category_id || undefined
      };

      console.log('Produto a ser atualizado:', updatedProduct);

      // Usar API específica para UPDATE - NÃO deleta todos os produtos!
      const response = await fetch(`/api/stores/${slug}/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar produto');
      }

      const savedProduct = await response.json();

      // Atualizar apenas localmente - não recarregar todos
      const updatedProducts = products.map(p => 
        p.id === editingProduct.id ? savedProduct : p
      );
      setProducts(updatedProducts);

      setIsEditing(null);
      setEditingProduct(null);
      toast.success('Produto atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar produto');
      console.error('Erro ao atualizar produto:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditingProduct(null);
    setSavingEdit(false); // Reset loading state
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

    try {
      // Usar API específica para DELETE - NÃO deleta todos os produtos!
      const response = await fetch(`/api/stores/${slug}/products?id=${deleteModal.productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar produto');
      }

      // Remover apenas localmente - não recarregar todos
      const updatedProducts = products.filter(p => p.id !== deleteModal.productId);
      setProducts(updatedProducts);

      setDeleteModal({ isOpen: false, productId: null, productName: '' });
      toast.success('Produto deletado com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar produto');
      console.error('Erro ao deletar produto:', error);
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;

      // Remover campos que não existem na tabela products
      const { category_data, ...productWithoutCategoryData } = product;
      const updatedProduct = { ...productWithoutCategoryData, available: !product.available };

      // Usar API específica para UPDATE
      const response = await fetch(`/api/stores/${slug}/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar disponibilidade');
      }

      const savedProduct = await response.json();

      // Atualizar apenas localmente
      const updatedProducts = products.map(p => 
        p.id === id ? savedProduct : p
      );
      setProducts(updatedProducts);

      toast.success('Disponibilidade atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar disponibilidade');
      console.error('Erro ao atualizar disponibilidade:', error);
    }
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





                const getProductClicks = (productId: string) => {
                if (!analytics?.top_products) return 0;
                const product = analytics.top_products.find((p) => p.product_id === productId);
                return product?.clicks || 0;
              };

              const getProductCartClicks = (productId: string) => {
                if (!analytics?.top_cart_products) return 0;
                const product = analytics.top_cart_products.find((p) => p.product_id === productId);
                return product?.cart_clicks || 0;
              };
            
              const isMostClickedProduct = (productId: string) => {
                if (!analytics?.top_products || analytics.top_products.length === 0) return false;
                return analytics.top_products[0]?.product_id === productId;
              };

              const isMostCartClickedProduct = (productId: string) => {
                if (!analytics?.top_cart_products || analytics.top_cart_products.length === 0) return false;
                return analytics.top_cart_products[0]?.product_id === productId;
              };

  if (loading || !store) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
          <LottieLoader 
            animationData={loadingAnimation}
            size="lg"
            text="Carregando..."
            color="#8B5CF6"
          />
        </div>
      </ProtectedRoute>
    );
  }



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <AdminHeader
          store={store}
          currentPage="products"
          title="Gerenciar Produtos"
          icon={Package}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Section Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div 
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                activeTab === 'products'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setActiveTab('products')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  activeTab === 'products' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
                  <p className="text-sm text-gray-600">Gerencie seus produtos</p>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                activeTab === 'promotions'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setActiveTab('promotions')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  activeTab === 'promotions' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Promoções</h3>
                  <p className="text-sm text-gray-600">Crie cupons e promoções</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Only show for products tab */}
          {activeTab === 'products' && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="w-full sm:w-auto text-white bg-blue-600 px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              style={{ backgroundColor: store?.colors?.primary || '#3B82F6' }}
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Produto</span>
            </button>
            <button
              onClick={handleReset}
              type="button"
              className="w-full sm:w-auto bg-red-500/80 hover:bg-red-500 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <Trash2 className="w-5 h-5" />
              <span>Limpar Produtos</span>
            </button>
            <button
              onClick={() => setShowCreateCategoryModal(true)}
              type="button"
              className="w-full sm:w-auto bg-green-500/80 hover:bg-green-500 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <FolderPlus className="w-5 h-5" />
              <span>Criar Categoria</span>
            </button>
            <button
              onClick={() => setShowCategoriesManager(true)}
              type="button"
              className="w-full sm:w-auto bg-purple-500/80 hover:bg-purple-500 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <Edit className="w-5 h-5" />
              <span>Gerenciar Categorias</span>
            </button>
          </div>
          )}

          {/* Tab Content */}
          {activeTab === 'products' && (
            <>
              {/* Products List */}
              {!productsLoaded ? (
            <div className="flex justify-center py-12">
              <LottieLoader 
                animationData={loadingAnimation}
                size="lg"
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

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className={`bg-white rounded-xl shadow-md overflow-hidden border ${
                    product.available 
                      ? 'border-gray-100' 
                      : 'border-red-300 border-dashed'
                  }`}
                >
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
                        type="button"
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
                      <h3 className={`font-semibold truncate ${
                        product.available ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {product.name}
                      </h3>
                      <span className="text-lg font-bold" style={{ color: store.colors.primary }}>
                        R$ {product.price}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-3 line-clamp-2 ${
                      product.available ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {product.description}
                    </p>
                    
                    <div className="mb-3 flex flex-wrap gap-2">
                      {product.available ? (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                          Disponível
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          Indisponível
                        </span>
                      )}
                      
                      {product.readyToShip && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          Disponível para entrega
                        </span>
                      )}

                                              {/* Analytics info */}
                        {!analytics ? (
                          <div className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">
                            <div className="animate-pulse bg-gray-200 h-3 w-8 rounded" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                            <MousePointer className="w-3 h-3" />
                            <span>{getProductClicks(product.id)} cliques</span>
                            {isMostClickedProduct(product.id) && (
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        )}
                        
                        {/* Cart Analytics info */}
                        {!analytics ? (
                          <div className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">
                            <div className="animate-pulse bg-gray-200 h-3 w-8 rounded" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            <ShoppingCart className="w-3 h-3" />
                            <span>{getProductCartClicks(product.id)} carrinho</span>
                            {isMostCartClickedProduct(product.id) && (
                              <ShoppingCart className="w-3 h-3 text-red-500 fill-red-500" />
                            )}
                          </div>
                        )}
                        
                        {analytics && isMostClickedProduct(product.id) && (
                          <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                            ⭐ Mais clicado
                          </span>
                        )}

                        {analytics && isMostCartClickedProduct(product.id) && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            🛒 Mais carrinho
                          </span>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {typeof product.category === 'string' ? product.category : 'Categoria'}
                      </span>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(product)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
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
                        const cents = Number.parseInt(value) || 0;
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
                  <ProductCategorySelector
                    key={categoriesRefreshKey} // Força re-render quando categorias mudam
                    value={newProduct.category_id}
                    onChange={(categoryId) => {
                      console.log('Categoria selecionada no formulário:', categoryId);
                      setNewProduct({
                        ...newProduct, 
                        category_id: categoryId,
                        category: 'selected'
                      });
                    }}
                    placeholder="Selecionar categoria"
                    storeSlug={slug || ''}
                    colors={store?.colors}
                  />
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
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!isFormValid || savingProduct}
                  className="w-full sm:w-auto px-6 py-3 text-black bg-blue-600 rounded-lg  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg order-1 sm:order-2"
                >
                  {savingProduct ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Salvando...
                    </div>
                  ) : (
                    isFormValid ? 'Adicionar Produto' : 'Preencha todos os campos'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSavingProduct(false); // Reset loading state
                  }}
                  className="w-full sm:w-auto px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium order-2 sm:order-1"
                >
                  Cancelar
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
                          const cents = Number.parseInt(value) || 0;
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
                    <ProductCategorySelector
                      key={categoriesRefreshKey} // Força re-render quando categorias mudam
                      value={editingProduct.category_id}
                      onChange={(categoryId) => {
                        console.log('Categoria selecionada na edição:', categoryId);
                        setEditingProduct({
                          ...editingProduct, 
                          category_id: categoryId,
                          category: 'selected'
                        });
                      }}
                      placeholder="Selecionar categoria"
                      storeSlug={slug || ''}
                      colors={store?.colors}
                    />
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
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="w-full sm:w-auto px-6 py-3 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: store?.colors?.primary || '#8B5CF6' }}
                  >
                    {savingEdit ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Salvando...
                      </div>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full sm:w-auto px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium order-2 sm:order-1"
                  >
                    Cancelar
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

          {/* Modal de Criar Categoria */}
          <CreateStoreCategoryModal
            isOpen={showCreateCategoryModal}
            onClose={() => setShowCreateCategoryModal(false)}
            onCategoryCreated={() => {
              // Fechar modal
              setShowCreateCategoryModal(false);
              // Força refresh das categorias
              refreshCategories();
            }}
            storeSlug={slug || ''}
            colors={store?.colors}
          />
          
          {/* Modal de Gerenciar Categorias */}
          {showCategoriesManager && (
            <CategoriesManager
              storeSlug={slug || ''}
              onClose={() => {
                setShowCategoriesManager(false);
                refreshCategories(); // Força refresh das categorias
              }}
            />
          )}

          {/* Modal de Adicionar Produto */}
          <AddProductModal
            isOpen={showAddProductModal}
            onClose={() => setShowAddProductModal(false)}
            onProductAdded={(product) => {
              setProducts(prev => [product, ...prev]);
              setShowAddProductModal(false);
            }}
            storeSlug={slug || ''}
            colors={store?.colors}
          />
            </>
          )}

          {/* Promotions Tab */}
          {activeTab === 'promotions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar Promoções</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Crie e gerencie promoções para sua loja. Configure cupons de desconto, 
                  promoções por período, categoria ou produto específico.
                </p>
                <PromotionsManager 
                  storeSlug={slug || ''} 
                  onPromotionChange={() => {
                    // Atualizar se necessário
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 