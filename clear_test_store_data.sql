-- Script para limpar todos os dados de pedidos e relatórios da loja teste-rabelo
-- ⚠️ ATENÇÃO: Este script irá DELETAR permanentemente todos os dados relacionados à loja

-- 1. Primeiro, vamos verificar se a loja existe e obter seu ID
SELECT 
    id,
    name,
    slug,
    created_at
FROM stores 
WHERE slug = 'teste-rabelo';

-- 2. Verificar quantos pedidos existem para esta loja
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
FROM orders 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- 3. Verificar quantos clientes existem para esta loja
SELECT 
    COUNT(*) as total_customers
FROM customers 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- 4. Verificar dados de analytics (se existir)
SELECT 
    COUNT(*) as total_analytics
FROM analytics 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- 5. EXECUTAR A LIMPEZA (descomente as linhas abaixo para executar)

-- Deletar todos os pedidos da loja teste-rabelo
DELETE FROM orders 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- Deletar todos os clientes da loja teste-rabelo
DELETE FROM customers 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- Deletar dados de analytics da loja teste-rabelo (se a tabela existir)
-- DELETE FROM analytics 
-- WHERE store_id IN (
--     SELECT id FROM stores WHERE slug = 'teste-rabelo'
-- );

-- 6. Verificar se a limpeza foi bem-sucedida
SELECT 
    'orders' as table_name,
    COUNT(*) as remaining_records
FROM orders 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
)

UNION ALL

SELECT 
    'customers' as table_name,
    COUNT(*) as remaining_records
FROM customers 
WHERE store_id IN (
    SELECT id FROM stores WHERE slug = 'teste-rabelo'
);

-- 7. Confirmar que a loja ainda existe (não foi deletada)
SELECT 
    id,
    name,
    slug,
    created_at
FROM stores 
WHERE slug = 'teste-rabelo';

-- ✅ RESULTADO ESPERADO:
-- - orders: 0 registros
-- - customers: 0 registros  
-- - A loja teste-rabelo deve continuar existindo
