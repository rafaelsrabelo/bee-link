-- Sistema de Gestão de Entregas
-- Criar tabela para configurações de entrega por loja

-- Tabela principal de configurações de entrega
CREATE TABLE IF NOT EXISTS delivery_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    delivery_enabled BOOLEAN DEFAULT false,
    delivery_radius_km DECIMAL(5,2) DEFAULT 0,
    price_per_km DECIMAL(8,2) DEFAULT 0,
    minimum_delivery_fee DECIMAL(8,2) DEFAULT 0,
    free_delivery_threshold DECIMAL(8,2) DEFAULT 0,
    estimated_delivery_time_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id)
);

-- Tabela para histórico de entregas (opcional, para futuras funcionalidades)
CREATE TABLE IF NOT EXISTS delivery_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    delivery_fee DECIMAL(8,2) NOT NULL,
    distance_km DECIMAL(5,2),
    customer_address TEXT,
    delivery_status VARCHAR(50) DEFAULT 'pending',
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna de taxa de entrega na tabela de pedidos
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_distance_km DECIMAL(5,2);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_delivery_settings_store_id ON delivery_settings(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_history_order_id ON delivery_history(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_history_store_id ON delivery_history(store_id);

-- Inserir configurações padrão para lojas existentes
INSERT INTO delivery_settings (store_id, delivery_enabled, delivery_radius_km, price_per_km, minimum_delivery_fee, free_delivery_threshold, estimated_delivery_time_hours)
SELECT 
    id as store_id,
    false as delivery_enabled,
    5.0 as delivery_radius_km,
    2.50 as price_per_km,
    5.00 as minimum_delivery_fee,
    50.00 as free_delivery_threshold,
    24 as estimated_delivery_time_hours
FROM stores
WHERE id NOT IN (SELECT store_id FROM delivery_settings)
ON CONFLICT (store_id) DO NOTHING;

-- Função para calcular taxa de entrega
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
    p_store_id UUID,
    p_distance_km DECIMAL(5,2),
    p_order_total DECIMAL(8,2)
)
RETURNS DECIMAL(8,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_delivery_fee DECIMAL(8,2) := 0;
    v_settings RECORD;
BEGIN
    -- Buscar configurações de entrega da loja
    SELECT * INTO v_settings 
    FROM delivery_settings 
    WHERE store_id = p_store_id;
    
    -- Se entrega não está habilitada, retorna 0
    IF NOT v_settings.delivery_enabled THEN
        RETURN 0;
    END IF;
    
    -- Se distância está fora do raio de entrega, retorna 0 (não entrega)
    IF p_distance_km > v_settings.delivery_radius_km THEN
        RETURN 0;
    END IF;
    
    -- Se pedido atinge o valor mínimo para entrega gratuita
    IF p_order_total >= v_settings.free_delivery_threshold THEN
        RETURN 0;
    END IF;
    
    -- Calcular taxa baseada na distância
    v_delivery_fee := p_distance_km * v_settings.price_per_km;
    
    -- Aplicar taxa mínima se necessário
    IF v_delivery_fee < v_settings.minimum_delivery_fee THEN
        v_delivery_fee := v_settings.minimum_delivery_fee;
    END IF;
    
    RETURN v_delivery_fee;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE delivery_settings IS 'Configurações de entrega por loja';
COMMENT ON TABLE delivery_history IS 'Histórico de entregas realizadas';
COMMENT ON FUNCTION calculate_delivery_fee IS 'Calcula a taxa de entrega baseada na distância e configurações da loja';
