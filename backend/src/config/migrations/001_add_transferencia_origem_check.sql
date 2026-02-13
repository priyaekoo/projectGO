-- Migration 001: Adiciona 'TRANSFERENCIA' na constraint de origem da tabela movimentacoes
-- Problema: A constraint movimentacoes_origem_check nao incluia 'TRANSFERENCIA',
-- causando erro ao realizar transferencias entre clientes.
-- Executar: psql -U postgres -d projectgo -f backend/src/config/migrations/001_add_transferencia_origem_check.sql

-- Remove constraint antiga
ALTER TABLE movimentacoes DROP CONSTRAINT IF EXISTS movimentacoes_origem_check;

-- Recria com todos os valores de origem usados no sistema
ALTER TABLE movimentacoes ADD CONSTRAINT movimentacoes_origem_check
CHECK (origem IN (
  'DEPOSITO',
  'PAGAMENTO',
  'RECEBIMENTO',
  'CONTA_RECEBER',
  'ESTORNO',
  'ORDEM_COMPRA',
  'ORDEM_VENDA',
  'APLICACAO',
  'RESGATE',
  'TRANSFERENCIA',
  'TRANSFERENCIA_ALTO_VALOR',
  'TRANSFERENCIA_LOTE'
));
