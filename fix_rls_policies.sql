-- Corrigir políticas RLS para permitir atualização de display_order e sort_order

-- 1. Verificar políticas existentes na tabela products
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'products';

-- 2. Verificar políticas existentes na tabela product_categories
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'product_categories';

-- 3. Criar política para permitir UPDATE de display_order em products
-- Primeiro, remover política existente se houver
DROP POLICY IF EXISTS "Users can update their own products display_order" ON products;

-- Criar nova política para UPDATE
CREATE POLICY "Users can update their own products display_order" ON products
FOR UPDATE USING (
    store_id IN (
        SELECT id FROM stores 
        WHERE user_id = auth.uid()
    )
);

-- 4. Criar política para permitir UPDATE de sort_order em product_categories
-- Primeiro, remover política existente se houver
DROP POLICY IF EXISTS "Users can update their own categories sort_order" ON product_categories;

-- Criar nova política para UPDATE
CREATE POLICY "Users can update their own categories sort_order" ON product_categories
FOR UPDATE USING (
    -- Permitir atualização de categorias que estão sendo usadas pelos produtos do usuário
    id IN (
        SELECT DISTINCT category_id 
        FROM products 
        WHERE store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
        AND category_id IS NOT NULL
    )
    OR
    -- Permitir atualização de categorias criadas pelo usuário (com metadados no description)
    description LIKE '%user:' || auth.uid() || '%'
);

-- 5. Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('products', 'product_categories')
AND policyname LIKE '%display_order%' OR policyname LIKE '%sort_order%';

-- 6. Testar se as políticas estão funcionando
-- (Execute isso como o usuário autenticado)
SELECT 
    'products' as table_name,
    COUNT(*) as total_products,
    COUNT(CASE WHEN display_order IS NOT NULL THEN 1 END) as with_display_order
FROM products
WHERE store_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
);

SELECT 
    'product_categories' as table_name,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN sort_order IS NOT NULL THEN 1 END) as with_sort_order
FROM product_categories
WHERE id IN (
    SELECT DISTINCT category_id 
    FROM products 
    WHERE store_id IN (
        SELECT id FROM stores 
        WHERE user_id = auth.uid()
    )
    AND category_id IS NOT NULL
);
