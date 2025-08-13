-- Adicionar coluna images à tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Comentário para documentação
COMMENT ON COLUMN products.images IS 'Array de imagens do produto';






