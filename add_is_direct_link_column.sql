-- Adicionar coluna is_direct_link na tabela analytics_events
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS is_direct_link BOOLEAN DEFAULT FALSE;

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'analytics_events' 
AND column_name = 'is_direct_link';
