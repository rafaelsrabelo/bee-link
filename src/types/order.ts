export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  storeSlug: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  items: OrderItem[];
  total: number;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: Order['status'];
  notes?: string;
}

export interface OrderWithStore extends Order {
  store: {
    store_name: string;
    whatsapp: string;
    colors: {
      background: string;
      primary: string;
      text: string;
      header: string;
    };
  };
} 