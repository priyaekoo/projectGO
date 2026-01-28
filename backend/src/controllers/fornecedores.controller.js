const pool = require("../config/database");
const { cpf, cnpj } = require("cpf-cnpj-validator");

/**
 * Criar fornecedor
 */
exports.criar = async (req, res) => {
  const { nome_razao_social, cpf_cnpj, tipo, observacao } = req.body;

  // Valida CPF ou CNPJ
  if (!cpf.isValid(cpf_cnpj) && !cnpj.isValid(cpf_cnpj)) {
    return res.status(400).json({ erro: "CPF ou CNPJ inválido" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO fornecedores
        (nome_razao_social, cpf_cnpj, tipo, observacao)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nome_razao_social, cpf_cnpj, tipo, observacao]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    // CPF/CNPJ duplicado
    if (error.code === "23505") {
      return res.status(400).json({ erro: "CPF/CNPJ já cadastrado" });
    }
    return res.status(500).json({
      erro: "Erro ao criar fornecedor",
      detalhe: error.message,
    });
  }
};

/**
 * Listar fornecedores (apenas ativos por padrão)
 */
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM fornecedores ORDER BY nome_razao_social"
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar fornecedores",
    });
  }
};

/**
 * Consultar fornecedor por ID
 */
exports.consultarPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM fornecedores WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao consultar fornecedor",
    });
  }
};

/**
 * Atualizar fornecedor
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome_razao_social, tipo, observacao } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE fornecedores
      SET nome_razao_social = $1,
          tipo = $2,
          observacao = $3
      WHERE id = $4
      RETURNING *
      `,
      [nome_razao_social, tipo, observacao, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao atualizar fornecedor",
    });
  }
};

/**
 * Inativar fornecedor (soft delete)
 */
exports.inativar = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE fornecedores SET ativo = false WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }

    return res.json({ mensagem: "Fornecedor inativado" });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao inativar fornecedor",
    });
  }
};

/**
 * Reativar fornecedor
 */
exports.reativar = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE fornecedores SET ativo = true WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }

    return res.json({ mensagem: "Fornecedor reativado" });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao reativar fornecedor",
    });
  }
};

/**
 * Consultar saldo do fornecedor
 */
exports.consultarSaldo = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        f.id,
        f.nome_razao_social,
        COALESCE(
          SUM(
            CASE
              WHEN m.tipo = 'ENTRADA' THEN m.valor
              WHEN m.tipo = 'SAIDA' THEN -m.valor
            END
          ),
          0
        ) AS saldo_atual
      FROM fornecedores f
      LEFT JOIN movimentacoes m ON m.id_fornecedor = f.id AND m.estornado = false
      WHERE f.id = $1
      GROUP BY f.id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Fornecedor nao encontrado" });
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
 * Extrato financeiro do fornecedor
 */
exports.extrato = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        tipo,
        valor,
        origem,
        descricao,
        data_movimentacao,
        estornado
      FROM movimentacoes
      WHERE id_fornecedor = $1
      ORDER BY data_movimentacao DESC
      `,
      [id]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao consultar extrato",
    });
  }
};
