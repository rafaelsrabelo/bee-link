export interface LayoutSettings {
  // Componentes de banner
  show_banner: boolean;
  banner_type: 'single' | 'carousel';
  banner_images: string[];
  banner_height: 'small' | 'medium' | 'large' | 'full';
  banner_rounded: boolean;
  banner_padding: boolean;
  
  // Configurações de exibição
  show_store_description: boolean;
  show_social_links: boolean;
  show_contact_info: boolean;
  
  // Layout de produtos
  products_per_row: 2 | 3 | 4;
  card_layout: 'grid' | 'horizontal';
  show_product_badges: boolean;
  show_product_description: boolean;
  show_product_price: boolean;
  show_product_rating: boolean;
  show_product_stock: boolean;
  show_quick_add: boolean;
  
  // Configurações de carrinho
  show_floating_cart: boolean;
  cart_position: 'bottom-right' | 'bottom-left';
  
  // Configurações de categoria
  category_display: 'tabs' | 'filters' | 'none';
  show_category_icons: boolean;
}

export const defaultLayoutSettings: LayoutSettings = {
  // Componentes de banner
  show_banner: false,
  banner_type: 'single',
  banner_images: [],
  banner_height: 'medium',
  banner_rounded: true,
  banner_padding: true,
  
  // Configurações de exibição
  show_store_description: true,
  show_social_links: true,
  show_contact_info: true,
  
  // Layout de produtos
  products_per_row: 3,
  card_layout: 'grid',
  show_product_badges: true,
  show_product_description: true,
  show_product_price: true,
  show_product_rating: false,
  show_product_stock: true,
  show_quick_add: true,
  
  // Configurações de carrinho
  show_floating_cart: true,
  cart_position: 'bottom-right',
  
  // Configurações de categoria
  category_display: 'tabs',
  show_category_icons: true,
};
