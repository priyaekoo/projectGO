const pool = require("../config/database");

/**
 * Criar conta a receber
 */
exports.criar = async (req, res) => {
  const { id_cliente, descricao, valor, data_vencimento } = req.body;

  if (!id_cliente || !valor || !data_vencimento) {
    return res.status(400).json({
      erro: "Cliente, valor e data de vencimento são obrigatórios",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contas_receber
       (id_cliente, descricao, valor, data_vencimento, status)
       VALUES ($1, $2, $3, $4, 'PENDENTE')
       RETURNING *`,
      [id_cliente, descricao, valor, data_vencimento],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao criar conta a receber",
      detalhe: error.message,
    });
  }
};

/**
 * Listar contas a receber
 */
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, c.nome_completo
       FROM contas_receber cr
       JOIN clientes c ON c.id = cr.id_cliente
       ORDER BY cr.data_vencimento`,
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar contas",
    });
  }
};

/**
 * Pagar conta a receber
 */
exports.pagar = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Busca a conta
    const conta = await client.query(
      `
      SELECT id, id_cliente, valor, status
      FROM contas_receber
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

    const { id_cliente, valor } = conta.rows[0];

    // 2️⃣ Atualiza status da conta
    await client.query(
      `
      UPDATE contas_receber
      SET status = 'PAGA', data_pagamento = NOW()
      WHERE id = $1
      `,
      [id],
    );

    // 3️⃣ Cria movimentação (ENTRADA)
    await client.query(
      `
      INSERT INTO movimentacoes
      (id_cliente, tipo, valor, origem, id_origem, descricao)
      VALUES ($1, 'ENTRADA', $2, 'CONTA_RECEBER', $3, 'Pagamento de conta a receber')
      `,
      [id_cliente, valor, id],
    );

    await client.query("COMMIT");

    return res.json({
      mensagem: "Conta paga e saldo atualizado com sucesso",
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
