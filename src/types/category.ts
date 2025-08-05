export interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreCategoryData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

export interface UpdateStoreCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
} 