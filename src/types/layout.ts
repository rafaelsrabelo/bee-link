export interface StoreLayout {
  id: number;
  name: string;
  slug: string;
  description: string;
  preview_image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type LayoutType = 'default' | 'banner';

export interface LayoutSettings {
  layout_type: LayoutType;
  banner_image?: string;
  show_products_by_category?: boolean;
} 