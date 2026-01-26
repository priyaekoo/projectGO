const pool = require("../config/database");
const { cpf, cnpj } = require("cpf-cnpj-validator");

/**
 * Criar cliente
 */
exports.criar = async (req, res) => {
  const { nome_completo, email, cpf_cnpj, observacao } = req.body;

  if (!cpf.isValid(cpf_cnpj) && !cnpj.isValid(cpf_cnpj)) {
    return res.status(400).json({ erro: "CPF ou CNPJ inválido" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO clientes
        (nome_completo, email, cpf_cnpj, observacao)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nome_completo, email, cpf_cnpj, observacao],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao criar cliente",
      detalhe: error.message,
    });
  }
};

/**
 * Listar clientes
 */
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clientes ORDER BY nome_completo",
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar clientes",
    });
  }
};

/**
 * Atualizar cliente
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome_completo, email, observacao } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE clientes
      SET nome_completo = $1,
          email = $2,
          observacao = $3
      WHERE id = $4
      RETURNING *
      `,
      [nome_completo, email, observacao, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao atualizar cliente",
    });
  }
};

/**
 * Inativar cliente
 */
exports.inativar = async (req, res) => {
  try {
    await pool.query("UPDATE clientes SET ativo = false WHERE id = $1", [
      req.params.id,
    ]);
    return res.json({ mensagem: "Cliente inativado" });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao inativar cliente",
    });
  }
};

/**
 * Reativar cliente
 */
exports.reativar = async (req, res) => {
  try {
    await pool.query("UPDATE clientes SET ativo = true WHERE id = $1", [
      req.params.id,
    ]);
    return res.json({ mensagem: "Cliente reativado" });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao reativar cliente",
    });
  }
};

/**
 * 💰 CONSULTAR SALDO (ENTRADA - SAÍDA)
 */
exports.consultarSaldo = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        cl.id,
        cl.nome_completo,
        cl.saldo_inicial,
        cl.saldo_inicial +
        COALESCE(
          SUM(
            CASE
              WHEN m.tipo = 'ENTRADA' THEN m.valor
              WHEN m.tipo = 'SAIDA' THEN -m.valor
            END
          ),
          0
        ) AS saldo_atual
      FROM clientes cl
      LEFT JOIN movimentacoes m ON m.id_cliente = cl.id
      WHERE cl.id = $1
      GROUP BY cl.id
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao consultar saldo",
      detalhe: error.message,
    });
  }
};

/**
 * 📄 EXTRATO FINANCEIRO
 */
exports.extrato = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        tipo,
        valor,
        origem,
        descricao,
        data_movimentacao
      FROM movimentacoes
      WHERE id_cliente = $1
      ORDER BY data_movimentacao DESC
      `,
      [id],
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao consultar extrato",
    });
  }
};
