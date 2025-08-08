export interface Promotion {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  days_of_week?: number[]; // 0=domingo, 1=segunda, etc.
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  promotion_id: string;
  code: string;
  is_active: boolean;
  usage_limit?: number;
  used_count: number;
  created_at: string;
  coupon_usage?: CouponUsage[];
}

export interface PromotionProduct {
  id: string;
  promotion_id: string;
  product_id: string;
  created_at: string;
}

export interface PromotionCategory {
  id: string;
  promotion_id: string;
  category_id: string;
  created_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  order_id: string;
  user_ip?: string;
  used_at: string;
}

export interface PromotionWithDetails extends Promotion {
  coupons: Coupon[];
  products: PromotionProduct[];
  categories: PromotionCategory[];
}

export interface CouponValidation {
  is_valid: boolean;
  promotion_id?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  max_discount?: number;
  message: string;
}

export interface CreatePromotionData {
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  days_of_week?: number[];
  start_time?: string;
  end_time?: string;
  product_ids?: string[];
  category_ids?: string[];
  coupon_codes?: string[];
}

export interface UpdatePromotionData extends Partial<CreatePromotionData> {
  id: string;
}

export interface PromotionFormData {
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  days_of_week: number[];
  start_time?: string;
  end_time?: string;
  product_ids: string[];
  category_ids: string[];
  coupon_codes: string[];
}

export interface PromotionStats {
  total_promotions: number;
  active_promotions: number;
  total_coupons: number;
  used_coupons: number;
  total_discount_given: number;
  top_promotions: Array<{
    id: string;
    name: string;
    usage_count: number;
    total_discount: number;
  }>;
}
