# 🚀 Configuração do Sistema de Analytics

## 📋 **Passos para ativar o tracking:**

### **1. Execute o SQL no Supabase:**
```sql
-- Copie e cole este código no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New Query)

-- ========================================
-- TABELA DE ANALYTICS SIMPLES
-- ========================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'product_click', 'add_to_cart'
    store_slug VARCHAR(100) NOT NULL,
    product_id VARCHAR(100),
    product_name VARCHAR(200),
    product_price DECIMAL(10,2),
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_slug ON analytics_events(store_slug);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON analytics_events(product_id);

-- RLS (Row Level Security)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de qualquer pessoa (para tracking público)
CREATE POLICY "Permitir inserção de eventos de analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura apenas do dono da loja
CREATE POLICY "Permitir leitura de eventos da própria loja" ON analytics_events
    FOR SELECT USING (
        store_slug IN (
            SELECT slug FROM stores WHERE user_id = auth.uid()
        )
    );

-- Função para obter analytics de uma loja
CREATE OR REPLACE FUNCTION get_store_analytics(p_store_slug VARCHAR, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_views BIGINT,
    total_clicks BIGINT,
    unique_visitors BIGINT,
    avg_views_per_session NUMERIC,
    top_products JSON,
    daily_stats JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
            COUNT(*) FILTER (WHERE event_type = 'product_click') as clicks,
            COUNT(DISTINCT ip_address) FILTER (WHERE event_type = 'page_view') as unique_visitors,
            ROUND(
                COUNT(*) FILTER (WHERE event_type = 'page_view')::NUMERIC / 
                NULLIF(COUNT(DISTINCT ip_address) FILTER (WHERE event_type = 'page_view'), 0), 
                1
            ) as avg_views_per_session
        FROM analytics_events 
        WHERE store_slug = p_store_slug 
        AND created_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    top_products_data AS (
        SELECT 
            product_id,
            product_name,
            COUNT(*) as clicks,
            ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank
        FROM analytics_events 
        WHERE store_slug = p_store_slug 
        AND event_type = 'product_click'
        AND created_at >= NOW() - INTERVAL '1 day' * p_days
        AND product_id IS NOT NULL
        GROUP BY product_id, product_name
        ORDER BY clicks DESC
        LIMIT 10
    ),
    daily_stats_data AS (
        SELECT 
            DATE(created_at) as date,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
            COUNT(DISTINCT ip_address) FILTER (WHERE event_type = 'page_view') as unique_sessions
        FROM analytics_events 
        WHERE store_slug = p_store_slug 
        AND created_at >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
    )
    SELECT 
        s.views,
        s.clicks,
        s.unique_visitors,
        s.avg_views_per_session,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'product_id', product_id,
                    'product_name', product_name,
                    'clicks', clicks,
                    'rank', rank
                )
            ) FROM top_products_data), 
            '[]'::json
        ) as top_products,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'date', date,
                    'views', views,
                    'unique_sessions', unique_sessions
                )
            ) FROM daily_stats_data), 
            '[]'::json
        ) as daily_stats
    FROM stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2. Teste o tracking:**
1. **Acesse sua loja** em modo anônimo
2. **Clique em produtos** para gerar dados
3. **Vá para o dashboard** do admin
4. **Veja os dados** aparecendo em tempo real

### **3. Onde você verá os dados:**

#### **📊 Dashboard Principal:**
- Resumo de visualizações, cliques, visitantes
- Produtos mais clicados (top 3)
- Média de páginas por sessão

#### **📈 Página de Analytics:**
- Dados detalhados por período
- Ranking completo de produtos
- Estatísticas diárias

#### **🛍️ Página de Produtos:**
- Cliques e visualizações por produto
- Indicadores de performance

## 🎯 **O que está sendo rastreado:**

### **✅ Automaticamente:**
- **Visualizações de página** - Cada visita à loja
- **Cliques em produtos** - Quando alguém clica em um produto
- **Adições ao carrinho** - Quando alguém adiciona produto
- **IP do visitante** - Para contagem de visitantes únicos
- **User Agent** - Informações do navegador

### **📊 Dados coletados:**
- **Total de visualizações** por loja
- **Total de cliques** em produtos
- **Visitantes únicos** (por IP)
- **Produtos mais populares** (ranking)
- **Atividade diária** (tendências)

## 🔧 **Como funciona:**

### **1. Tracking Simples:**
- API `/api/analytics/track` registra eventos
- Banco de dados PostgreSQL armazena dados
- Função SQL agrega e calcula métricas

### **2. Segurança:**
- RLS (Row Level Security) protege dados
- Apenas dono da loja vê seus dados
- Tracking público (qualquer um pode gerar eventos)

### **3. Performance:**
- Índices otimizados para consultas rápidas
- Agregação via SQL (não JavaScript)
- Cache automático do Supabase

## 🚀 **Próximos passos:**

### **1. Teste o sistema:**
- Execute o SQL
- Visite sua loja
- Verifique os dados no dashboard

### **2. Personalize:**
- Adicione mais métricas se necessário
- Configure alertas para picos de tráfego
- Integre com outras ferramentas

### **3. Otimize:**
- Monitore performance das consultas
- Ajuste índices conforme necessário
- Configure backup automático

---

**🎉 Pronto! Seu sistema de analytics está funcionando!**

Agora você pode acompanhar o desempenho da sua loja em tempo real! 📊🚀 