-- Adicionar campos de cores e tamanhos aos produtos
ALTER TABLE products ADD COLUMN colors JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN sizes JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN has_variants BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN colors_enabled BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN sizes_enabled BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN products.colors IS 'Array de cores disponíveis para o produto (hexadecimal)';
COMMENT ON COLUMN products.sizes IS 'Array de tamanhos disponíveis para o produto';
COMMENT ON COLUMN products.has_variants IS 'Indica se o produto tem variações (cores/tamanhos)';
COMMENT ON COLUMN products.images IS 'Array de imagens do produto com associação de cores';
COMMENT ON COLUMN products.colors_enabled IS 'Indica se as cores estão habilitadas para o produto';
COMMENT ON COLUMN products.sizes_enabled IS 'Indica se os tamanhos estão habilitados para o produto';

-- Criar tabela para configurações globais de cores e tamanhos da loja
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
CREATE INDEX idx_store_attributes_store_id ON store_attributes(store_id);
CREATE INDEX idx_store_attributes_type ON store_attributes(attribute_type);
CREATE INDEX idx_products_has_variants ON products(has_variants);

-- Inserir cores padrão
INSERT INTO store_attributes (store_id, attribute_type, name, value, hex_code, is_default, sort_order) VALUES
-- Cores básicas (serão copiadas para cada loja)
(NULL, 'color', 'Preto', 'Preto', '#000000', true, 1),
(NULL, 'color', 'Branco', 'Branco', '#FFFFFF', true, 2),
(NULL, 'color', 'Vermelho', 'Vermelho', '#FF0000', true, 3),
(NULL, 'color', 'Azul', 'Azul', '#0000FF', true, 4),
(NULL, 'color', 'Verde', 'Verde', '#008000', true, 5),
(NULL, 'color', 'Amarelo', 'Amarelo', '#FFFF00', true, 6),
(NULL, 'color', 'Rosa', 'Rosa', '#FFC0CB', true, 7),
(NULL, 'color', 'Laranja', 'Laranja', '#FFA500', true, 8),
(NULL, 'color', 'Roxo', 'Roxo', '#800080', true, 9),
(NULL, 'color', 'Marrom', 'Marrom', '#8B4513', true, 10),
(NULL, 'color', 'Cinza', 'Cinza', '#808080', true, 11),
(NULL, 'color', 'Bege', 'Bege', '#F5F5DC', true, 12);

-- Inserir tamanhos padrão
INSERT INTO store_attributes (store_id, attribute_type, name, value, is_default, sort_order) VALUES
-- Tamanhos de roupas
(NULL, 'size', 'PP', 'PP', true, 1),
(NULL, 'size', 'P', 'P', true, 2),
(NULL, 'size', 'M', 'M', true, 3),
(NULL, 'size', 'G', 'G', true, 4),
(NULL, 'size', 'GG', 'GG', true, 5),
(NULL, 'size', 'XG', 'XG', true, 6),
-- Tamanhos de calçados
(NULL, 'size', '34', '34', true, 7),
(NULL, 'size', '35', '35', true, 8),
(NULL, 'size', '36', '36', true, 9),
(NULL, 'size', '37', '37', true, 10),
(NULL, 'size', '38', '38', true, 11),
(NULL, 'size', '39', '39', true, 12),
(NULL, 'size', '40', '40', true, 13),
(NULL, 'size', '41', '41', true, 14),
(NULL, 'size', '42', '42', true, 15),
(NULL, 'size', '43', '43', true, 16),
(NULL, 'size', '44', '44', true, 17),
(NULL, 'size', '45', '45', true, 18);
