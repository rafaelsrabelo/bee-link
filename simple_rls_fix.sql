-- Solução simples para corrigir políticas RLS
-- Permitir UPDATE em produtos e categorias para usuários autenticados

-- 1. Habilitar RLS nas tabelas (se não estiver habilitado)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- 2. Criar política simples para UPDATE em products
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
CREATE POLICY "Enable update for authenticated users" ON products
FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Criar política simples para UPDATE em product_categories  
DROP POLICY IF EXISTS "Enable update for authenticated users" ON product_categories;
CREATE POLICY "Enable update for authenticated users" ON product_categories
FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Verificar se as políticas foram criadas
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('products', 'product_categories')
AND cmd = 'UPDATE';

-- 5. Teste simples - verificar se conseguimos fazer UPDATE
-- (Execute isso como usuário autenticado)
UPDATE products 
SET display_order = display_order 
WHERE id = '1754280345286' 
LIMIT 1;

UPDATE product_categories 
SET sort_order = sort_order 
WHERE id = 36 
LIMIT 1;
