-- Criar o Schema apicultura se não existir
CREATE SCHEMA IF NOT EXISTS apicultura;

-- 1. Tabela de Produtores
CREATE TABLE IF NOT EXISTS apicultura.produtor (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf_cnpj VARCHAR(20),
  tipo VARCHAR(20) DEFAULT 'ASSOCIADO',
  telefone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Recebimento de Mel / Cera
CREATE TABLE IF NOT EXISTS apicultura.recebimento (
  id BIGSERIAL PRIMARY KEY,
  produtor_id BIGINT REFERENCES apicultura.produtor(id),
  produto VARCHAR(50) NOT NULL,
  tipo_recipiente VARCHAR(50),
  quantidade_recipientes INT DEFAULT 1,
  peso_liquido_kg NUMERIC(10,2) NOT NULL,
  data_recebimento DATE DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Insumos
CREATE TABLE IF NOT EXISTS apicultura.insumo (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) DEFAULT 'EMBALAGEM',
  unidade_medida VARCHAR(20) DEFAULT 'UN',
  quantidade_estoque NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Movimentação de Insumos
CREATE TABLE IF NOT EXISTS apicultura.movimentacao_insumo (
  id BIGSERIAL PRIMARY KEY,
  insumo_id BIGINT REFERENCES apicultura.insumo(id) ON DELETE CASCADE,
  tipo_movimentacao VARCHAR(10) NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL,
  data_movimentacao DATE DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Repasse / Acerto Financeiro
CREATE TABLE IF NOT EXISTS apicultura.repasse_financeiro (
  id BIGSERIAL PRIMARY KEY,
  produtor_id BIGINT REFERENCES apicultura.produtor(id),
  total_kg_mel NUMERIC(10,2) NOT NULL,
  preco_por_kg NUMERIC(10,2) NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  data_acerto DATE DEFAULT CURRENT_DATE,
  status_pagamento VARCHAR(20) DEFAULT 'PENDENTE',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados Iniciais para Insumos
INSERT INTO apicultura.insumo (nome, categoria, unidade_medida, quantidade_estoque) VALUES
('Balde Plástico 20L', 'EMBALAGEM', 'UN', 150),
('Frasco de Vidro 500g', 'EMBALAGEM', 'UN', 500),
('Frasco de Vidro 1kg', 'EMBALAGEM', 'UN', 300),
('Rótulo Tradicional 500g', 'ROTULO', 'UN', 1000),
('Cera Alveolada (kg)', 'CERA', 'KG', 85)
ON CONFLICT DO NOTHING;

-- Permissões de Acesso para a API (Supabase)
GRANT ALL ON ALL TABLES IN SCHEMA apicultura TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA apicultura TO anon, authenticated, service_role;

ALTER TABLE apicultura.produtor DISABLE ROW LEVEL SECURITY;
ALTER TABLE apicultura.recebimento DISABLE ROW LEVEL SECURITY;
ALTER TABLE apicultura.insumo DISABLE ROW LEVEL SECURITY;
ALTER TABLE apicultura.movimentacao_insumo DISABLE ROW LEVEL SECURITY;
ALTER TABLE apicultura.repasse_financeiro DISABLE ROW LEVEL SECURITY;