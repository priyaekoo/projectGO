const pool = require("../config/database");

/**
 * Normaliza valor monetário
 * Aceita "250,00" ou 250.00
 */
function normalizarValor(valor) {
  if (typeof valor === "string") {
    return Number(valor.replace(",", "."));
  }
  return Number(valor);
}

/**
 * Criar conta a pagar
 */
exports.criar = async (req, res) => {
  const { id_fornecedor, descricao, valor, data_vencimento } = req.body;

  if (!id_fornecedor || !valor || !data_vencimento) {
    return res.status(400).json({
      erro: "Fornecedor, valor e data de vencimento são obrigatórios",
    });
  }

  const valorNumerico = normalizarValor(valor);

  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    return res.status(400).json({
      erro: "Valor inválido",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO contas_pagar
        (id_fornecedor, descricao, valor, data_vencimento, status)
      VALUES ($1, $2, $3, $4, 'PENDENTE')
      RETURNING *
      `,
      [id_fornecedor, descricao, valorNumerico, data_vencimento],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao criar conta a pagar",
      detalhe: error.message,
    });
  }
};

/**
 * Listar contas a pagar
 */
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT cp.*
      FROM contas_pagar cp
      ORDER BY cp.data_vencimento
      `,
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar contas a pagar",
    });
  }
};

/**
 * Pagar conta
 */
exports.pagar = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const conta = await client.query(
      `
      SELECT id, valor, status
      FROM contas_pagar
      WHERE id = $1
      `,
      [id],
    );

    if (conta.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Conta não encontrada" });
    }

    if (conta.rows[0].status !== "PENDENTE") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erro: "Apenas contas pendentes podem ser pagas",
      });
    }

    await client.query(
      `
      UPDATE contas_pagar
      SET status = 'PAGA',
          data_pagamento = NOW()
      WHERE id = $1
      `,
      [id],
    );

    await client.query("COMMIT");

    return res.json({
      mensagem: "Conta paga com sucesso",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      erro: "Erro ao pagar conta",
      detalhe: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Cancelar conta
 */
exports.cancelar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE contas_pagar
      SET status = 'CANCELADA'
      WHERE id = $1
        AND status = 'PENDENTE'
      RETURNING *
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        erro: "Conta não encontrada ou não pode ser cancelada",
      });
    }

    return res.json({
      mensagem: "Conta cancelada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao cancelar conta",
    });
  }
};
