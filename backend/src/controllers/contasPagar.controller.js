const pool = require("../config/database");

/**
 * Criar conta a pagar
 */
exports.criar = async (req, res) => {
  const { id_fornecedor, id_cliente, descricao, valor, data_vencimento } = req.body;

  if (!id_fornecedor || !valor || !data_vencimento) {
    return res.status(400).json({
      erro: "Fornecedor, valor e data de vencimento sao obrigatorios",
    });
  }

  try {
    const valorNumerico = Number(valor);

    const result = await pool.query(
      `
      INSERT INTO contas_pagar
        (id_fornecedor, id_cliente, descricao, valor, data_vencimento, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDENTE')
      RETURNING *
      `,
      [id_fornecedor, id_cliente || null, descricao, valorNumerico, data_vencimento]
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
      SELECT
        cp.*,
        f.nome_razao_social AS nome_fornecedor,
        c.nome_completo AS nome_cliente
      FROM contas_pagar cp
      LEFT JOIN fornecedores f ON f.id = cp.id_fornecedor
      LEFT JOIN clientes c ON c.id = cp.id_cliente
      ORDER BY cp.data_vencimento
      `
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar contas a pagar",
    });
  }
};

/**
 * Pagar conta a pagar (GERA SAIDA DO CLIENTE E ENTRADA DO FORNECEDOR)
 */
exports.pagar = async (req, res) => {
  const { id } = req.params;
  const { id_cliente } = req.body; // Cliente que esta pagando
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Buscar a conta
    const contaResult = await client.query(
      `SELECT id, id_fornecedor, id_cliente, valor, status FROM contas_pagar WHERE id = $1`,
      [id]
    );

    if (contaResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Conta nao encontrada" });
    }

    const conta = contaResult.rows[0];

    if (conta.status !== "PENDENTE") {
      await client.query("ROLLBACK");
      return res.status(400).json({ erro: "Apenas contas pendentes podem ser pagas" });
    }

    // Usa o cliente da conta ou o informado no pagamento
    const clientePagador = id_cliente || conta.id_cliente;

    if (!clientePagador) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erro: "Informe o cliente que esta pagando" });
    }

    // 2. Verificar saldo do cliente
    const saldoResult = await client.query(
      `
      SELECT
        cl.saldo_inicial +
        COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor WHEN m.tipo = 'SAIDA' THEN -m.valor END), 0) AS saldo_atual
      FROM clientes cl
      LEFT JOIN movimentacoes m ON m.id_cliente = cl.id AND m.estornado = false
      WHERE cl.id = $1
      GROUP BY cl.id
      `,
      [clientePagador]
    );

    if (saldoResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Cliente nao encontrado" });
    }

    const saldoAtual = Number(saldoResult.rows[0].saldo_atual);

    if (saldoAtual < Number(conta.valor)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erro: "Saldo insuficiente",
        saldo_atual: saldoAtual,
        valor_conta: conta.valor,
      });
    }

    // 3. Atualizar conta como PAGA
    await client.query(
      `UPDATE contas_pagar SET status = 'PAGA', data_pagamento = NOW(), id_cliente = $2 WHERE id = $1`,
      [id, clientePagador]
    );

    // 4. Criar movimentacao de SAIDA para o cliente
    await client.query(
      `
      INSERT INTO movimentacoes
        (id_cliente, tipo, valor, origem, id_origem, descricao)
      VALUES ($1, 'SAIDA', $2, 'PAGAMENTO', $3, $4)
      `,
      [clientePagador, conta.valor, conta.id, `Pagamento conta #${conta.id}`]
    );

    // 5. Criar movimentacao de ENTRADA para o fornecedor
    await client.query(
      `
      INSERT INTO movimentacoes
        (id_fornecedor, tipo, valor, origem, id_origem, descricao)
      VALUES ($1, 'ENTRADA', $2, 'RECEBIMENTO', $3, $4)
      `,
      [conta.id_fornecedor, conta.valor, conta.id, `Recebimento conta #${conta.id}`]
    );

    await client.query("COMMIT");

    return res.json({
      mensagem: "Conta paga com sucesso",
      detalhe: "Saida registrada para o cliente e entrada registrada para o fornecedor",
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
 * Cancelar conta a pagar
 */
exports.cancelar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE contas_pagar SET status = 'CANCELADA' WHERE id = $1 AND status = 'PENDENTE' RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ erro: "Conta nao encontrada ou nao pode ser cancelada" });
    }

    return res.json({ mensagem: "Conta cancelada com sucesso" });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao cancelar conta" });
  }
};
