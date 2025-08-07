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
  source?: string; // Origem do pedido (link, whatsapp, presencial, etc.)
  notes?: string;
  created_at: string;
  updated_at: string;
  // Novas informações de entrega e pagamento
  delivery_type?: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_cep?: string;
  delivery_city?: string;
  delivery_state?: string;
  payment_method?: 'money' | 'pix' | 'credit_card' | 'debit_card';
}

export interface CreateOrderRequest {
  storeSlug: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  items: OrderItem[];
  total: number;
  source?: string; // Origem do pedido
  isManualOrder?: boolean; // Flag para identificar pedidos criados pelo admin
  notes?: string;
  order_date?: string; // Data do pedido em formato YYYY-MM-DD
  // Novas informações de entrega e pagamento
  delivery_type?: 'delivery' | 'pickup';
  delivery_cep?: string;
  delivery_city?: string;
  delivery_state?: string;
  payment_method?: 'money' | 'pix' | 'credit_card' | 'debit_card';
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