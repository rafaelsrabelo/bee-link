'use client';

import type { PromotionFormData, PromotionWithDetails } from '@/types/promotions';
import { Calendar, Clock, Edit, FolderOpen, Package, Plus, Tag, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import ConfirmModal from './confirm-modal';

interface PromotionsManagerProps {
  storeSlug: string;
  onPromotionChange?: () => void;
}

export default function PromotionsManager({ storeSlug, onPromotionChange }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState<PromotionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionWithDetails | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<PromotionWithDetails | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_value: 0,
    max_discount: undefined,
    usage_limit: undefined,
    is_active: true,
    start_date: '',
    end_date: '',
    days_of_week: [],
    start_time: '',
    end_time: '',
    product_ids: [],
    category_ids: [],
    coupon_codes: [],
  });

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ];

  useEffect(() => {
    loadPromotions();
  }, [storeSlug]);

  const loadPromotions = async () => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}/promotions`);
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim()) {
      alert('Nome da promoção é obrigatório');
      return;
    }
    
    if (formData.discount_value <= 0) {
      alert('Valor do desconto deve ser maior que zero');
      return;
    }
    
    if (formData.min_order_value < 0) {
      alert('Valor mínimo do pedido não pode ser negativo');
      return;
    }
    
    // Validar se há pelo menos um cupom
    const validCoupons = formData.coupon_codes.filter(code => code.trim() !== '');
    if (validCoupons.length === 0) {
      alert('Adicione pelo menos um código de cupom');
      return;
    }
    
    try {
      const url = editingPromotion 
        ? `/api/stores/${storeSlug}/promotions/${editingPromotion.id}`
        : `/api/stores/${storeSlug}/promotions`;
      
      const method = editingPromotion ? 'PUT' : 'POST';
      
      // Filtrar cupons vazios antes de enviar
      const dataToSend = {
        ...formData,
        coupon_codes: formData.coupon_codes.filter(code => code.trim() !== '')
      };
      
      // Log para debug
      console.log('Enviando dados:', dataToSend);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingPromotion(null);
        resetForm();
        loadPromotions();
        onPromotionChange?.();
      } else {
        const error = await response.json();
        console.error('Erro da API:', error);
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
      alert('Erro ao salvar promoção');
    }
  };

  const handleEdit = (promotion: PromotionWithDetails) => {
    console.log('🔍 Debug - Dados da promoção para editar:', promotion);
    
    setEditingPromotion(promotion);
    
    // Formatar datas para datetime-local
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:MM
      } catch (error) {
        console.error('Erro ao formatar data:', dateString, error);
        return '';
      }
    };
    
    const formDataToSet = {
      name: promotion.name,
      description: promotion.description || '',
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      min_order_value: promotion.min_order_value,
      max_discount: promotion.max_discount || undefined,
      usage_limit: promotion.usage_limit || undefined,
      is_active: promotion.is_active,
      start_date: formatDateForInput(promotion.start_date || null),
      end_date: formatDateForInput(promotion.end_date || null),
      days_of_week: promotion.days_of_week || [],
      start_time: promotion.start_time || '',
      end_time: promotion.end_time || '',
      product_ids: promotion.products?.map(p => p.product_id) || [],
      category_ids: promotion.categories?.map(c => c.category_id) || [],
      coupon_codes: promotion.coupons?.length > 0 
        ? promotion.coupons.map(c => c.code)
        : [],
    };
    
    console.log('🔍 Debug - FormData configurado:', formDataToSet);
    
    setFormData(formDataToSet);
    setShowForm(true);
  };

  const handleDeleteClick = (promotion: PromotionWithDetails) => {
    setPromotionToDelete(promotion);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return;

    try {
      const response = await fetch(`/api/stores/${storeSlug}/promotions/${promotionToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadPromotions();
        onPromotionChange?.();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir promoção:', error);
      alert('Erro ao excluir promoção');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_value: 0,
      max_discount: undefined,
      usage_limit: undefined,
      is_active: true,
      start_date: '',
      end_date: '',
      days_of_week: [],
      start_time: '',
      end_time: '',
      product_ids: [],
      category_ids: [],
      coupon_codes: [],
    });
  };

  const addCouponCode = () => {
    setFormData(prev => ({
      ...prev,
      coupon_codes: [...prev.coupon_codes, ''],
    }));
  };

  const removeCouponCode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coupon_codes: prev.coupon_codes.filter((_, i) => i !== index),
    }));
  };

  const updateCouponCode = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      coupon_codes: prev.coupon_codes.map((code, i) => i === index ? value : code),
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const formatDiscount = (promotion: PromotionWithDetails) => {
    if (promotion.discount_type === 'percentage') {
      return `${promotion.discount_value}%`;
    }
    return `R$ ${promotion.discount_value.toFixed(2)}`;
  };

  const getStatusBadge = (promotion: PromotionWithDetails) => {
    const now = new Date();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;

    if (!promotion.is_active) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inativa</span>;
    }

    if (startDate && now < startDate) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Aguardando</span>;
    }

    if (endDate && now > endDate) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Expirada</span>;
    }

    return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Ativa</span>;
  };

  const getOrdersWithCoupon = (promotion: PromotionWithDetails) => {
    // Contar pedidos únicos que usaram cupons desta promoção
    const orderIds = new Set<string>();
    
    promotion.coupons?.forEach(coupon => {
      coupon.coupon_usage?.forEach(usage => {
        if (usage.order_id) {
          orderIds.add(usage.order_id);
        }
      });
    });
    
    return orderIds.size;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando promoções...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promoções</h2>
          <p className="text-gray-600">Gerencie cupons e promoções da sua loja</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPromotion(null);
            resetForm();
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Promoção
        </button>
      </div>

      {/* Lista de Promoções */}
      {promotions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promoção criada</h3>
          <p className="text-gray-600 mb-4">Crie sua primeira promoção para começar a oferecer descontos</p>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingPromotion(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar Promoção
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {promotions.map((promotion) => (
            <div key={promotion.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{promotion.name}</h3>
                  {promotion.description && (
                    <p className="text-gray-600 mt-1">{promotion.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(promotion)}
                  <button
                    onClick={() => handleEdit(promotion)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(promotion)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Desconto:</span>
                  <div className="font-medium text-green-600">{formatDiscount(promotion)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Valor mínimo:</span>
                  <div className="font-medium">R$ {promotion.min_order_value.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Cupons:</span>
                  <div className="font-medium">{promotion.coupons.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Pedidos com cupom:</span>
                  <div className="font-medium">{getOrdersWithCoupon(promotion)}</div>
                </div>
              </div>

              {/* Cupons */}
              {promotion.coupons.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Cupons:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {promotion.coupons.map((coupon) => (
                      <span
                        key={coupon.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-mono"
                      >
                        {coupon.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Período */}
              {(promotion.start_date || promotion.end_date) && (
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {promotion.start_date && new Date(promotion.start_date).toLocaleDateString()}
                  {promotion.start_date && promotion.end_date && ' - '}
                  {promotion.end_date && new Date(promotion.end_date).toLocaleDateString()}
                </div>
              )}

              {/* Horário */}
              {(promotion.start_time || promotion.end_time) && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {promotion.start_time && promotion.start_time}
                  {promotion.start_time && promotion.end_time && ' - '}
                  {promotion.end_time && promotion.end_time}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Promoção *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Desconto *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discount_type: e.target.value as 'percentage' | 'fixed' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor do Desconto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discount_value: Number.parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Mínimo do Pedido
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      min_order_value: Number.parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desconto Máximo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_discount: e.target.value ? Number.parseFloat(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              {/* Período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Horário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Fim
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Dias da Semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias da Semana
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        formData.days_of_week.includes(day.value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cupons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Códigos dos Cupons
                </label>
                <div className="space-y-2">
                  {formData.coupon_codes.length === 0 ? (
                    <div className="text-sm text-gray-500 italic">
                      Nenhum cupom adicionado. Clique em &quot;Adicionar Cupom&quot; para criar um.
                    </div>
                  ) : (
                    formData.coupon_codes.map((code, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => updateCouponCode(index, e.target.value)}
                          placeholder="Ex: DESCONTO10"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => removeCouponCode(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={addCouponCode}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Adicionar Cupom
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Promoção ativa</span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPromotion ? 'Atualizar' : 'Criar'} Promoção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Promoção"
        message={`Tem certeza que deseja excluir a promoção &quot;${promotionToDelete?.name}&quot;? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
