const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// 🔌 CONEXÃO COM O BANCO DE DADOS POSTGRESQL
const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tcc_apicultura',
  password: 'Familia@23', 
  port: 5432,
});

db.connect()
  .then(() => console.log('✅ Conectado ao banco PostgreSQL tcc_apicultura com sucesso!'))
  .catch(err => console.error('❌ Erro de conexão com o banco:', err.stack));

// =================================================================
// 1. ROTAS DE CADASTRO E GESTÃO DE PRODUTORES
// =================================================================
app.post('/produtores', async (req, res) => {
  const { nome, cpf_cnpj, tipo, telefone } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO produtor (nome, cpf_cnpj, tipo, telefone) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, cpf_cnpj, tipo, telefone]
    );
    res.status(201).json({ mensagem: 'Produtor cadastrado com sucesso!', produtor: result.rows[0] });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/produtores', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM produtor ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// =================================================================
// 2. ROTA DE RECEPÇÃO DE MEL (Substitui as fichas de papel)
// =================================================================
app.post('/recepcao-mel', async (req, res) => {
  const { produtor_id, peso_kg, tipo_recipiente, preco_quilo } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO recepcao_mel (produtor_id, peso_kg, tipo_recipiente, preco_quilo) VALUES ($1, $2, $3, $4) RETURNING *',
      [produtor_id, peso_kg, tipo_recipiente, preco_quilo]
    );
    res.status(201).json({ mensagem: 'Entrada de mel registrada!', registro: result.rows[0] });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// =================================================================
// 3. ROTA DE CONTROLE DE CERA (Regra de Associado e Não-Sócio)
// =================================================================
app.post('/controle-cera', async (req, res) => {
  const { produtor_id, quantidade_kg, tipo_processamento } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO controle_cera (produtor_id, quantidade_kg, tipo_processamento) VALUES ($1, $2, $3) RETURNING *',
      [produtor_id, quantidade_kg, tipo_processamento]
    );
    res.status(201).json({ mensagem: 'Lote de cera registrado!', registro: result.rows[0] });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// =================================================================
// 4. ROTA DE FECHAMENTO FINANCEIRO / EXTRATO DO COOPERADO
// =================================================================
app.get('/fechamento-financeiro/:produtor_id', async (req, res) => {
  const { produtor_id } = req.params;
  try {
    const produtorRes = await db.query('SELECT * FROM produtor WHERE id = $1', [produtor_id]);
    if (produtorRes.rows.length === 0) {
      return res.status(404).json({ erro: 'Produtor não encontrado.' });
    }

    const entregasRes = await db.query(
      'SELECT SUM(peso_kg * preco_quilo) AS total_bruto FROM recepcao_mel WHERE produtor_id = $1',
      [produtor_id]
    );

    const totalBruto = parseFloat(entregasRes.rows[0].total_bruto || 0);

    res.json({
      produtor: produtorRes.rows[0].nome,
      tipo: produtorRes.rows[0].tipo,
      valorBrutoTotal: totalBruto,
      valorLiquidoAReceber: totalBruto
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));