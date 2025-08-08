-- Adicionar campos de localização na tabela stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Criar índice para otimizar consultas por localização
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(latitude, longitude);

-- Comentários para documentação
COMMENT ON COLUMN stores.address IS 'Endereço completo da loja';
COMMENT ON COLUMN stores.latitude IS 'Latitude da loja (decimal)';
COMMENT ON COLUMN stores.longitude IS 'Longitude da loja (decimal)';
COMMENT ON COLUMN stores.city IS 'Cidade da loja';
COMMENT ON COLUMN stores.state IS 'Estado da loja';
COMMENT ON COLUMN stores.zip_code IS 'CEP da loja';

