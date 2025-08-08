import type { PromotionWithDetails } from '@/types/promotions';
import { Calendar, Clock, Edit, Plus, Tag, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmModal from './confirm-modal';

interface PromotionsManagerProps {
  storeSlug: string;
  onPromotionChange?: () => void;
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];

export default function PromotionsManager({ storeSlug, onPromotionChange }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState<PromotionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionWithDetails | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<PromotionWithDetails | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_value: 0,
    max_discount: undefined as number | undefined,
    start_date: '',
    end_date: '',
    days_of_week: [] as number[],
    coupon_codes: [] as string[],
    is_active: true
  });

  useEffect(() => {
    loadPromotions();
  }, [storeSlug]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeSlug}/promotions`);
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.promotions || []);
      } else {
        throw new Error('Falha ao carregar promoções');
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const filteredCouponCodes = formData.coupon_codes.filter(code => code.trim() !== '');
      
      if (filteredCouponCodes.length === 0) {
        toast.error('Adicione pelo menos um código de cupom');
        return;
      }

      const promotionData = {
        name: formData.name,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_value: formData.min_order_value,
        max_discount: formData.max_discount,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        days_of_week: formData.days_of_week,
        is_active: formData.is_active,
        coupon_codes: filteredCouponCodes
      };

      const url = editingPromotion 
        ? `/api/stores/${storeSlug}/promotions/${editingPromotion.id}`
        : `/api/stores/${storeSlug}/promotions`;
      
      const method = editingPromotion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingPromotion(null);
        resetForm();
        loadPromotions();
        onPromotionChange?.();
        toast.success(editingPromotion ? 'Promoção atualizada com sucesso!' : 'Promoção criada com sucesso!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar promoção');
      }
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
      toast.error('Erro ao salvar promoção');
    }
  };

  const handleEdit = (promotion: PromotionWithDetails) => {
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toISOString().slice(0, 16);
      } catch {
        return '';
      }
    };

    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      min_order_value: promotion.min_order_value,
      max_discount: promotion.max_discount,
      start_date: formatDateForInput(promotion.start_date || null),
      end_date: formatDateForInput(promotion.end_date || null),
      days_of_week: promotion.days_of_week || [],
      coupon_codes: promotion.coupons?.map(c => c.code) || [],
      is_active: promotion.is_active
    });

    setEditingPromotion(promotion);
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
        setShowDeleteModal(false);
        setPromotionToDelete(null);
        loadPromotions();
        onPromotionChange?.();
        toast.success('Promoção excluída com sucesso!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir promoção');
      }
    } catch (error) {
      console.error('Erro ao excluir promoção:', error);
      toast.error('Erro ao excluir promoção');
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
      start_date: '',
      end_date: '',
      days_of_week: [],
      coupon_codes: [],
      is_active: true
    });
  };

  const addCouponCode = () => {
    setFormData(prev => ({
      ...prev,
      coupon_codes: [...prev.coupon_codes, '']
    }));
  };

  const removeCouponCode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coupon_codes: prev.coupon_codes.filter((_, i) => i !== index)
    }));
  };

  const updateCouponCode = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      coupon_codes: prev.coupon_codes.map((code, i) => i === index ? value : code)
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const formatDiscount = (promotion: PromotionWithDetails) => {
    const value = promotion.discount_value;
    const type = promotion.discount_type;
    return type === 'percentage' ? `${value}%` : `R$ ${value.toFixed(2)}`;
  };

  const getStatusBadge = (promotion: PromotionWithDetails) => {
    if (!promotion.is_active) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inativa</span>;
    }
    
    const now = new Date();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;
    
    if (startDate && now < startDate) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">Aguardando</span>;
    }
    
    if (endDate && now > endDate) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Expirada</span>;
    }
    
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Ativa</span>;
  };

  const getOrdersWithCoupon = (promotion: PromotionWithDetails) => {
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
        <h2 className="text-2xl font-bold text-gray-900">Promoções</h2>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setEditingPromotion(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Promoção
        </button>
      </div>

      {/* Lista de Promoções */}
      {promotions.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promoção criada</h3>
          <p className="text-gray-500 mb-4">Crie sua primeira promoção para começar a oferecer descontos aos clientes.</p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setEditingPromotion(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar Primeira Promoção
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
                <div className="flex items-center gap-2">
                  {getStatusBadge(promotion)}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(promotion)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(promotion)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Desconto:</span>
                  <div className="font-medium">{formatDiscount(promotion)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Pedido mínimo:</span>
                  <div className="font-medium">R$ {promotion.min_order_value.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Cupons:</span>
                  <div className="font-medium">{promotion.coupons?.length || 0}</div>
                </div>
                <div>
                  <span className="text-gray-500">Pedidos com cupom:</span>
                  <div className="font-medium">{getOrdersWithCoupon(promotion)}</div>
                </div>
              </div>

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
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">
                {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Formulário - Coluna Esquerda */}
                <div>
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
                          placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.discount_type === 'percentage' ? 'Ex: 10 = 10% de desconto' : 'Ex: 5.00 = R$ 5 de desconto'}
                        </p>
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
                          placeholder="20.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ex: 20.00 = pedido mínimo de R$ 20</p>
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
                        <p className="text-xs text-gray-500 mt-1">Ex: 50.00 = desconto máximo de R$ 50</p>
                      </div>
                    </div>

                    {/* Período da Promoção */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data e Hora de Início
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.start_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="dd/mm/aaaa, --:--"
                        />
                        <p className="text-xs text-gray-500 mt-1">Deixe vazio para começar imediatamente</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data e Hora de Fim
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="dd/mm/aaaa, --:--"
                        />
                        <p className="text-xs text-gray-500 mt-1">Deixe vazio para não expirar</p>
                      </div>
                    </div>

                    {/* Dias da Semana */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dias da Semana (Opcional)
                      </label>
                      <p className="text-xs text-gray-500 mb-3">Selecione os dias específicos da semana. Deixe vazio para funcionar todos os dias.</p>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDayOfWeek(day.value)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              formData.days_of_week.includes(day.value)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>
                </div>

                {/* Coluna da Direita */}
                <div className="space-y-4">
                  {/* Cupons - Movido para cima do Preview */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Códigos dos Cupons *
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Crie códigos que os clientes usarão para aplicar o desconto. Ex: SEXTOU, DESCONTO10, BLACKFRIDAY</p>
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
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Promoção ativa</span>
                  </div>

                  {/* Exemplo em Tempo Real */}
                  <div className="lg:sticky lg:top-0">
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg h-fit">
                      <h4 className="font-semibold text-blue-900 mb-4 text-lg">💡 Preview da Promoção</h4>
                      
                      <div className="space-y-4 text-sm text-blue-800">
                        <div>
                          <strong>Nome:</strong> {formData.name || 'Nome da promoção'}
                        </div>
                        
                        <div>
                          <strong>Desconto:</strong> {formData.discount_value || 0} {formData.discount_type === 'percentage' ? '%' : 'R$'}
                          {formData.discount_type === 'percentage' && formData.max_discount && (
                            <span> (máx. R$ {formData.max_discount})</span>
                          )}
                        </div>
                        
                        {formData.min_order_value > 0 && (
                          <div>
                            <strong>Pedido mínimo:</strong> R$ {formData.min_order_value}
                          </div>
                        )}
                        
                        {formData.start_date && (
                          <div>
                            <strong>Início:</strong> {new Date(formData.start_date).toLocaleString('pt-BR')}
                          </div>
                        )}
                        
                        {formData.end_date && (
                          <div>
                            <strong>Fim:</strong> {new Date(formData.end_date).toLocaleString('pt-BR')}
                          </div>
                        )}
                        
                        {formData.days_of_week.length > 0 && (
                          <div>
                            <strong>Dias:</strong> {formData.days_of_week.map(day => 
                              daysOfWeek.find(d => d.value === day)?.label
                            ).join(', ')}
                          </div>
                        )}
                        
                        {formData.coupon_codes.length > 0 && (
                          <div>
                            <strong>Cupons:</strong> {formData.coupon_codes.join(', ')}
                          </div>
                        )}
                        
                        <div className="mt-6 p-3 bg-white rounded border">
                          <strong>Exemplo de uso:</strong>
                          <div className="mt-2">
                            <p>Cliente faz pedido de R$ 50</p>
                            {formData.discount_type === 'percentage' ? (
                              <p>→ Desconto: R$ {(50 * (formData.discount_value || 0) / 100).toFixed(2)}</p>
                            ) : (
                              <p>→ Desconto: R$ {formData.discount_value || 0}</p>
                            )}
                            <p className="font-semibold">→ Total: R$ {formData.discount_type === 'percentage' 
                              ? (50 - (50 * (formData.discount_value || 0) / 100)).toFixed(2)
                              : (50 - (formData.discount_value || 0)).toFixed(2)
                            }</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com Botões Fixos */}
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPromotion(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingPromotion ? 'Atualizar' : 'Criar'} Promoção
              </button>
            </div>
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
