-- Adicionar coluna user_id na tabela stores
ALTER TABLE stores ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Atualizar a loja existente (Lessari) para associar com um usuário
-- Você precisará substituir 'USER_UUID_AQUI' pelo UUID do usuário que criou a conta
-- UPDATE stores SET user_id = 'USER_UUID_AQUI' WHERE slug = 'lessari';

-- Habilitar RLS na tabela stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários só acessarem suas próprias lojas
CREATE POLICY "Users can only access their own stores" ON stores
FOR ALL USING (auth.uid() = user_id);

-- Política para permitir leitura pública das lojas (para visualização)
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