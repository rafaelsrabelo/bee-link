-- =====================================================
-- CONFIGURAÇÃO COMPLETA DE AUTENTICAÇÃO E RLS
-- =====================================================

-- 1. Verificar se a coluna user_id já existe na tabela stores
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE stores ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Habilitar RLS na tabela stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can only access their own stores" ON stores;
DROP POLICY IF EXISTS "Public can view stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;
DROP POLICY IF EXISTS "Store owners can update their stores" ON stores;
DROP POLICY IF EXISTS "Store owners can delete their stores" ON stores;

-- 4. Criar novas políticas de segurança
-- Política para usuários autenticados acessarem apenas suas próprias lojas
CREATE POLICY "Users can only access their own stores" ON stores
FOR ALL USING (auth.uid() = user_id);

-- Política para permitir leitura pública das lojas (para visualização das páginas)
CREATE POLICY "Public can view stores" ON stores
FOR SELECT USING (true);

-- Política para permitir inserção apenas para usuários autenticados
CREATE POLICY "Authenticated users can create stores" ON stores
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir atualização apenas para o dono da loja
CREATE POLICY "Store owners can update their stores" ON stores
FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir exclusão apenas para o dono da loja
CREATE POLICY "Store owners can delete their stores" ON stores
FOR DELETE USING (auth.uid() = user_id);

-- 5. Configurar RLS na tabela products também
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas da tabela products se existirem
DROP POLICY IF EXISTS "Users can only access their own products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can create products" ON products;
DROP POLICY IF EXISTS "Store owners can update their products" ON products;
DROP POLICY IF EXISTS "Store owners can delete their products" ON products;

-- Criar políticas para products
-- Política para permitir leitura pública dos produtos
CREATE POLICY "Public can view products" ON products
FOR SELECT USING (true);

-- Política para permitir inserção/atualização/deleção apenas para donos da loja
CREATE POLICY "Store owners can manage their products" ON products
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.id = products.store_id 
        AND stores.user_id = auth.uid()
    )
);

-- 6. Verificar se a coluna store_id existe na tabela products
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE products ADD COLUMN store_id UUID REFERENCES stores(id);
    END IF;
END $$;

-- 7. Atualizar produtos existentes para associar com a loja Lessari
UPDATE products 
SET store_id = (SELECT id FROM stores WHERE slug = 'lessari' LIMIT 1)
WHERE store_id IS NULL;

-- 8. Verificar configuração
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('stores', 'products');

-- 9. Listar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('stores', 'products'); 