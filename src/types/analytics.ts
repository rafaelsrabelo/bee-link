export interface PageView {
  id: string;
  store_id: string;
  session_id: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  page_url: string;
  viewed_at: string;
  created_at: string;
}

export interface ProductClick {
  id: string;
  store_id: string;
  product_id: string;
  session_id: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  clicked_at: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  store_id: string;
  session_id: string;
  user_agent?: string;
  ip_address?: string;
  first_visit_at: string;
  last_visit_at: string;
  total_views: number;
  total_clicks: number;
  created_at: string;
  updated_at: string;
}

export interface TopProduct {
  product_name: string;
  product_id: string;
  clicks: number;
  rank: number;
}

export interface DailyStats {
  date: string;
  views: number;
  unique_sessions: number;
}

export interface ProductAnalytics {
  total_clicks: number;
  daily_clicks: DailyClick[];
  click_trend: 'Crescendo' | 'Diminuindo' | 'Estável' | 'Insuficiente';
}

export interface DailyClick {
  date: string;
  clicks: number;
}

export interface StoreAnalytics {
  total_views: number;
  total_clicks: number;
  unique_visitors: number;
  avg_views_per_session: number;
  top_products: TopProduct[];
  daily_stats: DailyStats[];
}

export interface AnalyticsFilters {
  start_date: string;
  end_date: string;
  period?: '7d' | '30d' | '90d' | '1y' | 'custom';
}

export interface AnalyticsEvent {
  type: 'page_view' | 'product_click';
  store_id: string;
  session_id: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  page_url?: string;
  product_id?: string;
}

// Tipos para componentes de dashboard
export interface AnalyticsCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
} 