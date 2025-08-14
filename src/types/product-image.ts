export interface ProductImage {
  id: number;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImageUpload {
  file: File;
  alt_text?: string;
  is_primary?: boolean;
}

export interface ProductImageCreate {
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductImageUpdate {
  id: number;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}
