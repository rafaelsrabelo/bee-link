-- Adicionar todas as colunas que estão faltando na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors_enabled BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes_enabled BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN products.colors IS 'Array de cores disponíveis para o produto (hexadecimal)';
COMMENT ON COLUMN products.sizes IS 'Array de tamanhos disponíveis para o produto';
COMMENT ON COLUMN products.has_variants IS 'Indica se o produto tem variações (cores/tamanhos)';
COMMENT ON COLUMN products.images IS 'Array de imagens do produto';
COMMENT ON COLUMN products.colors_enabled IS 'Indica se as cores estão habilitadas para o produto';
COMMENT ON COLUMN products.sizes_enabled IS 'Indica se os tamanhos estão habilitados para o produto';

-- Criar tabela store_attributes se não existir
CREATE TABLE IF NOT EXISTS store_attributes (
  id SERIAL PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  attribute_type VARCHAR(20) NOT NULL CHECK (attribute_type IN ('color', 'size')),
  name VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL,
  hex_code VARCHAR(7), -- Para cores (ex: #FF0000)
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, attribute_type, name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_attributes_store_id ON store_attributes(store_id);
CREATE INDEX IF NOT EXISTS idx_store_attributes_type ON store_attributes(attribute_type);
CREATE INDEX IF NOT EXISTS idx_products_has_variants ON products(has_variants);






