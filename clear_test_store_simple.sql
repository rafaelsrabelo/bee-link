-- SQL SIMPLIFICADO para limpar dados da loja teste-rabelo
-- Execute este script no SQL Editor do Supabase

-- 1. Deletar todos os pedidos da loja teste-rabelo
DELETE FROM orders 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- 2. Deletar todos os clientes da loja teste-rabelo
DELETE FROM customers 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- 3. Verificar se a limpeza foi bem-sucedida
SELECT 
    'orders' as tabela,
    COUNT(*) as registros_restantes
FROM orders 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
)

UNION ALL

SELECT 
    'customers' as tabela,
    COUNT(*) as registros_restantes
FROM customers 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);
