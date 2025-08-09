# 🔧 Instruções para Configurar Banco de Dados - Supabase

## 📋 **Script SQL para Executar**

**Acesse:** Supabase Dashboard → Seu Projeto → SQL Editor

**Cole e execute este código:**

```sql
-- ==========================================
-- ADICIONAR CONFIGURAÇÕES DE IMPRESSÃO
-- ==========================================

-- 1. Adicionar coluna print_settings na tabela stores
ALTER TABLE stores 
ADD COLUMN print_settings JSONB DEFAULT NULL;

-- 2. Comentário para documentação
COMMENT ON COLUMN stores.print_settings IS 'Configurações de impressão da loja (impressora padrão, formato, etc.)';

-- 3. Verificar se foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name = 'print_settings';
```

## ✅ **Verificação**

Após executar, você deve ver:
```
column_name    | data_type | is_nullable | column_default
print_settings | jsonb     | YES         | NULL
```

## 📝 **Estrutura dos Dados**

A coluna `print_settings` armazenará dados no formato:

```json
{
  "default_printer": "Nome da Impressora",
  "auto_print": true,
  "print_format": "thermal",
  "paper_width": 80,
  "auto_cut": true,
  "print_logo": true,
  "print_address": true
}
```

## 🎯 **Resultado Final**

Depois de executar este script:

1. ✅ **Coluna criada** na tabela `stores`
2. ✅ **API funcionando** para salvar/carregar configurações
3. ✅ **Interface salvará** as configurações corretamente
4. ✅ **Impressão usará** a impressora pré-definida

---

**Execute este script no Supabase e suas configurações de impressão serão salvas permanentemente! 🚀**
