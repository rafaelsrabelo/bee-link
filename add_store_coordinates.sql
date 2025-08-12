-- ==========================================
-- ADICIONAR COORDENADAS GEOGRÁFICAS ÀS LOJAS
-- ==========================================

-- 1. Adicionar coluna latitude na tabela stores
ALTER TABLE stores 
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL;

-- 2. Adicionar coluna longitude na tabela stores
ALTER TABLE stores 
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;

-- 3. Comentários para documentação
COMMENT ON COLUMN stores.latitude IS 'Latitude da loja (coordenada geográfica)';
COMMENT ON COLUMN stores.longitude IS 'Longitude da loja (coordenada geográfica)';

-- 4. Verificar se foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;
