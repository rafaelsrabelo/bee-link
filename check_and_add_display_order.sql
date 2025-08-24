-- Verificar se o campo display_order existe na tabela products
DO $$
BEGIN
    -- Verificar se a coluna existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'display_order'
    ) THEN
        -- Adicionar coluna se não existir
        ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0;
        
        -- Criar índice para otimizar consultas
        CREATE INDEX IF NOT EXISTS idx_products_display_order 
        ON products(store_id, display_order);
        
        -- Comentário na coluna
        COMMENT ON COLUMN products.display_order IS 'Ordem de exibição dos produtos na loja (0 = primeiro)';
        
        -- Atualizar produtos existentes com display_order baseado na data de criação
        UPDATE products 
        SET display_order = (
          SELECT rank 
          FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at DESC) as rank
            FROM products
          ) ranked 
          WHERE ranked.id = products.id
        ) - 1;
        
        RAISE NOTICE 'Campo display_order adicionado com sucesso!';
    ELSE
        RAISE NOTICE 'Campo display_order já existe!';
    END IF;
END $$;

-- Verificar se o campo sort_order existe na tabela product_categories
DO $$
BEGIN
    -- Verificar se a coluna existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_categories' 
        AND column_name = 'sort_order'
    ) THEN
        -- Adicionar coluna se não existir
        ALTER TABLE product_categories ADD COLUMN sort_order INTEGER DEFAULT 0;
        
        -- Criar índice para otimizar consultas
        CREATE INDEX IF NOT EXISTS idx_product_categories_sort_order 
        ON product_categories(sort_order);
        
        -- Comentário na coluna
        COMMENT ON COLUMN product_categories.sort_order IS 'Ordem de exibição das categorias (0 = primeira)';
        
        -- Atualizar categorias existentes com sort_order baseado na data de criação
        UPDATE product_categories 
        SET sort_order = (
          SELECT rank 
          FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rank
            FROM product_categories
          ) ranked 
          WHERE ranked.id = product_categories.id
        ) - 1;
        
        RAISE NOTICE 'Campo sort_order adicionado com sucesso!';
    ELSE
        RAISE NOTICE 'Campo sort_order já existe!';
    END IF;
END $$;

-- Verificar o status das tabelas
SELECT 
  'products' as table_name,
  COUNT(*) as total_records,
  MIN(display_order) as min_display_order,
  MAX(display_order) as max_display_order
FROM products
UNION ALL
SELECT 
  'product_categories' as table_name,
  COUNT(*) as total_records,
  MIN(sort_order) as min_sort_order,
  MAX(sort_order) as max_sort_order
FROM product_categories;
