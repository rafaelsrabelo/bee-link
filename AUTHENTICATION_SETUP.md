# 🔐 Configuração da Autenticação - Supabase Auth

## 📋 Pré-requisitos

1. **Conta no Supabase** configurada
2. **Variáveis de ambiente** configuradas
3. **Google OAuth** configurado (opcional)

## 🚀 Passos para Configuração

### 1. Configurar Google OAuth (Opcional)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth 2.0 Client IDs**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Copie o **Client ID** e **Client Secret**

### 2. Configurar Supabase Auth

1. Acesse o **Dashboard do Supabase**
2. Vá para **Authentication > Settings**
3. Em **Site URL**, adicione: `http://localhost:3000` (desenvolvimento)
4. Em **Redirect URLs**, adicione:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (produção)

### 3. Configurar Google Provider

1. No Supabase, vá para **Authentication > Providers**
2. Ative o **Google** provider
3. Adicione o **Client ID** e **Client Secret** do Google
4. Salve as configurações

### 4. Executar Scripts SQL

Execute o script `update-stores-table.sql` no **SQL Editor** do Supabase:

```sql
-- Adicionar coluna user_id na tabela stores
ALTER TABLE stores ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Habilitar RLS na tabela stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Users can only access their own stores" ON stores
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view stores" ON stores
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create stores" ON stores
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store owners can update their stores" ON stores
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Store owners can delete their stores" ON stores
FOR DELETE USING (auth.uid() = user_id);
```

### 5. Associar Loja Existente

Após criar uma conta, execute:

```sql
-- Substitua 'USER_UUID_AQUI' pelo UUID do usuário
UPDATE stores SET user_id = 'USER_UUID_AQUI' WHERE slug = 'lessari';
```

## 🔧 Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## 📱 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Login com email/senha
- [x] Registro de conta
- [x] Login com Google OAuth
- [x] Logout
- [x] Proteção de rotas

### ✅ Dashboard
- [x] Lista de lojas do usuário
- [x] Estatísticas
- [x] Navegação para admin das lojas

### ✅ Segurança
- [x] Row Level Security (RLS)
- [x] Middleware de proteção
- [x] Context de autenticação

## 🛣️ Rotas Criadas

- `/login` - Página de login/registro
- `/dashboard` - Dashboard principal (protegida)
- `/auth/callback` - Callback do OAuth
- `/lessari/admin` - Admin da Lessari (protegida)

## 🔒 Proteção de Rotas

As seguintes rotas estão protegidas:
- `/dashboard/*`
- `/lessari/admin`

Usuários não autenticados são redirecionados para `/login`.

## 🎯 Próximos Passos

1. **Testar autenticação** localmente
2. **Configurar Google OAuth** no Supabase
3. **Associar loja existente** com usuário
4. **Testar RLS** e permissões
5. **Deploy** para produção

## 🐛 Troubleshooting

### Erro: "relation 'auth.users' does not exist"
- Verifique se o Supabase Auth está habilitado
- Execute `supabase auth enable` se necessário

### Erro: "Invalid redirect URL"
- Verifique as URLs configuradas no Supabase
- Certifique-se de que o domínio está correto

### Erro: "Google OAuth failed"
- Verifique as credenciais do Google
- Confirme se o redirect URI está correto
- Aguarde alguns minutos para propagação

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme as configurações do Supabase
3. Teste com uma conta nova 