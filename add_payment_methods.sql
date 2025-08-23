-- Adicionar campo payment_methods na tabela stores
ALTER TABLE stores 
ADD COLUMN payment_methods JSONB DEFAULT '["money", "pix", "credit_card", "debit_card"]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN stores.payment_methods IS 'Array de métodos de pagamento disponíveis: money, pix, credit_card, debit_card';
