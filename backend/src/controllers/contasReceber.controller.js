const pool = require("../config/database");

/**
 * Criar conta a receber
 * Status inicial: PENDENTE
 */
exports.criar = async (req, res) => {
  const { id_cliente, descricao, valor, data_vencimento } = req.body;

  try {
    // 1️⃣ Verifica se cliente existe e está ativo
    const cliente = await pool.query(
      "SELECT id, ativo FROM clientes WHERE id = $1",
      [id_cliente],
    );

    if (cliente.rowCount === 0) {
      return res.status(400).json({ erro: "Cliente não encontrado" });
    }

    if (!cliente.rows[0].ativo) {
      return res
        .status(400)
        .json({ erro: "Cliente inativo não pode gerar cobrança" });
    }

    // 2️⃣ Cria a conta
    const result = await pool.query(
      `INSERT INTO contas_receber
       (id_cliente, descricao, valor, data_vencimento)
       VALUES ($1, $2, $3, $4)
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
 * Pagar conta a receber
 */
exports.pagar = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Busca a conta
    const conta = await pool.query(
      "SELECT * FROM contas_receber WHERE id = $1",
      [id],
    );

    if (conta.rowCount === 0) {
      return res.status(404).json({ erro: "Conta não encontrada" });
    }

    const contaAtual = conta.rows[0];

    // 2️⃣ Regra de transição
    if (contaAtual.status !== "PENDENTE") {
      return res
        .status(400)
        .json({ erro: "Somente contas pendentes podem ser pagas" });
    }

    // 3️⃣ Atualiza a conta
    await pool.query(
      `UPDATE contas_receber
       SET status = 'PAGA',
           data_pagamento = CURRENT_DATE
       WHERE id = $1`,
      [id],
    );

    // 4️⃣ Gera movimentação (ENTRADA)
    await pool.query(
      `INSERT INTO movimentacoes
       (tipo, valor, origem, id_origem, descricao)
       VALUES ('ENTRADA', $1, 'CONTA_RECEBER', $2, 'Pagamento de conta a receber')`,
      [contaAtual.valor, id],
    );

    return res.json({ mensagem: "Conta paga com sucesso" });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao pagar conta",
      detalhe: error.message,
    });
  }
};

/**
 * Cancelar conta a receber
 */
exports.cancelar = async (req, res) => {
  const { id } = req.params;

  try {
    const conta = await pool.query(
      "SELECT status FROM contas_receber WHERE id = $1",
      [id],
    );

    if (conta.rowCount === 0) {
      return res.status(404).json({ erro: "Conta não encontrada" });
    }

    if (conta.rows[0].status !== "PENDENTE") {
      return res.status(400).json({
        erro: "Somente contas pendentes podem ser canceladas",
      });
    }

    await pool.query(
      `UPDATE contas_receber
       SET status = 'CANCELADA'
       WHERE id = $1`,
      [id],
    );

    return res.json({ mensagem: "Conta cancelada com sucesso" });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao cancelar conta",
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
      `SELECT c.*, cl.nome_completo
       FROM contas_receber c
       JOIN clientes cl ON cl.id = c.id_cliente
       ORDER BY c.data_vencimento`,
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar contas",
      detalhe: error.message,
    });
  }
};
