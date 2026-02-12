-- =====================================================
-- SETUP: 5 Cenarios Criticos Financeiros - BTG Pactual
-- =====================================================
-- Executar: psql -U postgres -d projectgo -f backend/src/config/setup_cenarios.sql

-- =====================================================
-- 1. ALTER TABLES EXISTENTES
-- =====================================================

-- Perfil de usuario (admin, analista, operador)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil VARCHAR(20) DEFAULT 'operador';

-- Campos AML/PEP em clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pep BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nivel_risco VARCHAR(20) DEFAULT 'BAIXO';

-- =====================================================
-- 2. TABELA: investigacoes_aml
-- =====================================================
CREATE TABLE IF NOT EXISTS investigacoes_aml (
  id SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES clientes(id),
  id_analista INTEGER NOT NULL REFERENCES usuarios(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ABERTA',
  motivo TEXT NOT NULL,
  conclusao TEXT,
  nivel_risco VARCHAR(20) DEFAULT 'MEDIO',
  data_abertura TIMESTAMP DEFAULT NOW(),
  data_fechamento TIMESTAMP
);

-- =====================================================
-- 3. TABELA: audit_log
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id),
  acao VARCHAR(50) NOT NULL,
  tabela_alvo VARCHAR(50),
  id_registro INTEGER,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  data_hora TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA: fundos_investimento
-- =====================================================
CREATE TABLE IF NOT EXISTS fundos_investimento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  benchmark VARCHAR(30),
  taxa_administracao NUMERIC(5,2) DEFAULT 0,
  taxa_performance NUMERIC(5,2) DEFAULT 0,
  rentabilidade_anual NUMERIC(8,4) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. TABELA: aplicacoes
-- =====================================================
CREATE TABLE IF NOT EXISTS aplicacoes (
  id SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES clientes(id),
  id_fundo INTEGER NOT NULL REFERENCES fundos_investimento(id),
  valor_aplicado NUMERIC(15,2) NOT NULL,
  data_aplicacao TIMESTAMP DEFAULT NOW(),
  data_resgate TIMESTAMP,
  valor_resgate NUMERIC(15,2),
  status VARCHAR(20) DEFAULT 'ATIVA',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. TABELA: indices_mercado
-- =====================================================
CREATE TABLE IF NOT EXISTS indices_mercado (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  data DATE NOT NULL,
  valor NUMERIC(10,4) NOT NULL,
  UNIQUE(tipo, data)
);

-- =====================================================
-- 7. TABELA: ativos
-- =====================================================
CREATE TABLE IF NOT EXISTS ativos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  preco_atual NUMERIC(15,2) NOT NULL,
  ativo BOOLEAN DEFAULT true
);

-- =====================================================
-- 8. TABELA: ordens
-- =====================================================
CREATE TABLE IF NOT EXISTS ordens (
  id SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES clientes(id),
  id_ativo INTEGER NOT NULL REFERENCES ativos(id),
  tipo VARCHAR(10) NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC(15,2) NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDENTE',
  motivo_rejeicao TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_execucao TIMESTAMP
);

-- =====================================================
-- 9. TABELA: config_mercado
-- =====================================================
CREATE TABLE IF NOT EXISTS config_mercado (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(50) NOT NULL UNIQUE,
  valor VARCHAR(100) NOT NULL
);

