-- Remover todos os atributos padrão (cores e tamanhos)
DELETE FROM store_attributes WHERE is_default = true;

-- Verificar se foram removidos
SELECT COUNT(*) as total_attributes FROM store_attributes;
SELECT COUNT(*) as default_attributes FROM store_attributes WHERE is_default = true;

-- Verificar se a tabela está vazia
SELECT 'Cores' as tipo, COUNT(*) as quantidade FROM store_attributes WHERE attribute_type = 'color'
UNION ALL
SELECT 'Tamanhos' as tipo, COUNT(*) as quantidade FROM store_attributes WHERE attribute_type = 'size';
