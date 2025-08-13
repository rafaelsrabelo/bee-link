-- Adicionar colunas que faltam na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors_enabled BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes_enabled BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN products.colors_enabled IS 'Indica se as cores estão habilitadas para o produto';
COMMENT ON COLUMN products.sizes_enabled IS 'Indica se os tamanhos estão habilitados para o produto';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('colors_enabled', 'sizes_enabled');