-- =====================================================
-- 10. TABELA: transacoes_externas
-- =====================================================
CREATE TABLE IF NOT EXISTS transacoes_externas (
  id SERIAL PRIMARY KEY,
  codigo_externo VARCHAR(50) NOT NULL UNIQUE,
  id_cliente INTEGER REFERENCES clientes(id),
  tipo VARCHAR(20) NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  descricao TEXT,
  data_transacao TIMESTAMP NOT NULL,
  origem VARCHAR(30) DEFAULT 'SPB',
  status VARCHAR(20) DEFAULT 'PENDENTE',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 11. TABELA: conciliacoes
-- =====================================================
CREATE TABLE IF NOT EXISTS conciliacoes (
  id SERIAL PRIMARY KEY,
  id_transacao_externa INTEGER REFERENCES transacoes_externas(id),
  id_movimentacao INTEGER REFERENCES movimentacoes(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  tipo_divergencia VARCHAR(30),
  valor_interno NUMERIC(15,2),
  valor_externo NUMERIC(15,2),
  diferenca NUMERIC(15,2),
  observacao TEXT,
  data_conciliacao TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Ativos B3
INSERT INTO ativos (codigo, nome, tipo, preco_atual) VALUES
  ('PETR4', 'Petrobras PN', 'ACAO', 38.50),
  ('VALE3', 'Vale ON', 'ACAO', 68.20),
  ('ITUB4', 'Itau Unibanco PN', 'ACAO', 32.80),
  ('BBDC4', 'Bradesco PN', 'ACAO', 15.40),
  ('ABEV3', 'Ambev ON', 'ACAO', 12.90),
  ('WEGE3', 'WEG ON', 'ACAO', 42.10),
  ('RENT3', 'Localiza ON', 'ACAO', 58.30),
  ('BBAS3', 'Banco do Brasil ON', 'ACAO', 28.70),
  ('MGLU3', 'Magazine Luiza ON', 'ACAO', 2.15),
  ('BOVA11', 'iShares Ibovespa', 'ETF', 118.50)
ON CONFLICT (codigo) DO NOTHING;

-- Fundos de Investimento
INSERT INTO fundos_investimento (nome, tipo, benchmark, taxa_administracao, taxa_performance, rentabilidade_anual) VALUES
  ('BTG RF DI', 'RENDA_FIXA', 'CDI', 0.50, 0, 12.80),
  ('BTG Multimercado Macro', 'MULTIMERCADO', 'CDI', 1.80, 20.00, 15.20),
  ('BTG Acoes Value', 'ACOES', 'IBOVESPA', 2.00, 20.00, 22.50),
  ('BTG Credito Privado', 'RENDA_FIXA', 'CDI', 1.20, 10.00, 14.30),
  ('BTG Small Caps', 'ACOES', 'SMLL', 2.50, 20.00, -8.40)
ON CONFLICT DO NOTHING;

-- Indices de Mercado (ultimos 30 dias simulados)
INSERT INTO indices_mercado (tipo, data, valor) VALUES
  ('CDI', CURRENT_DATE - INTERVAL '30 days', 0.0413),
  ('CDI', CURRENT_DATE - INTERVAL '20 days', 0.0413),
  ('CDI', CURRENT_DATE - INTERVAL '10 days', 0.0415),
  ('CDI', CURRENT_DATE, 0.0415),
  ('IBOVESPA', CURRENT_DATE - INTERVAL '30 days', 128500.00),
  ('IBOVESPA', CURRENT_DATE - INTERVAL '20 days', 130200.00),
  ('IBOVESPA', CURRENT_DATE - INTERVAL '10 days', 127800.00),
  ('IBOVESPA', CURRENT_DATE, 131000.00),
  ('SELIC', CURRENT_DATE - INTERVAL '30 days', 13.25),
  ('SELIC', CURRENT_DATE, 13.25)
ON CONFLICT (tipo, data) DO NOTHING;

-- Config de Mercado (horarios B3)
INSERT INTO config_mercado (chave, valor) VALUES
  ('MERCADO_ABERTURA', '10:00'),
  ('MERCADO_FECHAMENTO', '17:00'),
  ('MERCADO_PRE_ABERTURA', '09:45'),
  ('MERCADO_AFTER_MARKET', '17:30'),
  ('MERCADO_AFTER_MARKET_FIM', '18:00'),
  ('MERCADO_DIAS_UTEIS', 'SEG,TER,QUA,QUI,SEX')
ON CONFLICT (chave) DO NOTHING;

-- Atualizar perfil do primeiro usuario para admin (se existir)
UPDATE usuarios SET perfil = 'admin' WHERE id = 1;
