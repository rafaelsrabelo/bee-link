-- Adicionar campo display_order na tabela products
-- Este campo controla a ordem de exibição dos produtos na loja

-- Adicionar coluna display_order
ALTER TABLE products 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Criar índice para otimizar consultas por display_order
CREATE INDEX IF NOT EXISTS idx_products_display_order 
ON products(store_id, display_order);

-- Comentário na coluna
COMMENT ON COLUMN products.display_order IS 'Ordem de exibição dos produtos na loja (0 = primeiro)';

-- Atualizar produtos existentes com display_order baseado na data de criação
-- Produtos mais recentes ficam primeiro (ordem decrescente)
UPDATE products 
SET display_order = (
  SELECT rank 
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at DESC) as rank
    FROM products
  ) ranked 
  WHERE ranked.id = products.id
) - 1;

-- Verificar se a atualização foi bem-sucedida
SELECT 
  store_id,
  COUNT(*) as total_products,
  MIN(display_order) as min_order,
  MAX(display_order) as max_order
FROM products 
GROUP BY store_id 
ORDER BY store_id;
