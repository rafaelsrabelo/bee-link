-- Migração para adicionar suporte a múltiplas imagens por produto
-- Executar via SQL Editor do Supabase

-- 1. Criar tabela para múltiplas imagens de produtos
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order);

-- 3. Adicionar comentários para documentação
COMMENT ON TABLE product_images IS 'Armazena múltiplas imagens para cada produto';
COMMENT ON COLUMN product_images.product_id IS 'ID do produto (FK)';
COMMENT ON COLUMN product_images.image_url IS 'URL da imagem no Cloudinary';
COMMENT ON COLUMN product_images.alt_text IS 'Texto alternativo para acessibilidade';
COMMENT ON COLUMN product_images.is_primary IS 'Indica se é a imagem principal do produto';
COMMENT ON COLUMN product_images.sort_order IS 'Ordem de exibição das imagens (0 = primeira)';

-- 4. Migrar imagens existentes da coluna 'image' para a nova tabela
-- IMPORTANTE: Execute isso APENAS se houver dados de produtos existentes
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT 
  id as product_id,
  image as image_url,
  true as is_primary,
  0 as sort_order
FROM products 
WHERE image IS NOT NULL AND image != '' 
AND NOT EXISTS (
  SELECT 1 FROM product_images WHERE product_id = products.id
);

-- 5. Criar função para garantir apenas uma imagem primária por produto
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a nova imagem está sendo marcada como primária
  IF NEW.is_primary = true THEN
    -- Desmarcar todas as outras imagens como primárias para este produto
    UPDATE product_images 
    SET is_primary = false 
    WHERE product_id = NEW.product_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para a função
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_image ON product_images;
CREATE TRIGGER trigger_ensure_single_primary_image
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_image();

-- 7. Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_product_images_updated_at ON product_images;
CREATE TRIGGER trigger_update_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_product_images_updated_at();

-- 9. Adicionar RLS (Row Level Security) se necessário
-- ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- 10. Verificar a migração
SELECT 'Migração concluída! Total de imagens migradas:' as status, 
       COUNT(*) as total_images
FROM product_images;
